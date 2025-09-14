#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 MathJax Optimization Tool');
console.log('============================');

const mathJaxDir = path.join(__dirname, '../PNLD/resources/libs/mathjax');
const backupDir = path.join(__dirname, '../PNLD/resources/libs/mathjax-backup');

function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  function calculateSize(currentPath) {
    const stats = fs.statSync(currentPath);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach(file => {
        calculateSize(path.join(currentPath, file));
      });
    } else {
      totalSize += stats.size;
    }
  }
  
  try {
    calculateSize(dirPath);
  } catch (error) {
    return 0;
  }
  
  return totalSize;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function createMinimalMathJax() {
  const originalSize = getDirectorySize(mathJaxDir);
  
  console.log(`📊 Current MathJax size: ${formatBytes(originalSize)}`);
  
  // Essential files for basic math rendering
  const essentialFiles = [
    'es5/tex-mml-chtml.js',           // Main combined file
    'es5/output/chtml/fonts/woff-v2', // Essential fonts
    'es5/core.js',                    // Core functionality
    'es5/startup.js'                  // Startup module
  ];
  
  const minimalDir = path.join(__dirname, '../PNLD/resources/libs/mathjax-minimal');
  
  // Create minimal directory structure
  if (!fs.existsSync(minimalDir)) {
    fs.mkdirSync(minimalDir, { recursive: true });
    
    // Copy only essential files
    const essentialSourcePath = path.join(mathJaxDir, 'es5/tex-mml-chtml.js');
    const essentialTargetPath = path.join(minimalDir, 'tex-mml-chtml.js');
    
    if (fs.existsSync(essentialSourcePath)) {
      fs.copyFileSync(essentialSourcePath, essentialTargetPath);
      console.log('✅ Created minimal MathJax build');
    }
    
    // Copy essential fonts
    const fontsSource = path.join(mathJaxDir, 'es5/output/chtml/fonts/woff-v2');
    const fontsTarget = path.join(minimalDir, 'fonts');
    
    if (fs.existsSync(fontsSource)) {
      fs.mkdirSync(fontsTarget, { recursive: true });
      const fontFiles = fs.readdirSync(fontsSource);
      fontFiles.forEach(file => {
        fs.copyFileSync(
          path.join(fontsSource, file),
          path.join(fontsTarget, file)
        );
      });
      console.log('✅ Copied essential fonts');
    }
  }
  
  const minimalSize = getDirectorySize(minimalDir);
  const savings = originalSize - minimalSize;
  
  console.log(`\n📈 Optimization Results:`);
  console.log(`  Original size:  ${formatBytes(originalSize)}`);
  console.log(`  Minimal size:   ${formatBytes(minimalSize)}`);
  console.log(`  Space saved:    ${formatBytes(savings)} (${Math.round((savings/originalSize) * 100)}%)`);
  
  return minimalSize;
}

function showOptions() {
  console.log(`\n🎯 MathJax Optimization Options:`);
  console.log(`\n1. 📋 Current Status:`);
  console.log(`   - MathJax is set to DISABLED in config.json`);
  console.log(`   - Conditional loading is active (only loads if math content found)`);
  console.log(`   - Current size: ${formatBytes(getDirectorySize(mathJaxDir))}`);
  
  console.log(`\n2. 🗑️  Complete Removal (Recommended for this project):`);
  console.log(`   - Remove entire MathJax directory`);
  console.log(`   - Save ~23MB of space`);
  console.log(`   - Math content can be added later if needed`);
  
  console.log(`\n3. 📦 Minimal Build:`);
  console.log(`   - Keep only essential files for basic math rendering`);
  console.log(`   - Reduce from ~23MB to ~2MB`);
  console.log(`   - Good compromise if you might need math later`);
  
  console.log(`\n4. ⚙️  CDN Alternative:`);
  console.log(`   - Remove local files, use CDN when needed`);
  console.log(`   - Zero local storage, loads on demand`);
  console.log(`   - Requires internet connection`);
  
  console.log(`\n💡 Recommendation: Since 'Molly Hopper' appears to be a literacy book`);
  console.log(`   without mathematical content, complete removal is recommended.`);
  console.log(`   You can always add MathJax back later if needed.`);
}

// Create minimal build
createMinimalMathJax();

// Show options
showOptions();

console.log(`\n🔧 To apply changes, run one of these commands:`);
console.log(`   npm run mathjax:remove     # Remove completely`);
console.log(`   npm run mathjax:minimal    # Use minimal build`);
console.log(`   npm run mathjax:cdn        # Switch to CDN`);
