import { SYNC_TAG } from './outbox';

// Background Sync is not in TypeScript's DOM types yet, so describe the bit we use
interface SyncCapableRegistration extends ServiceWorkerRegistration {
  sync: { register(tag: string): Promise<void> };
}

export function supportsBackgroundSync() {
  return 'serviceWorker' in navigator && 'SyncManager' in window;
}

// Ask the service worker to replay the outbox as soon as the connection is back,
// even if the tab has been closed. Returns false where the browser cannot do it
// (Safari, Firefox), in which case the app replays on the "online" event instead.
export async function requestBackgroundSync() {
  if (!supportsBackgroundSync()) return false;
  try {
    const reg = (await navigator.serviceWorker.ready) as SyncCapableRegistration;
    await reg.sync.register(SYNC_TAG);
    return true;
  } catch {
    return false;
  }
}
