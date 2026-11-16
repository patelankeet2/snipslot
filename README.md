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
