// Service Worker registration script
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Registered successfully
        if (reg.installing) {
          console.debug('Service worker installing');
        } else if (reg.waiting) {
          console.debug('Service worker installed & waiting');
        } else if (reg.active) {
          console.debug('Service worker active');
        }
      })
      .catch((err) => {
        // Skip registration errors gracefully in sandbox/iframe environments
        console.debug('Service worker registration note:', err?.message || err);
      });
  });
}
