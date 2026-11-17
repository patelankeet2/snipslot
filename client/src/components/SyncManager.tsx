import { useEffect } from 'react';
import { flushOutbox, type FlushResult } from '../offline/outbox';
import { supportsBackgroundSync } from '../offline/backgroundSync';
import { useToast } from '../hooks/useToast';
import { config } from '../config';

export const DATA_SYNCED = 'snipslot:data-synced';

interface SwSyncMessage {
  type: 'OUTBOX_SYNCED';
  synced: number;
  rejected: { label: string; message: string }[];
}

// Watches for the connection coming back and makes sure queued changes get sent.
// Chrome / Edge: the service worker does it (Background Sync) and messages us.
// Safari / Firefox: we replay from here on the "online" event and when the app opens.
export function SyncManager() {
  const { notify } = useToast();

  useEffect(() => {
    const report = (synced: number, rejected: { label: string; message: string }[]) => {
      if (synced > 0) notify(`Back online: ${synced} change${synced > 1 ? 's' : ''} synced`);
      for (const r of rejected) notify(`${r.label} could not be saved: ${r.message}`, 'error');
      // pages listening for this reload their data
      if (synced > 0 || rejected.length > 0) window.dispatchEvent(new Event(DATA_SYNCED));
    };

    const replayHere = async () => {
      if (!navigator.onLine) return;
      try {
        const result: FlushResult = await flushOutbox(config.apiBase);
        report(
          result.synced.length,
          result.rejected.map((r) => ({ label: r.item.label, message: r.message })),
        );
      } catch (err) {
        console.warn('Outbox replay failed', err);
      }
    };

    const onSwMessage = (event: MessageEvent<SwSyncMessage>) => {
      if (event.data?.type === 'OUTBOX_SYNCED') report(event.data.synced, event.data.rejected);
    };

    // With Background Sync the service worker normally goes first. Browsers do not
    // always fire the sync event right away, so if anything is still waiting a few
    // seconds later the page sends it itself. Without Background Sync, go straight away.
    const delay = supportsBackgroundSync() ? 4000 : 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onOnline = () => {
      clearTimeout(timer);
      timer = setTimeout(replayHere, delay);
    };

    window.addEventListener('online', onOnline);
    navigator.serviceWorker?.addEventListener('message', onSwMessage);
    onOnline(); // catch anything left over from the last time the app was open

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', onOnline);
      navigator.serviceWorker?.removeEventListener('message', onSwMessage);
    };
  }, [notify]);

  return null;
}
