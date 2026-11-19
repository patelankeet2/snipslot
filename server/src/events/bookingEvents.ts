import { EventEmitter } from 'events';

// Observer pattern: the booking service only announces what happened.
// Whoever cares (push notifications today, maybe email or analytics later)
// subscribes here, so adding a new reaction never touches the booking code.

export interface BookingEventData {
  bookingId: string;
  customerId: string;
  customerName: string;
  serviceName: string;
  barberName: string;
  start: Date;
  // who triggered it, so we do not notify people about their own actions
  actorRole: 'customer' | 'owner' | 'system';
}

export interface BookingEvents {
  'booking.created': BookingEventData;
  'booking.rescheduled': BookingEventData & { previousStart: Date };
  'booking.cancelled': BookingEventData;
  'booking.reminder': BookingEventData;
}

export type BookingEventName = keyof BookingEvents;

// A thin typed wrapper so emit / on both check the event name and its data
class BookingEventBus {
  private readonly emitter = new EventEmitter();

  emit<K extends BookingEventName>(event: K, data: BookingEvents[K]) {
    this.emitter.emit(event, data);
  }

  on<K extends BookingEventName>(
    event: K,
    listener: (data: BookingEvents[K]) => void | Promise<void>,
  ) {
    this.emitter.on(event, listener);
  }

  removeAllListeners() {
    this.emitter.removeAllListeners();
  }
}

export const bookingEvents = new BookingEventBus();
