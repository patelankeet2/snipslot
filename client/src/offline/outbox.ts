import { getDb, type OutboxItem } from './db';

// Shared by the app and the service worker, so no window or React in here.

export const SYNC_TAG = 'snipslot-outbox';
export const OUTBOX_CHANGED = 'snipslot:outbox-changed';

function announceChange() {
  // the service worker has no window; it tells the pages itself with postMessage
  if ('document' in globalThis) globalThis.dispatchEvent(new Event(OUTBOX_CHANGED));
}

export async function enqueue(item: Omit<OutboxItem, 'id' | 'createdAt'>) {
  const db = await getDb();
  // only the latest change per booking matters (eg moved twice, or moved then cancelled)
  const existing = await db.getAll('outbox');
  for (const old of existing) {
    if (old.bookingId === item.bookingId && old.id !== undefined) await db.delete('outbox', old.id);
  }
  await db.add('outbox', { ...item, createdAt: Date.now() });
  announceChange();
}

export async function pendingChanges(): Promise<OutboxItem[]> {
  const db = await getDb();
  return db.getAll('outbox');
}

export interface FlushResult {
  synced: OutboxItem[];
  rejected: { item: OutboxItem; message: string }[];
  remaining: number;
}

// Send queued changes oldest first. Stops at the first network failure
// so nothing is lost and the order is kept for the next attempt.
export function flushOutbox(apiBase = ''): Promise<FlushResult> {
  // The page and the service worker can both try to flush at once. A Web Lock
  // (shared between them) makes the second one wait, so nothing is sent twice.
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request('snipslot-outbox', () => sendQueued(apiBase));
  }
  return sendQueued(apiBase);
}

async function sendQueued(apiBase: string): Promise<FlushResult> {
  const db = await getDb();
  const items = await db.getAll('outbox');
  const result: FlushResult = { synced: [], rejected: [], remaining: 0 };

  for (const item of items) {
    let res: Response;
    try {
      res = await fetch(`${apiBase}/api${item.path}`, {
        method: item.method,
        credentials: 'include',
        headers: item.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: item.body !== undefined ? JSON.stringify(item.body) : undefined,
      });
    } catch {
      break; // still offline
    }

    if (res.ok) {
      await db.delete('outbox', item.id!);
      result.synced.push(item);
    } else if (res.status >= 400 && res.status < 500 && res.status !== 401 && res.status !== 429) {
      // the server said no (eg the new time was taken while we were offline).
      // Retrying will not help, so drop it and tell the user why.
      const data = await res.json().catch(() => null);
      await db.delete('outbox', item.id!);
      result.rejected.push({
        item,
        message: data?.error?.message ?? `Request failed (${res.status})`,
      });
    } else {
      break; // signed out or server trouble: keep it for later
    }
  }

  result.remaining = (await db.count('outbox')) ?? 0;
  announceChange();
  return result;
}
