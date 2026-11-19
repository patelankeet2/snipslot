import { z } from 'zod';

const workingDays = z
  .array(z.number().int().min(0).max(6))
  .max(7)
  .refine((days) => new Set(days).size === days.length, 'Each day can only appear once');

export const barberCreateSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(60, 'Name is too long'),
  bio: z.string().trim().max(300, 'Keep the bio under 300 characters').optional(),
  workingDays: workingDays.default([1, 2, 3, 4, 5]),
  active: z.boolean().optional(),
  // URL from POST /api/uploads/image, or an empty string to remove the photo
  photoUrl: z.union([z.url().max(500), z.literal('')]).optional(),
});

export const barberUpdateSchema = z
  .object({
    name: barberCreateSchema.shape.name,
    bio: barberCreateSchema.shape.bio,
    workingDays,
    active: z.boolean(),
    photoUrl: barberCreateSchema.shape.photoUrl,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Nothing to update');

export type BarberInput = z.infer<typeof barberCreateSchema>;
