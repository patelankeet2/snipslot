import { pushApi } from '../api/push';

export type PushStatus =
  | 'unsupported' // this browser cannot do web push
  | 'needs-install' // iPhone / iPad: push only works once added to the home screen
  | 'denied' // the user blocked notifications for this site
  | 'enabled'
  | 'disabled';

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches;

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// The VAPID public key comes as URL safe base64, the Push API wants raw bytes
export function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normal = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normal);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function currentSubscription() {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function getPushStatus(): Promise<PushStatus> {
  if (isIos() && !isStandalone()) return 'needs-install';
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const sub = await currentSubscription();
  return sub && Notification.permission === 'granted' ? 'enabled' : 'disabled';
}

// Ask permission, create a subscription with our public key and give it to the API
export async function enablePush(): Promise<PushStatus> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'disabled';

  const reg = await navigator.serviceWorker.ready;
  const publicKey = await pushApi.publicKey();

  // drop a subscription made with an older key, the browser would reject it anyway
  const existing = await reg.pushManager.getSubscription();
  if (existing) await existing.unsubscribe();

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true, // every push must show a notification (required by browsers)
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  await pushApi.subscribe(subscription.toJSON());
  return 'enabled';
}

export async function disablePush(): Promise<PushStatus> {
  const sub = await currentSubscription();
  if (sub) {
    // tell the server first so it stops sending, then drop it in the browser
    await pushApi.unsubscribe(sub.endpoint).catch(() => undefined);
    await sub.unsubscribe();
  }
  return 'disabled';
}

// Used on sign out so the next person on this device does not get your notifications
export async function forgetPushOnThisDevice() {
  if (!pushSupported()) return;
  try {
    await disablePush();
  } catch {
    // not subscribed, nothing to do
  }
}
