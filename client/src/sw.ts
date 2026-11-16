/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare let self: ServiceWorkerGlobalScope;

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
