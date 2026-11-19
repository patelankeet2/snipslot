import {
  bookingEvents,
  type BookingEventData,
  type BookingEventName,
} from '../events/bookingEvents';
import type { NotificationFactory } from '../notifications/NotificationFactory';
import type { PushService } from '../services/PushService';
import { logger } from '../utils/logger';

// Subscribes push notifications to booking events (the "observer" side).
// A failed push is logged and never breaks the booking request that caused it.
export function registerNotificationListener(push: PushService, factory: NotificationFactory) {
  const safely =
    (event: BookingEventName, send: (data: BookingEventData) => Promise<unknown>) =>
    async (data: BookingEventData) => {
      try {
        await send(data);
      } catch (err) {
        logger.error('Notification listener failed', {
          event,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    };

  // the owner hears about every change a customer makes
  for (const event of ['booking.created', 'booking.rescheduled', 'booking.cancelled'] as const) {
    bookingEvents.on(
      event,
      safely(event, async (data) => {
        if (data.actorRole === 'owner') return; // the owner knows, they did it
        await push.sendToOwners(factory.create(event, data));
      }),
    );
  }

  // the customer gets their reminder before the appointment
  bookingEvents.on(
    'booking.reminder',
    safely('booking.reminder', (data) =>
      push.sendToUser(data.customerId, factory.create('booking.reminder', data)),
    ),
  );
}
