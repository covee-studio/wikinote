#!/usr/bin/env node

import { execFileSync } from 'child_process';
import { resolve } from 'path';
import { existsSync, mkdirSync, unlinkSync, readFileSync } from 'fs';

function pack() {
  const distDir = resolve(process.cwd(), 'dist');
  const extDir = resolve(distDir, 'extension');
  const zipPath = resolve(distDir, 'wikinote-extension.zip');

  if (!existsSync(extDir)) {
    console.error('❌ Extension directory not found. Build it first: npm run build:extension');
    process.exit(1);
  }

  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }

  try {
    const manifest = JSON.parse(readFileSync(resolve(extDir, 'manifest.json'), 'utf8'));
    const requiredFiles = [manifest.chrome_url_overrides?.newtab, ...Object.values(manifest.icons ?? {})];
    if (!requiredFiles.length || requiredFiles.some(file => !file || !existsSync(resolve(extDir, file)))) {
      throw new Error('The extension is missing its new-tab entry or icons.');
    }
    // -r: recursive, -X: strip extra file attributes, -q: quiet
    if (existsSync(zipPath)) unlinkSync(zipPath);
    execFileSync('zip', ['-r', '-X', '-q', zipPath, '.'], { cwd: extDir, stdio: 'inherit' });
    console.log(`\n✅ Packed: ${zipPath}`);
  } catch (err) {
    console.error('❌ Failed to create zip:', err.message);
    process.exit(1);
  }
}

pack();
