import webpush from 'web-push';
import { env } from './env';

// Configure web-push once with our VAPID keys. Every push we send is signed
// with the private key, and browsers only accept pushes for subscriptions that
// were created with the matching public key.
webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

export { webpush };
