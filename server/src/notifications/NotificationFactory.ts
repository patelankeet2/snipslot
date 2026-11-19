import { DateTime } from 'luxon';
import type { BookingEventData, BookingEventName } from '../events/bookingEvents';

// What the service worker receives and turns into a notification
export interface PushPayload {
  title: string;
  body: string;
  url: string; // page to open when the notification is tapped
  tag: string; // same tag replaces an older notification instead of stacking
}

const when = (start: Date, timezone: string) =>
  DateTime.fromJSDate(start).setZone(timezone).toFormat("ccc d LLL 'at' h:mm a");

// Factory pattern: one place that knows how to word each kind of notification.
// Adding a new event type means adding one case here, nothing else changes.
export class NotificationFactory {
  constructor(private readonly timezone = 'Pacific/Auckland') {}

  create(event: BookingEventName, data: BookingEventData): PushPayload {
    const at = when(data.start, this.timezone);

    switch (event) {
      case 'booking.created':
        return {
          title: 'New booking',
          body: `${data.customerName} booked ${data.serviceName} with ${data.barberName}, ${at}`,
          url: '/owner/today',
          tag: `booking-${data.bookingId}`,
        };
      case 'booking.rescheduled':
        return {
          title: 'Booking moved',
          body: `${data.customerName} moved ${data.serviceName} to ${at}`,
          url: '/owner/today',
          tag: `booking-${data.bookingId}`,
        };
      case 'booking.cancelled':
        return {
          title: 'Booking cancelled',
          body: `${data.customerName} cancelled ${data.serviceName}, ${at}`,
          url: '/owner/today',
          tag: `booking-${data.bookingId}`,
        };
      case 'booking.reminder':
        return {
          title: 'See you soon',
          body: `Your ${data.serviceName} with ${data.barberName} is ${at}`,
          url: '/bookings',
          tag: `reminder-${data.bookingId}`,
        };
    }
  }
}
