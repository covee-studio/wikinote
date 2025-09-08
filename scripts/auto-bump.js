#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

function incPatch(version) {
  const [major, minor, patchWithPre] = version.split('.');
  const patch = (patchWithPre || '0').split('-')[0];
  return `${Number(major)}.${Number(minor)}.${Number(patch) + 1}`;
}

function getLastTag() {
  try {
    return execSync('git describe --tags --abbrev=0', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
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
  const newVersion = incPatch(oldVersion);

  // Analyze commits
  const lastTag = getLastTag();
  const subjects = getCommitsSince(lastTag);
  const summary = summarizeCommitsEnglish(subjects);

  // Update package.json
  pkg.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  // Update manifest.json
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.version = newVersion;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  // Update CHANGELOG.md (prepend English-only entry)
  const date = new Date().toISOString().slice(0, 10);
  const entry = `\n## v${newVersion} - ${date}\n\n${summary}\n`;
  let existing = '';
  if (existsSync(changelogPath)) {
    existing = readFileSync(changelogPath, 'utf8');
  } else {
    existing = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n';
  }
  const updated = existing.startsWith('# Changelog')
    ? existing + entry
    : `# Changelog\n\n${entry}\n${existing}`;
  writeFileSync(changelogPath, updated.trim() + '\n', 'utf8');

  // Git commit and tag (with [skip ci])
  execSync('git config user.name "github-actions[bot]"');
  execSync('git config user.email "github-actions[bot]@users.noreply.github.com"');
  execSync('git add -A', { stdio: 'inherit' });
  execSync(`git commit -m "chore(release): v${newVersion} [skip ci]"`, { stdio: 'inherit' });
  execSync(`git tag v${newVersion}`, { stdio: 'inherit' });

  console.log(`Bumped to v${newVersion}`);
}

main();
