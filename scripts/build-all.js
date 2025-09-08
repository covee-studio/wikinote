#!/usr/bin/env node

import { execSync } from 'child_process';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildAll() {
  console.log('🚀 Starting build process for both Web and Chrome Extension...\n');
  
  try {
    // 构建Web版本
    console.log('📱 Building Web version...');
    execSync('npm run build:web', { 
      stdio: 'inherit',
      cwd: resolve(__dirname, '..')
    });
    
    console.log('\n✅ Web build completed!\n');
    
    // 构建Extension版本
    console.log('🔧 Building Chrome Extension...');
    execSync('npm run build:extension', { 
      stdio: 'inherit',
      cwd: resolve(__dirname, '..')
    });
    
    console.log('\n✅ Extension build completed!\n');
    
    console.log('🎉 All builds completed successfully!');
    console.log('\n📁 Output directories:');
    console.log('   Web: dist/web/');
    console.log('   Extension: dist/extension/');
    console.log('\n💡 To test the extension:');
    console.log('   1. Open chrome://extensions/');
    console.log('   2. Enable "Developer mode"');
    console.log('   3. Click "Load unpacked"');
    console.log('   4. Select the dist/extension folder');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildAll(); 