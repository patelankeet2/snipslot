import { useEffect, useState } from 'react';
import { OUTBOX_CHANGED, pendingChanges } from '../offline/outbox';
import type { OutboxItem } from '../offline/db';

// Live list of changes still waiting to be sent to the server
export function useOutbox() {
  const [items, setItems] = useState<OutboxItem[]>([]);

  useEffect(() => {
    let active = true;
    const refresh = () =>
      pendingChanges()
        .then((list) => active && setItems(list))
        .catch(() => active && setItems([]));

    refresh();
    window.addEventListener(OUTBOX_CHANGED, refresh);
    // the service worker reports back after a background sync
    navigator.serviceWorker?.addEventListener('message', refresh);
    return () => {
      active = false;
      window.removeEventListener(OUTBOX_CHANGED, refresh);
      navigator.serviceWorker?.removeEventListener('message', refresh);
    };
  }, []);

  return items;
}
