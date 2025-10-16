'use client';

import { useEffect } from 'react';

export function ErrorSuppressor() {
  useEffect(() => {
    // Comprehensive error suppression for Facebook SDK and other third-party scripts
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    console.error = function(...args) {
      const message = args.join(' ');
      
      // Suppress Facebook SDK errors
      if (
        message.includes('Could not find element') ||
        message.includes('DataStore.get: namespace is required') ||
        message.includes('__elem_') ||
        message.includes('ErrorUtils caught an error') ||
        message.includes('Permissions policy violation: unload is not allowed') ||
        message.includes('facebook') ||
        message.includes('FB') ||
        message.includes('auOdwRASAnz.js') ||
        message.includes('hQGms2HrWN3.js') ||
        message.includes('l-Whe69ch0H.js') ||
        message.includes('tlMldxAPnuU.js') ||
        message.includes('React DevTools') ||
        message.includes('Download the React DevTools')
      ) {
        return;
      }
      
      originalError.apply(console, args);
    };

    console.warn = function(...args) {
      const message = args.join(' ');
      
      if (
        message.includes('React DevTools') ||
        message.includes('Download the React DevTools') ||
        message.includes('facebook') ||
        message.includes('FB')
      ) {
        return;
      }
      
      originalWarn.apply(console, args);
    };

    // Suppress window errors from Facebook SDK
    const handleWindowError = (event: ErrorEvent) => {
      const message = event.message || '';
      
      if (
        message.includes('Could not find element') ||
        message.includes('DataStore.get') ||
        message.includes('facebook') ||
        message.includes('FB') ||
        event.filename?.includes('facebook') ||
        event.filename?.includes('auOdwRASAnz.js') ||
        event.filename?.includes('hQGms2HrWN3.js')
      ) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    // Suppress unhandled promise rejections from Facebook SDK
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.toString() || '';
      
      if (
        reason.includes('facebook') ||
        reason.includes('FB') ||
        reason.includes('Could not find element') ||
        reason.includes('DataStore.get')
      ) {
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Clean up Facebook SDK if it exists and is causing issues
    const cleanupFacebookSDK = () => {
      try {
        // Remove Facebook SDK scripts
        const fbScripts = document.querySelectorAll('script[src*="facebook"], script[src*="connect.facebook.net"]');
        fbScripts.forEach(script => {
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
        });

        // Remove Facebook SDK elements
        const fbElements = document.querySelectorAll('[id^="fb-"], [class*="fb-"], #facebook-jssdk');
        fbElements.forEach(element => {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        });

        // Clear Facebook global variables
        if (typeof window !== 'undefined') {
          delete (window as any).FB;
          delete (window as any).fbAsyncInit;
        }
      } catch (error) {
        // Silently ignore cleanup errors
      }
    };

    // Run cleanup after a delay to ensure DOM is ready
    setTimeout(cleanupFacebookSDK, 1000);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}