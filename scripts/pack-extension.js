#!/usr/bin/env node

import { execSync } from 'child_process';
import { resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';

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
    // -r: recursive, -X: strip extra file attributes, -q: quiet
    execSync(`cd ${distDir} && rm -f wikinote-extension.zip && zip -r -X -q wikinote-extension.zip extension` , { stdio: 'inherit' });
    console.log(`\n✅ Packed: ${zipPath}`);
  } catch (err) {
    console.error('❌ Failed to create zip. Ensure the "zip" command is available.');
    process.exit(1);
  }
}

pack();
