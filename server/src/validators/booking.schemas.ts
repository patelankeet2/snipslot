import { z } from 'zod';
import { isoDate } from './common.schemas';

export const scheduleQuerySchema = z.object({
  date: isoDate.optional(), // defaults to today in the shop's timezone
});

// the owner closes off a booking once the appointment time has come
export const statusUpdateSchema = z.object({
  status: z.enum(['completed', 'no_show']),
});
