import { z } from 'zod';
import { timeOfDay } from './common.schemas';

const dayHours = z
  .object({
    day: z.number().int().min(0).max(6),
    open: timeOfDay,
    close: timeOfDay,
    closed: z.boolean(),
  })
  // "09:00" < "17:30" works as a plain string compare because both are zero padded
  .refine((h) => h.closed || h.open < h.close, {
    message: 'Closing time must be after opening time',
    path: ['close'],
  });

export const hoursUpdateSchema = z.object({
  openingHours: z
    .array(dayHours)
    .length(7, 'Send all seven days')
    .refine((days) => new Set(days.map((d) => d.day)).size === 7, 'Each day must appear once'),
  slotStepMin: z.union([z.literal(10), z.literal(15), z.literal(20), z.literal(30)]).optional(),
});

export type HoursInput = z.infer<typeof hoursUpdateSchema>;
