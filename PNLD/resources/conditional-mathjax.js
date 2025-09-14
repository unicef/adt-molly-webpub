/**
 * Conditional MathJax Loader
 * Only loads MathJax if enabled in config and if math content is detected
 */
class MathJaxLoader {
  constructor() {
    this.config = null;
    this.mathJaxLoaded = false;
    this.init();
  }

  async init() {
    try {
      // Determine correct config path based on current location
      const configPath = this.getConfigPath();
      
      // Load config
      const response = await fetch(configPath);
      this.config = await response.json();
      
      // Check if MathJax is enabled in config
      if (this.config.features && this.config.features.mathJax) {
        this.checkForMathContent();
      } else {
        console.log('📚 MathJax disabled in config - skipping load');
      }
    } catch (error) {
      console.warn('Could not load config for MathJax', error);
    }
  }

  getConfigPath() {
    const currentPath = window.location.pathname;
    
    // If we're in the content directory, use relative path to go up
    if (currentPath.includes('/PNLD/content/')) {
      return '../resources/config.json';
    }
    // If we're at root level
    else {
      return './PNLD/resources/config.json';
    }
  }

  getMathJaxPath() {
    const currentPath = window.location.pathname;
    
    // If we're in the content directory, use relative path to go up
    if (currentPath.includes('/PNLD/content/')) {
      return '../resources/libs/mathjax/tex-mml-chtml.js';
    }
    // If we're at root level
    else {
      return './PNLD/resources/libs/mathjax/tex-mml-chtml.js';
    }
  }

  checkForMathContent() {
    // Look for common math delimiters and elements
    const mathPatterns = [
      /\\\(.*?\\\)/,          // \( ... \)
      /\\\[.*?\\\]/,          // \[ ... \]
      /\$\$.*?\$\$/,          // $$ ... $$
      /\$[^$]+\$/,            // $ ... $
      /<math[\s>]/,           // <math> elements
      /<mml:/,                // MathML elements
      /class=".*math.*"/,     // Elements with math classes
    ];

    const content = document.body.innerHTML;
    const hasMathContent = mathPatterns.some(pattern => pattern.test(content));

    if (hasMathContent) {
      console.log('🧮 Math content detected - loading MathJax');
      this.loadMathJax();
    } else {
      console.log('📚 No math content found - MathJax not needed');
    }
  }

  loadMathJax() {
    if (this.mathJaxLoaded) return;

    // Create script element for MathJax (minimal build)
    const script = document.createElement('script');
    script.src = this.getMathJaxPath();
    script.async = true;
    script.onload = () => {
      console.log('✅ MathJax (minimal) loaded successfully');
      this.mathJaxLoaded = true;
    };
    script.onerror = () => {
      console.error('❌ Failed to load MathJax');
    };

    document.head.appendChild(script);
  }

  // Public method to force load MathJax (for admin/editor mode)
  forceLoad() {
    console.log('🔧 Force loading MathJax');
    this.loadMathJax();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.mathJaxLoader = new MathJaxLoader();
  });
} else {
  window.mathJaxLoader = new MathJaxLoader();
}
