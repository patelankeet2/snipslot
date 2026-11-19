import { api } from './client';

export const pushApi = {
  publicKey: () => api.get<{ publicKey: string }>('/push/public-key').then((r) => r.publicKey),
  subscribe: (subscription: PushSubscriptionJSON) =>
    api.post<void>('/push/subscribe', subscription),
  unsubscribe: (endpoint: string) => api.deleteWithBody<void>('/push/subscribe', { endpoint }),
  sendTest: () =>
    api.post<{ sent: number; removed: number; failed: number }>('/push/test', {
      title: 'Test from SnipSlot',
      body: 'Push notifications are working on this device.',
    }),
};
