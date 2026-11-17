import { getDb } from './db';
import type { MyBooking } from '../types';

// Replace the saved copy with the latest list from the server
export async function saveUpcoming(bookings: MyBooking[]) {
  try {
    const db = await getDb();
    const tx = db.transaction('bookings', 'readwrite');
    await tx.store.clear();
    await Promise.all(bookings.map((b) => tx.store.put(b)));
    await tx.done;
  } catch (err) {
    // IndexedDB can be unavailable (eg some private modes); the app still works online
    console.warn('Could not save bookings for offline use', err);
  }
}

export async function getUpcoming(): Promise<MyBooking[]> {
  const db = await getDb();
  const all = await db.getAll('bookings');
  return all.sort((a, b) => a.start.localeCompare(b.start));
}

// Called on sign out so the next person on this device sees nothing
export async function clearOfflineData() {
  try {
    const db = await getDb();
    await Promise.all([db.clear('bookings'), db.clear('outbox')]);
  } catch {
    // nothing to clear
  }
}
