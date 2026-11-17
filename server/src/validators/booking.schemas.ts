import { z } from 'zod';
import { isoDate } from './common.schemas';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const isoInstant = z.iso.datetime({ offset: true, message: 'Use an ISO date and time' });

export const scheduleQuerySchema = z.object({
  date: isoDate.optional(), // defaults to today in the shop's timezone
});

// the owner closes off a booking once the appointment time has come
export const statusUpdateSchema = z.object({
  status: z.enum(['completed', 'no_show']),
});

export const slotsQuerySchema = z.object({
  serviceId: objectId,
  barberId: objectId,
  date: isoDate,
  // when rescheduling, the booking being moved should not block its own time
  excludeBookingId: objectId.optional(),
});

export const bookingCreateSchema = z.object({
  serviceId: objectId,
  barberId: objectId,
  start: isoInstant,
  notes: z.string().trim().max(300, 'Keep notes under 300 characters').optional(),
});

export const bookingRescheduleSchema = z.object({
  start: isoInstant,
  barberId: objectId.optional(), // optional switch to another barber
});

export const myBookingsQuerySchema = z.object({
  scope: z.enum(['upcoming', 'past']).default('upcoming'),
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type BookingRescheduleInput = z.infer<typeof bookingRescheduleSchema>;
