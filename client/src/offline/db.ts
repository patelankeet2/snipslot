import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { MyBooking } from '../types';

// A change the user made while offline, waiting to be sent to the API
export interface OutboxItem {
  id?: number;
  method: 'PUT' | 'DELETE';
  path: string; // eg /bookings/123
  body?: unknown;
  bookingId: string;
  kind: 'cancel' | 'reschedule';
  label: string; // human friendly, eg "Cancel Skin Fade on Wed 18 Nov"
  createdAt: number;
}

interface SnipSlotDB extends DBSchema {
  // copy of the customer's upcoming bookings so the list opens offline
  bookings: { key: string; value: MyBooking };
  // queued changes, replayed in the order they were made
  outbox: { key: number; value: OutboxItem };
}

let dbPromise: Promise<IDBPDatabase<SnipSlotDB>> | null = null;

// One shared connection, used by both the app and the service worker
export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<SnipSlotDB>('snipslot', 1, {
      upgrade(db) {
        db.createObjectStore('bookings', { keyPath: 'id' });
        db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
      },
    });
  }
  return dbPromise;
}
