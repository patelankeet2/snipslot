import { api } from './client';
import type { Booking } from '../types';

export interface Slot {
  start: string;
  end: string;
}

// "my bookings" come back without the customer filled in (it is always you)
export type MyBooking = Omit<Booking, 'customer'>;

export interface NewBooking {
  serviceId: string;
  barberId: string;
  start: string;
  notes?: string;
}

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
  create: (input: NewBooking) =>
    api.post<{ booking: MyBooking }>('/bookings', input).then((r) => r.booking),
  mine: (scope: 'upcoming' | 'past') =>
    api.get<{ bookings: MyBooking[] }>(`/bookings/mine?scope=${scope}`).then((r) => r.bookings),
  reschedule: (id: string, start: string, barberId?: string) =>
    api
      .put<{ booking: MyBooking }>(`/bookings/${id}`, { start, ...(barberId ? { barberId } : {}) })
      .then((r) => r.booking),
  cancel: (id: string) =>
    api.delete<{ booking: MyBooking }>(`/bookings/${id}`).then((r) => r.booking),
};
