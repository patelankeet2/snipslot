import { z } from 'zod';

// These mirror the server rules so people get feedback before a request is sent.
// The server still validates everything, this is only for a better experience.

export const serviceFormSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(60, 'Name is too long'),
  description: z.string().trim().max(300, 'Keep it under 300 characters'),
  durationMin: z.coerce
    .number({ message: 'Enter a number of minutes' })
    .int('Whole minutes only')
    .min(5, 'At least 5 minutes')
    .max(240, 'At most 4 hours')
    .refine((v) => v % 5 === 0, 'Use 5 minute steps (5, 10, 15...)'),
  price: z.coerce
    .number({ message: 'Enter a price' })
    .min(0, 'Price cannot be negative')
    .max(1000, 'Price looks too high'),
});

export const barberFormSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(60, 'Name is too long'),
  bio: z.string().trim().max(300, 'Keep it under 300 characters'),
  workingDays: z.array(z.number()).min(1, 'Pick at least one working day'),
});

export const dayHoursSchema = z
  .object({
    day: z.number(),
    open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Pick a time'),
    close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Pick a time'),
    closed: z.boolean(),
  })
  .refine((h) => h.closed || h.open < h.close, {
    message: 'Closing must be after opening',
    path: ['close'],
  });

export type FieldErrors = Record<string, string>;

// Turn a zod result into { fieldName: firstMessage } for the form to show
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
