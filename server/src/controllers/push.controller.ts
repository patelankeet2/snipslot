import type { Request, Response } from 'express';
import { env } from '../config/env';
import { pushService } from '../container';

// The browser needs the public key to create a subscription. It is public by design.
export function getPublicKey(_req: Request, res: Response) {
  res.json({ publicKey: env.VAPID_PUBLIC_KEY });
}

export async function subscribe(req: Request, res: Response) {
  await pushService.subscribe(req.user!.id, req.body, req.get('user-agent'));
  res.status(201).json({ subscribed: true });
}

export async function unsubscribe(req: Request, res: Response) {
  await pushService.unsubscribe(req.user!.id, req.body.endpoint);
  res.status(204).end();
}

// Sends a notification to the signed in user's own devices. Handy for checking
// the whole chain (keys, subscription, service worker) from Postman.
export async function sendTest(req: Request, res: Response) {
  const result = await pushService.sendToUser(req.user!.id, {
    title: req.body.title,
    body: req.body.body,
    url: '/profile',
    tag: 'test',
  });
  res.json(result);
}
