import { describe, expect, it } from 'vitest';
import { NotificationFactory } from '../../src/notifications/NotificationFactory';
import type { BookingEventData } from '../../src/events/bookingEvents';

const data: BookingEventData = {
  bookingId: 'abc123',
  customerId: 'cust1',
  customerName: 'Aroha',
  serviceName: 'Skin Fade',
  barberName: 'Jordan',
  start: new Date('2030-01-07T21:00:00Z'), // Tue 8 Jan, 10:00 am in Auckland
  actorRole: 'customer',
};

describe('NotificationFactory', () => {
  const factory = new NotificationFactory('Pacific/Auckland');

  it('tells the owner about a new booking, in shop time', () => {
    expect(factory.create('booking.created', data)).toEqual({
      title: 'New booking',
      body: 'Aroha booked Skin Fade with Jordan, Tue 8 Jan at 10:00 AM',
      url: '/owner/today',
      tag: 'booking-abc123',
    });
  });

  it('words cancellations and moves differently', () => {
    expect(factory.create('booking.cancelled', data).title).toBe('Booking cancelled');
    expect(factory.create('booking.rescheduled', data).body).toContain('moved Skin Fade to');
  });

  it('sends the customer to their bookings for a reminder', () => {
    const reminder = factory.create('booking.reminder', data);
    expect(reminder.title).toBe('See you soon');
    expect(reminder.url).toBe('/bookings');
    // a separate tag so the reminder does not replace the booking notification
    expect(reminder.tag).toBe('reminder-abc123');
  });
});
