#!/usr/bin/env node

import { build } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const webConfig = resolve(__dirname, '../configs/web/vite.config.ts');

async function buildWeb() {
  console.log('🚀 Building Web version...');
  
  try {
    await build({
      configFile: webConfig,
      mode: 'production',
    });
    
    console.log('✅ Web build completed successfully!');
    console.log('📁 Output: dist/web/');
  } catch (error) {
    console.error('❌ Web build failed:', error);
    process.exit(1);
  }
}

buildWeb(); 