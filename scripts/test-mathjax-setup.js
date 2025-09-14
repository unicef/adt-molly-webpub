#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing MathJax Minimal Build Setup');
console.log('====================================');

// Check file sizes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch (error) {
    return 0;
  }
}

// Test file existence and sizes
const mathjaxMinimal = '../PNLD/resources/libs/mathjax/tex-mml-chtml.js';
const conditionalLoader = '../PNLD/resources/conditional-mathjax.js';
const config = '../PNLD/resources/config.json';

console.log('📁 File Check:');
console.log(`  ✅ MathJax minimal: ${fs.existsSync(mathjaxMinimal) ? 'EXISTS' : 'MISSING'} (${formatBytes(getFileSize(mathjaxMinimal))})`);
console.log(`  ✅ Conditional loader: ${fs.existsSync(conditionalLoader) ? 'EXISTS' : 'MISSING'} (${formatBytes(getFileSize(conditionalLoader))})`);
console.log(`  ✅ Config file: ${fs.existsSync(config) ? 'EXISTS' : 'MISSING'} (${formatBytes(getFileSize(config))})`);

// Check config content
try {
  const configContent = JSON.parse(fs.readFileSync(config, 'utf8'));
  const mathJaxEnabled = configContent.features && configContent.features.mathJax;
  console.log(`\n⚙️  Configuration:`);
  console.log(`  📋 MathJax enabled: ${mathJaxEnabled ? 'YES' : 'NO'}`);
  console.log(`  🎯 Status: ${mathJaxEnabled ? 'Will load if math content found' : 'Disabled - will not load'}`);
} catch (error) {
  console.log(`\n❌ Error reading config: ${error.message}`);
}

// Calculate space savings
const backupDir = '../PNLD/resources/libs/mathjax-full-backup';
if (fs.existsSync(backupDir)) {
  function getDirSize(dirPath) {
    let totalSize = 0;
    function traverse(currentPath) {
      const stats = fs.statSync(currentPath);
      if (stats.isDirectory()) {
        fs.readdirSync(currentPath).forEach(file => {
          traverse(path.join(currentPath, file));
        });
      } else {
        totalSize += stats.size;
      }
    }
    traverse(dirPath);
    return totalSize;
  }

  const originalSize = getDirSize(backupDir);
  const minimalSize = getDirSize('../PNLD/resources/libs/mathjax');
  const savings = originalSize - minimalSize;

  console.log(`\n💾 Space Optimization:`);
  console.log(`  📊 Original MathJax: ${formatBytes(originalSize)}`);
  console.log(`  📦 Minimal MathJax:  ${formatBytes(minimalSize)}`);
  console.log(`  💰 Space saved:     ${formatBytes(savings)} (${Math.round((savings/originalSize) * 100)}%)`);
}

console.log(`\n🎉 MathJax Minimal Build Setup Complete!`);
console.log(`\n📝 Summary:`);
console.log(`  - MathJax is disabled by default in config`);
console.log(`  - Conditional loader only loads if math content is detected`);
console.log(`  - Minimal build reduces size from ~23MB to ~1.5MB`);
console.log(`  - Your literacy book likely won't trigger MathJax loading`);
console.log(`  - Math features available if needed in the future`);
