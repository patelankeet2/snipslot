# SnipSlot

SnipSlot is a barber and salon booking Progressive Web App for a single shop. Customers sign in with Google, pick a service, a barber and a free time slot, and manage their bookings from their phone, even on a patchy connection. The owner manages services, barbers, opening hours and the daily schedule from the same app and gets a push notification whenever a booking is made or cancelled.

## Tech stack

| Layer | Tools |
| --- | --- |
| Client | React, TypeScript, Vite, React Router |
| PWA | vite-plugin-pwa (Workbox), IndexedDB |
| API | Node.js, Express, TypeScript |
| Database | MongoDB Atlas (AWS, Sydney) with Mongoose |
| Auth | Google Sign-In, JWT in an httpOnly cookie |
| Push | Web Push with VAPID keys |

## Project structure

```
snipslot/
  client/   React PWA
  server/   Express REST API
```

## Running locally

You need Node.js 20 or newer.

### API

```bash
cd server
cp .env.example .env    # then fill in the values
npm install
npm run dev
```

The API runs on http://localhost:4000. Check http://localhost:4000/api/health

To load the starter services, barbers and opening hours (only fills empty collections):

```bash
npm run seed
```

### Client

```bash
cd client
cp .env.example .env.local
npm install
npm run dev
```

The app runs on http://localhost:5173 and forwards `/api` calls to the API.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start in watch mode |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check without emitting |
| `npm test` | Run the tests |

## API overview

All routes are under `/api`. Signed in requests use the `snipslot_session` httpOnly cookie, or the same token as `Authorization: Bearer <token>` (handy for Postman).

| Method | Route | Who |
| --- | --- | --- |
| GET | `/health` | anyone |
| POST | `/auth/google` | anyone (Google ID token in, session cookie out) |
| GET | `/auth/session` | anyone (returns `user: null` when signed out) |
| GET | `/auth/me` | signed in |
| POST | `/auth/logout` | anyone |
| GET | `/services`, `/services/:id` | signed in |
| POST, PUT, DELETE | `/services`, `/services/:id` | owner |
| GET | `/barbers`, `/barbers/:id` | signed in |
| POST, PUT, DELETE | `/barbers`, `/barbers/:id` | owner |
| GET | `/settings` | signed in |
| PUT | `/settings/hours` | owner |
| GET | `/bookings/schedule?date=YYYY-MM-DD` | owner |
| PATCH | `/bookings/:id/status` | owner |

## Postman

Import both files from the `postman` folder. Sign in on the web app, copy the `snipslot_session` cookie value from DevTools (Application > Cookies) and paste it into `ownerToken` or `customerToken` in the environment. The collection has tests on every request, so it can be run with the Collection Runner.

## Offline mode

- The app shell (HTML, JS, CSS, icons) is precached by the service worker, so the app opens with no connection.
- API reads use a network first strategy with a cached fallback (`api-data` cache). Profile photos and fonts are cache first.
- Upcoming bookings are also saved in IndexedDB (`snipslot` database, `bookings` store).
- Cancelling or rescheduling while offline puts the change in an IndexedDB outbox. It is replayed by Background Sync in Chrome and Edge, or when the browser comes back online in Safari and Firefox.
- Signing out clears the cached API data, photos and IndexedDB.

To try it, use the production build, because the dev server does not cache the app's JavaScript:

```bash
cd client
npm run build
npm run preview   # http://localhost:4173, /api is proxied to the server
```

Then in Chrome DevTools > Network choose "Offline" and reload.
