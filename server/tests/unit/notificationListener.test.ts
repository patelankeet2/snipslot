import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bookingEvents, type BookingEventData } from '../../src/events/bookingEvents';
import { registerNotificationListener } from '../../src/listeners/notificationListener';
import { NotificationFactory } from '../../src/notifications/NotificationFactory';
import type { PushService } from '../../src/services/PushService';

const data: BookingEventData = {
  bookingId: 'b1',
  customerId: 'c1',
  customerName: 'Aroha',
  serviceName: 'Skin Fade',
  barberName: 'Jordan',
  start: new Date('2030-01-07T21:00:00Z'),
  actorRole: 'customer',
};

// emit is synchronous but the listeners are async, so let them finish
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('notification listener (observer)', () => {
  const push = { sendToOwners: vi.fn(), sendToUser: vi.fn() };

  beforeEach(() => {
    push.sendToOwners.mockReset().mockResolvedValue({ sent: 1, removed: 0, failed: 0 });
    push.sendToUser.mockReset().mockResolvedValue({ sent: 1, removed: 0, failed: 0 });
    registerNotificationListener(push as unknown as PushService, new NotificationFactory());
  });

  afterEach(() => bookingEvents.removeAllListeners());

  it('tells the owner when a customer books', async () => {
    bookingEvents.emit('booking.created', data);
    await settle();
    expect(push.sendToOwners).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New booking' }),
    );
  });

  it('tells the owner about moves and cancellations too', async () => {
    bookingEvents.emit('booking.rescheduled', { ...data, previousStart: new Date() });
    bookingEvents.emit('booking.cancelled', data);
    await settle();
    expect(push.sendToOwners.mock.calls.map(([p]) => p.title)).toEqual([
      'Booking moved',
      'Booking cancelled',
    ]);
  });

  it('does not notify the owner about changes the owner made', async () => {
    bookingEvents.emit('booking.cancelled', { ...data, actorRole: 'owner' });
    await settle();
    expect(push.sendToOwners).not.toHaveBeenCalled();
  });

  it('sends the reminder to the customer, not the owner', async () => {
    bookingEvents.emit('booking.reminder', { ...data, actorRole: 'system' });
    await settle();
    expect(push.sendToUser).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ title: 'See you soon' }),
    );
    expect(push.sendToOwners).not.toHaveBeenCalled();
  });

  it('never lets a push failure break the booking that caused it', async () => {
    push.sendToOwners.mockRejectedValue(new Error('push service down'));
    expect(() => bookingEvents.emit('booking.created', data)).not.toThrow();
    await settle(); // the error is caught and logged inside the listener
  });
});
