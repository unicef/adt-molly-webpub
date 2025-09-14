#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Icons actually used in the project
const usedIcons = [
  // Navigation & UI
  'fa-close', 'fa-times', 'fa-list', 'fa-chevron-right', 'fa-chevron-left', 'fa-arrow-left',
  
  // Zoom controls
  'fa-search-minus', 'fa-search-plus', 'fa-undo', 'fa-refresh',
  
  // Activity states
  'fa-pen-to-square', 'fa-square-check', 'fa-check-square', 'fa-check-circle', 'fa-times-circle',
  
  // Feedback & alerts
  'fa-exclamation-circle', 'fa-exclamation-triangle', 'fa-question-circle',
  
  // Media controls
  'fa-volume-high', 'fa-backward-step', 'fa-play', 'fa-pause', 'fa-forward-step',
  
  // Tools & features
  'fa-book', 'fa-sign-language', 'fa-wand-magic-sparkles', 'fa-pencil-alt', 'fa-save',
  
  // Accessibility
  'fa-universal-access'
];

// CSS for the base Font Awesome classes and font-face declarations
const baseFontAwesome = `
/* Font Awesome 6 Free - Minimal Build */
/* Only includes icons actually used in the project */

@font-face {
  font-family: "Font Awesome 6 Free";
  font-style: normal;
  font-weight: 900;
  font-display: block;
  src: url("../webfonts/fa-solid-900.woff2") format("woff2"),
       url("../webfonts/fa-solid-900.ttf") format("truetype");
}

@font-face {
  font-family: "Font Awesome 6 Free";
  font-style: normal;
  font-weight: 400;
  font-display: block;
  src: url("../webfonts/fa-regular-400.woff2") format("woff2"),
       url("../webfonts/fa-regular-400.ttf") format("truetype");
}

.fa,
.fas,
.fa-solid {
  font-family: "Font Awesome 6 Free";
  font-weight: 900;
}

.far,
.fa-regular {
  font-family: "Font Awesome 6 Free";
  font-weight: 400;
}

.fa,
.fab,
.fad,
.fal,
.far,
.fas {
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  display: inline-block;
  font-style: normal;
  font-variant: normal;
  line-height: 1;
  text-rendering: auto;
}
`;

// Unicode mappings for the icons we use (Font Awesome 6 Free)
const iconMappings = {
  'fa-arrow-left': '\\f060',
  'fa-backward-step': '\\f048',
  'fa-book': '\\f02d',
  'fa-check-circle': '\\f058',
  'fa-check-square': '\\f14a',
  'fa-chevron-left': '\\f053',
  'fa-chevron-right': '\\f054',
  'fa-close': '\\f00d',  // Same as fa-times
  'fa-exclamation-circle': '\\f06a',
  'fa-exclamation-triangle': '\\f071',
  'fa-forward-step': '\\f051',
  'fa-list': '\\f03a',
  'fa-pause': '\\f04c',
  'fa-pen-to-square': '\\f044',  // Same as fa-edit
  'fa-pencil-alt': '\\f303',
  'fa-play': '\\f04b',
  'fa-question-circle': '\\f059',
  'fa-refresh': '\\f021',  // Same as fa-sync
  'fa-save': '\\f0c7',
  'fa-search-minus': '\\f010',
  'fa-search-plus': '\\f00e',
  'fa-sign-language': '\\f2a7',
  'fa-square-check': '\\f14a',  // Same as fa-check-square
  'fa-times': '\\f00d',
  'fa-times-circle': '\\f057',
  'fa-undo': '\\f0e2',
  'fa-universal-access': '\\f29a',
  'fa-volume-high': '\\f028',
  'fa-wand-magic-sparkles': '\\e2ca'
};

// Generate CSS for each icon
let iconCSS = '';
usedIcons.forEach(icon => {
  const unicode = iconMappings[icon];
  if (unicode) {
    iconCSS += `.${icon}:before { content: "${unicode}"; }\n`;
  } else {
    console.warn(`Warning: Unicode not found for icon: ${icon}`);
  }
});

// Combine everything
const minimalCSS = baseFontAwesome + '\n' + iconCSS;

// Write the minimal CSS file
const outputPath = path.join(__dirname, '../PNLD/resources/libs/fontawesome/css/minimal.css');
fs.writeFileSync(outputPath, minimalCSS);

console.log(`✅ Created minimal Font Awesome CSS with ${usedIcons.length} icons`);
console.log(`📁 Output: ${outputPath}`);
console.log(`📦 File size: ${Math.round(fs.statSync(outputPath).size / 1024)}KB`);

// List the files we can potentially remove
console.log('\n🗑️  You can remove these unused FontAwesome files to save space:');
console.log('  - js/ directory (6.1MB)');
console.log('  - scss/ directory (300KB)');
console.log('  - less/ directory (292KB)');
console.log('  - svgs/ directory (8.1MB)');
console.log('  - sprites/ directory (1.5MB)');
console.log('  - metadata/ directory (10MB)');
console.log('  - Most CSS files in css/ directory (keep only minimal.css)');
console.log('\n💡 This could save ~26MB, keeping only the webfonts and minimal.css (~1.5MB total)');
