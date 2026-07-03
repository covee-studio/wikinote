#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

function incPatch(version) {
  const [major, minor, patchWithPre] = version.split('.');
  const patch = (patchWithPre || '0').split('-')[0];
  return `${Number(major)}.${Number(minor)}.${Number(patch) + 1}`;
}

function tagName(version) {
  return `v${version}`;
}

function tagExists(tag) {
  try {
    execSync(`git rev-parse --verify --quiet refs/tags/${tag}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function getLastStableTag() {
  try {
    const out = execSync('git tag --list "v*" --sort=-v:refname', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString();
    return out
      .split('\n')
      .map((s) => s.trim())
      .find((tag) => /^v\d+\.\d+\.\d+$/.test(tag)) ?? null;
  } catch {
    return null;
  }
}

function getCommitsSince(ref) {
  const range = ref ? `${ref}..HEAD` : '';
  // Subject only, ignore merges
  const cmd = `git log ${range} --no-merges --pretty=format:%s`;
  try {
    const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    return out
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function hasChangelogEntry(content, version) {
  return new RegExp(`^## v${version.replace(/\./g, '\\.')}\\b`, 'm').test(content);
}

function writeChangelogEntry(changelogPath, version, summary) {
  const date = new Date().toISOString().slice(0, 10);
  const entry = `\n## v${version} - ${date}\n\n${summary}\n`;
  let existing = '';
  if (existsSync(changelogPath)) {
    existing = readFileSync(changelogPath, 'utf8');
  } else {
    existing = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n';
  }
  if (hasChangelogEntry(existing, version)) return;
  const updated = existing.startsWith('# Changelog')
    ? existing.replace(/^(# Changelog[^\n]*\n(\n[^\n]*\n)?)/, `$1${entry}\n`)
    : `# Changelog\n\n${entry}\n${existing}`;
  writeFileSync(changelogPath, updated.trim() + '\n', 'utf8');
}

function summarizeCommitsEnglish(subjects) {
  const counters = {
    added: 0,
    fixed: 0,
    changed: 0,
    performance: 0,
    docs: 0,
    chore: 0,
  };

  const rules = [
    { key: 'added', patterns: [/^feat/i, /feature/i, /add(ed)?/i, /新增|添加|增加/] },
    { key: 'fixed', patterns: [/^fix/i, /bug/i, /hotfix/i, /修复|修正|问题/] },
    { key: 'changed', patterns: [/^refactor/i, /change(d)?/i, /update(d)?/i, /重构|调整|优化结构/] },
    { key: 'performance', patterns: [/^perf/i, /performance/i, /优化|性能/] },
    { key: 'docs', patterns: [/^docs/i, /readme/i, /文档|说明/] },
    { key: 'chore', patterns: [/^chore/i, /build/i, /ci/i, /配置|构建|依赖|升级/] },
  ];

  for (const s of subjects) {
    let matched = false;
    for (const r of rules) {
      if (r.patterns.some((p) => p.test(s))) {
        counters[r.key] += 1;
        matched = true;
        break;
      }
    }
    if (!matched) counters.changed += 1; // default bucket
  }

  const lines = [];
  if (counters.added) lines.push(`- Added: ${counters.added} change(s)`);
  if (counters.fixed) lines.push(`- Fixed: ${counters.fixed} issue(s)`);
  if (counters.performance) lines.push(`- Performance: ${counters.performance} improvement(s)`);
  if (counters.docs) lines.push(`- Docs: ${counters.docs} update(s)`);
  if (counters.changed) lines.push(`- Changed: ${counters.changed} update(s)`);
  if (counters.chore) lines.push(`- Chore: ${counters.chore} task(s)`);

  if (lines.length === 0) {
    lines.push('- General improvements and maintenance.');
  }
  return lines.join('\n');
}

function main() {
  const cwd = process.cwd();
  const pkgPath = resolve(cwd, 'package.json');
  const manifestPath = resolve(cwd, 'configs/extension/manifest.json');
  const changelogPath = resolve(cwd, 'CHANGELOG.md');

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const oldVersion = pkg.version;
  // If the current version already has a stable tag, this push contains new
  // changes and should get a patch bump. If the current version is untagged,
  // respect it (for example a PR that intentionally bumped minor/major).
  const newVersion = tagExists(tagName(oldVersion)) ? incPatch(oldVersion) : oldVersion;

  // Analyze commits
  const lastTag = getLastStableTag();
  const subjects = getCommitsSince(lastTag);
  const summary = summarizeCommitsEnglish(subjects);

  // Update package.json
  if (pkg.version !== newVersion) {
    pkg.version = newVersion;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  }

  // Update manifest.json
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.version !== newVersion) {
    manifest.version = newVersion;
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  }

  // Update CHANGELOG.md (prepend English-only entry if missing)
  writeChangelogEntry(changelogPath, newVersion, summary);

  // Git commit and tag (with [skip ci])
  execSync('git config user.name "github-actions[bot]"');
  execSync('git config user.email "github-actions[bot]@users.noreply.github.com"');
  const changed = execSync('git status --short', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
  if (changed) {
    execSync('git add -A', { stdio: 'inherit' });
    execSync(`git commit -m "chore(release): v${newVersion} [skip ci]"`, { stdio: 'inherit' });
  }
  const releaseTag = tagName(newVersion);
  if (!tagExists(releaseTag)) {
    execSync(`git tag ${releaseTag}`, { stdio: 'inherit' });
  }

  console.log(`Bumped to v${newVersion}`);
}

main();
