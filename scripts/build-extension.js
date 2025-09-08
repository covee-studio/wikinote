#!/usr/bin/env node

import { build } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { copyFile, mkdir, readdir, writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const extensionConfig = resolve(__dirname, '../configs/extension/vite.config.ts');

async function copyManifest() {
  const manifestSrc = resolve(__dirname, '../configs/extension/manifest.json');
  const manifestDest = resolve(__dirname, '../dist/extension/manifest.json');
  
  try {
    await copyFile(manifestSrc, manifestDest);
    console.log('📄 Manifest.json copied');
  } catch (error) {
    console.error('❌ Failed to copy manifest.json:', error);
  }
}

async function copyIcons() {
  const iconsSrc = resolve(__dirname, '../public');
  const iconsDest = resolve(__dirname, '../dist/extension/icons');
  
  try {
    // Ensure icons directory exists
    if (!existsSync(iconsDest)) {
      await mkdir(iconsDest, { recursive: true });
    }
    
    // Copy icon files with expected sizes
    const iconMappings = [
      { src: 'favicon-16x16.png', dest: 'icon-16.png' },
      { src: 'favicon-32x32.png', dest: 'icon-32.png' },
      { src: 'favicon-48x48.png', dest: 'icon-48.png' },
      { src: 'favicon-96x96.png', dest: 'icon-96.png' },
      { src: 'favicon-128x128.png', dest: 'icon-128.png' },
      { src: 'web-app-manifest-192x192.png', dest: 'icon-192.png' },
      { src: 'web-app-manifest-512x512.png', dest: 'icon-512.png' }
    ];
    
    for (const { src: srcFile, dest: destFile } of iconMappings) {
      const src = resolve(iconsSrc, srcFile);
      const dest = resolve(iconsDest, destFile);
      
      if (existsSync(src)) {
        await copyFile(src, dest);
        console.log(`🎨 Icon copied: ${srcFile} -> ${destFile}`);
      }
    }

    // Ensure required sizes for manifest exist (16/32/48/128)
    const requiredSizes = [16, 32, 48, 128];
    const missingSizes = requiredSizes.filter((size) => !existsSync(resolve(iconsDest, `icon-${size}.png`)));

    if (missingSizes.length > 0) {
      try {
        const sharp = (await import('sharp')).default;
        // Prefer 512x512 as source
        const source512 = resolve(iconsSrc, 'web-app-manifest-512x512.png');
        const fallback192 = resolve(iconsSrc, 'web-app-manifest-192x192.png');
        const sourcePath = existsSync(source512) ? source512 : fallback192;
        if (!existsSync(sourcePath)) {
          throw new Error('No suitable source image found to generate icons');
        }

        for (const size of missingSizes) {
          const out = resolve(iconsDest, `icon-${size}.png`);
          await sharp(sourcePath)
            .resize(size, size, {
              fit: 'contain',
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .png()
            .toFile(out);
          console.log(`🧩 Icon generated: icon-${size}.png`);
        }
      } catch (err) {
        console.warn('⚠️ Unable to generate missing icons automatically:', err.message);
      }
    }
  } catch (error) {
    console.error('❌ Failed to copy icons:', error);
  }
}

async function copyBuiltFiles() {
  const targetDir = resolve(__dirname, '../dist/extension');
  
  try {
    // Locate built files - Vite output path can vary based on config
    const possibleSourceDirs = [
      resolve(__dirname, '../dist/extension/configs/extension'),
      resolve(__dirname, '../../dist/extension/configs/extension'),
      resolve(__dirname, '../dist/extension'),
      resolve(__dirname, '../dist'),
      resolve(__dirname, '../../dist/extension'),
    ];
    
    let sourceDir = null;
    for (const dir of possibleSourceDirs) {
      if (existsSync(dir)) {
        const files = await readdir(dir);
        if (files.some(f => f.endsWith('.js') || f.endsWith('.html') || f.endsWith('.css'))) {
          sourceDir = dir;
          break;
        }
      }
    }
    
    if (!sourceDir) {
      throw new Error('No built files found');
    }
    
    console.log(`📁 Found built files in: ${sourceDir}`);
    
    // Copy HTML file
    const htmlSrc = resolve(sourceDir, 'newtab.html');
    const htmlDest = resolve(targetDir, 'newtab.html');
    
    if (existsSync(htmlSrc)) {
      let htmlContent = await readFile(htmlSrc, 'utf8');
      
      // Fix script path in HTML to point to built entry
      htmlContent = htmlContent.replace(
        'src="/src/main.tsx"',
        'src="./newtab.js"'
      );
      
      await writeFile(htmlDest, htmlContent);
      console.log('📄 Copied and fixed: newtab.html');
    }
    
    // Copy JS and CSS files
    const files = await readdir(sourceDir);
    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.css')) {
        const src = resolve(sourceDir, file);
        const dest = resolve(targetDir, file);
        await copyFile(src, dest);
        console.log(`📄 Copied: ${file}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error copying built files:', error);
    throw error;
  }
}

async function buildExtension() {
  console.log('🚀 Building Chrome Extension...');
  
  try {
    // Ensure target directory exists
    const targetDir = resolve(__dirname, '../dist/extension');
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }
    
    // Run Vite build
    await build({
      configFile: extensionConfig,
      mode: 'production',
    });
    
    // Copy built files
    await copyBuiltFiles();
    
    // Copy required files
    await copyManifest();
    await copyIcons();
    
    console.log('✅ Extension build completed successfully!');
    console.log('📁 Output: dist/extension/');
    console.log('💡 To load in Chrome:');
    console.log('   1. Open chrome://extensions/');
    console.log('   2. Enable "Developer mode"');
    console.log('   3. Click "Load unpacked"');
    console.log('   4. Select the dist/extension folder');
  } catch (error) {
    console.error('❌ Extension build failed:', error);
    process.exit(1);
  }
}

buildExtension(); 