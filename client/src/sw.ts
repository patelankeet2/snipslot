/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { flushOutbox, SYNC_TAG } from './offline/outbox';
import { API_CACHE, PHOTO_CACHE } from './offline/cacheNames';

declare let self: ServiceWorkerGlobalScope;

// Background Sync event, not in TypeScript's worker types yet
interface SyncEvent extends ExtendableEvent {
  readonly tag: string;
}

// take over straight away when a new version is deployed
self.skipWaiting();
clientsClaim();

// app shell: html, js, css and icons injected at build time
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// In dev only index.html is precached, so limit the fallback to the root
let allowlist: RegExp[] | undefined;
if (import.meta.env.DEV) allowlist = [/^\/$/];

// Single page app: every navigation gets index.html, except API calls
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    allowlist,
    denylist: [/^\/api\//],
  }),
);

// Google Fonts: the CSS can change, so refresh it in the background...
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts-css' }),
);

// ...but the font files never change for a given URL, so cache them for a year
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-files',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }),
    ],
  }),
);

// API reads (services, barbers, my bookings, schedule, slots): network first so the
// data is fresh, but fall back to the last saved copy when offline or very slow.
// Sign in routes are never cached, and only GETs are (Workbox ignores other methods here).
registerRoute(
  ({ url, sameOrigin }) =>
    sameOrigin &&
    url.pathname.startsWith('/api/') &&
    !url.pathname.startsWith('/api/auth') &&
    !url.pathname.startsWith('/api/health'),
  new NetworkFirst({
    cacheName: API_CACHE,
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  }),
);

// Google profile photos rarely change, so serve them from the cache first
registerRoute(
  ({ url }) => url.hostname.endsWith('googleusercontent.com'),
  new CacheFirst({
    cacheName: PHOTO_CACHE,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  }),
);

// ---------- Background Sync: replay changes made while offline ----------

async function replayOutbox() {
  const result = await flushOutbox();

  // tell any open tabs so they can show a toast and refresh
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage({
      type: 'OUTBOX_SYNCED',
      synced: result.synced.length,
      rejected: result.rejected.map((r) => ({ label: r.item.label, message: r.message })),
    });
  }

  // still offline: failing the sync makes the browser try again later
  if (result.remaining > 0) throw new Error('Outbox not empty yet, will retry');
}

self.addEventListener('sync', (event: Event) => {
  const syncEvent = event as SyncEvent;
  if (syncEvent.tag === SYNC_TAG) syncEvent.waitUntil(replayOutbox());
});
