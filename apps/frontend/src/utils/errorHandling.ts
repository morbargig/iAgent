export const isBrowserExtensionError = (error: Error): boolean => {
  const stack = error.stack || '';
  const extensionPatterns = [
    'content_script.js',
    'chrome-extension://',
    'moz-extension://',
    'safari-extension://',
    'extension',
    'shouldOfferCompletionListForField',
    'elementWasFocused',
    'focusInEventHandler',
    'processInputEvent',
  ];

  return extensionPatterns.some(
    (pattern) =>
      stack.includes(pattern) || error.message.includes(pattern)
  );
};

export const setupGlobalErrorHandling = (): void => {
  window.addEventListener('error', (event) => {
    if (event.error && isBrowserExtensionError(event.error)) {
      console.warn(
        '🔌 Browser extension error suppressed:',
        event.error.message
      );
      event.preventDefault();
      return true;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason instanceof Error &&
      isBrowserExtensionError(event.reason)
    ) {
      console.warn(
        '🔌 Browser extension promise rejection suppressed:',
        event.reason.message
      );
      event.preventDefault();
    }
  });

  if (import.meta.env.DEV) {
    console.info('🛡️ Global error handling initialized');
  }
};

