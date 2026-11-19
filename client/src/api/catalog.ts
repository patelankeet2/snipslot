import { api } from './client';
import type { Barber, Booking, BookingStatus, OpeningHours, Service, ShopSettings } from '../types';

export type ServiceInput = Pick<Service, 'name' | 'durationMin' | 'price'> & {
  description?: string;
  photoUrl?: string;
  active?: boolean;
};

export type BarberInput = Pick<Barber, 'name' | 'workingDays'> & {
  bio?: string;
  active?: boolean;
  photoUrl?: string;
};

export const servicesApi = {
  list: (all = false) =>
    api.get<{ services: Service[] }>(`/services${all ? '?all=true' : ''}`).then((r) => r.services),
  create: (input: ServiceInput) =>
    api.post<{ service: Service }>('/services', input).then((r) => r.service),
  update: (id: string, input: Partial<ServiceInput>) =>
    api.put<{ service: Service }>(`/services/${id}`, input).then((r) => r.service),
  remove: (id: string) => api.delete<{ archived: boolean }>(`/services/${id}`),
};

export const barbersApi = {
  list: (all = false) =>
    api.get<{ barbers: Barber[] }>(`/barbers${all ? '?all=true' : ''}`).then((r) => r.barbers),
  create: (input: BarberInput) =>
    api.post<{ barber: Barber }>('/barbers', input).then((r) => r.barber),
  update: (id: string, input: Partial<BarberInput>) =>
    api.put<{ barber: Barber }>(`/barbers/${id}`, input).then((r) => r.barber),
  remove: (id: string) => api.delete<{ archived: boolean }>(`/barbers/${id}`),
};

export const settingsApi = {
  get: () => api.get<{ settings: ShopSettings }>('/settings').then((r) => r.settings),
  updateHours: (openingHours: OpeningHours[]) =>
    api
      .put<{ settings: ShopSettings }>('/settings/hours', { openingHours })
      .then((r) => r.settings),
};

export const scheduleApi = {
  forDay: (date: string) =>
    api.get<{ date: string; timezone: string; bookings: Booking[] }>(
      `/bookings/schedule?date=${encodeURIComponent(date)}`,
    ),
  setStatus: (id: string, status: Extract<BookingStatus, 'completed' | 'no_show'>) =>
    api.patch<{ booking: Booking }>(`/bookings/${id}/status`, { status }).then((r) => r.booking),
};
