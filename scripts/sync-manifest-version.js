#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

function sync() {
  const pkgPath = resolve(process.cwd(), 'package.json');
  const manifestPath = resolve(process.cwd(), 'configs/extension/manifest.json');

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  if (manifest.version !== pkg.version) {
    manifest.version = pkg.version;
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
    console.log(`✅ Synced manifest version to ${pkg.version}`);
  } else {
    console.log('ℹ️ Manifest version already in sync.');
  }
}

sync();
