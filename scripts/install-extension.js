#!/usr/bin/env node

import { execSync } from 'child_process';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function openChromeExtensions() {
  const extensionPath = resolve(__dirname, '../dist/extension');
  
  if (!existsSync(extensionPath)) {
    console.error('❌ Extension not found. Please run "npm run build:extension" first.');
    process.exit(1);
  }
  
  console.log('🚀 Opening Chrome Extensions page...');
  console.log('📁 Extension path:', extensionPath);
  console.log('\n📋 Installation steps:');
  console.log('1. Enable "Developer mode" in the top right');
  console.log('2. Click "Load unpacked"');
  console.log('3. Select the extension folder:', extensionPath);
  console.log('4. Open a new tab to test the extension');
  
  try {
    // 尝试打开Chrome扩展管理页面
    const platform = process.platform;
    let command;
    
    if (platform === 'darwin') {
      // macOS
      command = 'open -a "Google Chrome" "chrome://extensions/"';
    } else if (platform === 'win32') {
      // Windows
      command = 'start chrome "chrome://extensions/"';
    } else {
      // Linux
      command = 'google-chrome "chrome://extensions/"';
    }
    
    execSync(command, { stdio: 'inherit' });
    console.log('\n✅ Chrome Extensions page opened!');
  } catch (error) {
    console.log('\n📝 Manual steps:');
    console.log('1. Open Chrome');
    console.log('2. Go to: chrome://extensions/');
    console.log('3. Enable "Developer mode"');
    console.log('4. Click "Load unpacked"');
    console.log('5. Select:', extensionPath);
  }
}

openChromeExtensions(); 