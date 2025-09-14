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
      // Load config
      const response = await fetch('./PNLD/resources/config.json');
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
    script.src = './PNLD/resources/libs/mathjax/tex-mml-chtml.js';
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
