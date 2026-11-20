import webpush from 'web-push';

// Test values for every setting the app needs. These are set before the app's
// config is loaded, and dotenv never overrides a variable that already exists,
// so tests can never touch the real Atlas database or real keys from .env.
const keys = webpush.generateVAPIDKeys();

Object.assign(process.env, {
  NODE_ENV: 'test',
  MONGODB_URI: 'mongodb://placeholder', // replaced per file by the in-memory server
  MONGODB_DB: 'snipslot-test',
  JWT_SECRET: 'test-secret-that-is-long-enough-for-hs256-signing',
  GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
  OWNER_EMAILS: 'owner@test.nz',
  VAPID_PUBLIC_KEY: keys.publicKey,
  VAPID_PRIVATE_KEY: keys.privateKey,
  VAPID_SUBJECT: 'mailto:test@snipslot.test',
  ENABLE_CRON: 'false',
  CRON_SECRET: 'test-cron-secret-1234567890',
  AWS_REGION: 'ap-southeast-2',
  S3_BUCKET: 'test-bucket',
  AWS_ACCESS_KEY_ID: 'AKIATESTTESTTESTTEST',
  AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  LOG_LEVEL: 'error',
});
