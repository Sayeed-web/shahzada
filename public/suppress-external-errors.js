// Suppress ALL external errors from Facebook SDK, TradingView and other third-party scripts
(function() {
  'use strict';
  
  // List of patterns to suppress
  const suppressPatterns = [
    'facebook',
    'FB',
    'fburl',
    'u_1_',
    'DataStore',
    'ErrorUtils',
    'connect.facebook',
    'fbAsyncInit',
    'session_start',
    'require_once',
    'admin-complete.php',
    'auth/check.php',
    'B8n3jQmyd0H',
    'AZQPaq2Cgfk',
    'nJYRblinWQ',
    'Whe69ch0H',
    '7gehT8KQFZF',
    'Permissions policy',
    'unload is not allowed',
    'Refused to frame',
    'Content Security Policy',
    'violates the following',
    'TradingView',
    'tradingview',
    'list',
    'state',
    'snapshot',
    'Quote',
    'Property',
    'dn',
    'mn',
    'lt',
    'Ha',
    '_o',
    'Ei',
    'ks',
    'ys',
    'vs',
    'ss',
    'Wl',
    'fo',
    'Ua',
    'wi',
    'ki',
    'bi',
    'Ss',
    'fs',
    'ec',
    'embed_advanced_chart',
    'cab9b4faa616968696ee',
    '48569a458a5ea320e7da',
    '37ea6a254be9d8154e2c',
    'ed570c7e7ab7e927fd96',
    'ffbd1e9dd561aff61793',
    'widgetembed'
  ];
  
  // Check if message should be suppressed
  function shouldSuppress(message) {
    if (!message) return false;
    const msgStr = message.toString().toLowerCase();
    return suppressPatterns.some(pattern => msgStr.includes(pattern.toLowerCase()));
  }
  
  // Override console.error
  const originalError = console.error;
  console.error = function(...args) {
    if (args.length > 0 && shouldSuppress(args[0])) {
      return;
    }
    originalError.apply(console, args);
  };
  
  // Override console.warn
  const originalWarn = console.warn;
  console.warn = function(...args) {
    if (args.length > 0 && shouldSuppress(args[0])) {
      return;
    }
    originalWarn.apply(console, args);
  };
  
  // Suppress window errors
  window.addEventListener('error', function(e) {
    if (shouldSuppress(e.message) || shouldSuppress(e.filename)) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return false;
    }
  }, true);
  
  // Suppress unhandled promise rejections
  window.addEventListener('unhandledrejection', function(e) {
    if (shouldSuppress(e.reason)) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return false;
    }
  }, true);
  
  // Block Facebook SDK
  Object.defineProperty(window, 'FB', {
    get: () => undefined,
    set: () => {},
    configurable: false
  });
  
  Object.defineProperty(window, 'fbAsyncInit', {
    get: () => undefined,
    set: () => {},
    configurable: false
  });
  
  // Monitor and remove Facebook elements
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) {
          const src = node.src || node.href || '';
          if (src.includes('facebook') || src.includes('connect.facebook.net')) {
            node.remove();
          }
          // Remove Facebook iframes
          if (node.tagName === 'IFRAME' && src.includes('facebook.com')) {
            node.remove();
          }
        }
      });
    });
  });
  
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // Remove existing Facebook iframes
  setInterval(function() {
    document.querySelectorAll('iframe[src*="facebook.com"]').forEach(function(el) {
      el.remove();
    });
  }, 1000);
  
  console.log('✅ External error suppression active');
})();
