#!/usr/bin/env node
/**
 * Bumps the version to a beta pre-release for PR builds.
 *
 * Strategy: read the current package.json patch base, then query GitHub
 * releases to find the highest existing beta index for that base version.
 * Output: <base>-beta.<n+1>   e.g. 1.0.3-beta.2
 *
 * Required env vars (set by the workflow):
 *   GH_TOKEN   – GITHUB_TOKEN for GitHub API access
 *   PR_NUMBER  – pull_request.number from the GitHub context
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

function patchBase(version) {
  // Strip any existing pre-release suffix and return major.minor.patch
  return version.split('-')[0];
}

async function getNextBetaIndex(base, token, repo) {
  const url = `https://api.github.com/repos/${repo}/releases?per_page=100`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!res.ok) {
    // If we can't reach the API just start at 1
    console.warn(`GitHub API returned ${res.status}, defaulting beta index to 1`);
    return 1;
  }

  const releases = await res.json();
  // Match tags like v1.0.3-beta.N
  const pattern = new RegExp(`^v${base.replace(/\./g, '\\.')}-beta\\.(\\d+)$`);
  let max = 0;
  for (const r of releases) {
    const m = r.tag_name.match(pattern);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

async function main() {
  const token = process.env.GH_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY; // owner/repo injected by Actions
  if (!token || !repo) {
    throw new Error('GH_TOKEN and GITHUB_REPOSITORY must be set');
  }

  const cwd = process.cwd();
  const pkgPath = resolve(cwd, 'package.json');
  const manifestPath = resolve(cwd, 'configs/extension/manifest.json');

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const base = patchBase(pkg.version);

  const betaIndex = await getNextBetaIndex(base, token, repo);
  const newVersion = `${base}-beta.${betaIndex}`;

  // Update package.json
  pkg.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  // Update manifest.json — Chrome requires a clean semver (no pre-release suffix)
  // so we write the base version there to stay store-compliant.
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.version = base;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log(`Bumped to ${newVersion} (manifest pinned to ${base})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
