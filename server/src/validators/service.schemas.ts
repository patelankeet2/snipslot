import { z } from 'zod';

export const serviceCreateSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(60, 'Name is too long'),
  description: z.string().trim().max(300, 'Keep the description under 300 characters').optional(),
  durationMin: z.coerce
    .number()
    .int()
    .min(5, 'At least 5 minutes')
    .max(240, 'At most 4 hours')
    .refine((v) => v % 5 === 0, 'Use 5 minute steps'),
  price: z.coerce.number().min(0, 'Price cannot be negative').max(1000, 'Price looks too high'),
  active: z.boolean().optional(),
  // URL from POST /api/uploads/image, or an empty string to remove the photo
  photoUrl: z.union([z.url().max(500), z.literal('')]).optional(),
});

// same rules, every field optional, but at least one has to be sent
export const serviceUpdateSchema = serviceCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Nothing to update');

export const serviceListQuerySchema = z.object({
  all: z.enum(['true', 'false']).optional(),
});

export type ServiceInput = z.infer<typeof serviceCreateSchema>;
