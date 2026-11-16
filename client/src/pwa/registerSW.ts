import { registerSW } from 'virtual:pwa-register';

// Registers the service worker as soon as the app loads.
// The worker itself calls skipWaiting, so updates apply on the next reload.
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser');
    return;
  }

  registerSW({
    immediate: true,
    onOfflineReady() {
      console.info('SnipSlot is ready to work offline');
    },
    onRegisterError(error) {
      console.error('Service worker registration failed', error);
    },
  });
}
