import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(64).optional(),
  bio: z.string().max(1000).optional(),
  location: z.string().max(255).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
