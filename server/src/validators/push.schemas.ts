import { z } from 'zod';

// Exactly what PushSubscription.toJSON() gives in the browser
export const pushSubscriptionSchema = z.object({
  endpoint: z.url({ protocol: /^https$/, message: 'Endpoint must be an https URL' }).max(1000),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(20).max(200),
    auth: z.string().min(8).max(100),
  }),
});

export const unsubscribeSchema = z.object({
  endpoint: z.url().max(1000),
});

export const testPushSchema = z.object({
  title: z.string().trim().min(1).max(60).default('Test notification'),
  body: z.string().trim().min(1).max(200).default('Push notifications are working.'),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
