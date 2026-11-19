import type { WebPushError } from 'web-push';
import { webpush } from '../config/push';
import type { PushSubscriptionRepository } from '../repositories/PushSubscriptionRepository';
import type { UserRepository } from '../repositories/UserRepository';
import type { PushPayload } from '../notifications/NotificationFactory';
import type { PushSubscriptionInput } from '../validators/push.schemas';
import { logger } from '../utils/logger';

export interface SendResult {
  sent: number;
  removed: number; // expired subscriptions we cleaned up
  failed: number;
}

export class PushService {
  constructor(
    private readonly subscriptions: PushSubscriptionRepository,
    private readonly users: UserRepository,
  ) {}

  // One user can have several devices, each with its own endpoint.
  // Saving the same endpoint again just updates it (eg after signing in as someone else).
  async subscribe(userId: string, sub: PushSubscriptionInput, userAgent?: string) {
    return this.subscriptions.upsertByEndpoint(userId, sub, userAgent?.slice(0, 300));
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.subscriptions.deleteForUser(userId, endpoint);
  }

  async sendToUser(userId: string, payload: PushPayload) {
    return this.sendToUsers([userId], payload);
  }

  async sendToOwners(payload: PushPayload) {
    const owners = await this.users.findOwners();
    return this.sendToUsers(
      owners.map((o) => o.id),
      payload,
    );
  }

  private async sendToUsers(userIds: string[], payload: PushPayload): Promise<SendResult> {
    const result: SendResult = { sent: 0, removed: 0, failed: 0 };
    if (userIds.length === 0) return result;

    const subs = await this.subscriptions.findByUsers(userIds);
    const body = JSON.stringify(payload);

    await Promise.all(
      subs.map(async (sub) => {
        try {
          // web-push encrypts the payload with the device keys and signs it with VAPID
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
            body,
            { TTL: 60 * 60, urgency: 'normal' },
          );
          result.sent++;
        } catch (err) {
          const status = (err as WebPushError).statusCode;
          // 404 / 410: the browser has dropped this subscription, so forget it
          if (status === 404 || status === 410) {
            await this.subscriptions.deleteByEndpoint(sub.endpoint);
            result.removed++;
          } else {
            result.failed++;
            logger.warn('Push delivery failed', { status, endpoint: sub.endpoint.slice(0, 60) });
          }
        }
      }),
    );

    logger.info('Push sent', { title: payload.title, ...result });
    return result;
  }
}
