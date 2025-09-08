#!/usr/bin/env node

import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { copyFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if sharp is installed
async function checkSharp() {
  try {
    const sharp = await import('sharp');
    return sharp;
  } catch (error) {
    return null;
  }
}

// Generate PNG icons in different sizes
async function generatePNGIcons() {
  const sharp = await checkSharp();
  if (!sharp) {
    console.error('❌ Sharp is not installed. Please install first: npm install sharp');
    return false;
  }

  const sourceLogo = resolve(__dirname, '../assets/logo/logo.png');
  const publicDir = resolve(__dirname, '../public');
  const extensionIconsDir = resolve(__dirname, '../dist/extension/icons');
  
  if (!existsSync(sourceLogo)) {
    console.error('❌ Logo file does not exist:', sourceLogo);
    return false;
  }

  const iconSizes = [
    { name: 'favicon-96x96.png', size: 96, dest: publicDir },
    { name: 'apple-touch-icon.png', size: 180, dest: publicDir },
    { name: 'web-app-manifest-192x192.png', size: 192, dest: publicDir },
    { name: 'web-app-manifest-512x512.png', size: 512, dest: publicDir },
    { name: 'icon-16.png', size: 16, dest: extensionIconsDir },
    { name: 'icon-32.png', size: 32, dest: extensionIconsDir },
    { name: 'icon-48.png', size: 48, dest: extensionIconsDir },
    { name: 'icon-128.png', size: 128, dest: extensionIconsDir },
    { name: 'icon-192x192.png', size: 192, dest: extensionIconsDir },
    { name: 'icon-512x512.png', size: 512, dest: extensionIconsDir },
  ];

  console.log('🎨 Generating PNG icons...');

  for (const icon of iconSizes) {
    try {
      // Ensure destination directory exists
      if (!existsSync(icon.dest)) {
        await mkdir(icon.dest, { recursive: true });
      }

      const destPath = resolve(icon.dest, icon.name);
      
      // Generate icon with sharp
      await sharp.default(sourceLogo)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(destPath);
      
      console.log(`✅ Generated: ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${icon.name}:`, error.message);
    }
  }

  return true;
}

// Generate ICO (simplified: use PNG instead)
async function generateICO() {
  const sharp = await checkSharp();
  if (!sharp) return false;

  const sourceLogo = resolve(__dirname, '../assets/logo/logo.png');
  const destICO = resolve(__dirname, '../public/favicon.ico');
  
  try {
    // ICO is complex; generate a 16x16 PNG as favicon instead
    await sharp.default(sourceLogo)
      .resize(16, 16, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(destICO.replace('.ico', '-16x16.png'));
    
    console.log('✅ Generated: favicon-16x16.png (ICO alternative)');
    return true;
  } catch (error) {
    console.error('❌ Failed to generate ICO:', error.message);
    return false;
  }
}

// Generate SVG (simplified)
async function generateSVG() {
  const sharp = await checkSharp();
  if (!sharp) return false;

  const sourceLogo = resolve(__dirname, '../assets/logo/logo.png');
  const destSVG = resolve(__dirname, '../public/favicon.svg');
  
  try {
    // Create a simple SVG placeholder
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <image href="data:image/png;base64,${await getBase64Image(sourceLogo)}" width="64" height="64"/>
</svg>`;
    
    const fs = await import('fs/promises');
    await fs.writeFile(destSVG, svgContent);
    
    console.log('✅ Generated: favicon.svg');
    return true;
  } catch (error) {
    console.error('❌ Failed to generate SVG:', error.message);
    return false;
  }
}

// Read image as base64
async function getBase64Image(imagePath) {
  const fs = await import('fs/promises');
  const buffer = await fs.readFile(imagePath);
  return buffer.toString('base64');
}

// Backup existing files
async function backupExistingFiles() {
  const publicDir = resolve(__dirname, '../public');
  const backupDir = resolve(__dirname, '../assets/logo/backup');
  
  try {
    if (!existsSync(backupDir)) {
      await mkdir(backupDir, { recursive: true });
    }

    const filesToBackup = [
      'favicon.svg',
      'favicon-96x96.png',
      'apple-touch-icon.png',
      'favicon.ico',
      'web-app-manifest-192x192.png',
      'web-app-manifest-512x512.png'
    ];

    for (const file of filesToBackup) {
      const sourcePath = resolve(publicDir, file);
      const backupPath = resolve(backupDir, file);
      
      if (existsSync(sourcePath)) {
        await copyFile(sourcePath, backupPath);
        console.log(`📦 Backup: ${file}`);
      }
    }

    console.log('✅ Existing files have been backed up to assets/logo/backup/');
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
  }
}

// Main entry
async function generateLogos() {
  console.log('🚀 Start logo batch processing...');
  
  try {
    // Backup existing files
    await backupExistingFiles();
    
    // Generate PNG icons
    await generatePNGIcons();
    
    // Generate ICO file
    await generateICO();
    
    // Generate SVG file
    await generateSVG();
    
    console.log('\n🎉 Logo batch processing complete!');
    console.log('📁 Outputs:');
    console.log('   - Web icons: frontend/public/');
    console.log('   - Extension icons: frontend/dist/extension/icons/');
    console.log('   - Backup: frontend/assets/logo/backup/');
    
  } catch (error) {
    console.error('❌ Processing failed:', error.message);
  }
}

generateLogos(); 