import { api, NetworkError } from './client';
import type { MyBooking } from '../types';
import { getUpcoming, saveUpcoming } from '../offline/bookingCache';
import { enqueue } from '../offline/outbox';
import { requestBackgroundSync } from '../offline/backgroundSync';
import { formatShortDate, formatTime } from '../utils/format';

export interface Slot {
  start: string;
  end: string;
}

export type { MyBooking };

export interface NewBooking {
  serviceId: string;
  barberId: string;
  start: string;
  notes?: string;
}

// Either the server answered, or we were offline and the change was queued
export type ChangeResult = { queued: false; booking: MyBooking } | { queued: true };

const describe = (b: MyBooking) => `${b.service.name} on ${formatShortDate(b.start)}`;

export const bookingsApi = {
  slots: (params: {
    serviceId: string;
    barberId: string;
    date: string;
    excludeBookingId?: string;
  }) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v) as [string, string][],
    );
    return api.get<{ date: string; slots: Slot[] }>(`/slots?${query}`).then((r) => r.slots);
  },

  // Booking needs a live check that the slot is still free, so it is online only
  create: (input: NewBooking) =>
    api.post<{ booking: MyBooking }>('/bookings', input).then((r) => r.booking),

  // Upcoming bookings are copied into IndexedDB so the list still opens offline
  async mine(scope: 'upcoming' | 'past'): Promise<MyBooking[]> {
    try {
      const { bookings } = await api.get<{ bookings: MyBooking[] }>(
        `/bookings/mine?scope=${scope}`,
      );
      if (scope === 'upcoming') await saveUpcoming(bookings);
      return bookings;
    } catch (err) {
      if (err instanceof NetworkError && scope === 'upcoming') return getUpcoming();
      throw err;
    }
  },

  async reschedule(booking: MyBooking, start: string): Promise<ChangeResult> {
    try {
      const res = await api.put<{ booking: MyBooking }>(`/bookings/${booking.id}`, { start });
      return { queued: false, booking: res.booking };
    } catch (err) {
      if (!(err instanceof NetworkError)) throw err;
      await enqueue({
        method: 'PUT',
        path: `/bookings/${booking.id}`,
        body: { start },
        bookingId: booking.id,
        kind: 'reschedule',
        label: `Move ${describe(booking)} to ${formatShortDate(start)} ${formatTime(start)}`,
      });
      await requestBackgroundSync();
      return { queued: true };
    }
  },

  async cancel(booking: MyBooking): Promise<ChangeResult> {
    try {
      const res = await api.delete<{ booking: MyBooking }>(`/bookings/${booking.id}`);
      return { queued: false, booking: res.booking };
    } catch (err) {
      if (!(err instanceof NetworkError)) throw err;
      await enqueue({
        method: 'DELETE',
        path: `/bookings/${booking.id}`,
        bookingId: booking.id,
        kind: 'cancel',
        label: `Cancel ${describe(booking)}`,
      });
      await requestBackgroundSync();
      return { queued: true };
    }
  },
};
