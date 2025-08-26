import { z } from 'zod';

export const createStorySchema = z.object({
  body: z.object({
    mediaId: z.string().uuid(),
  }),
});

export const storyParamsSchema = z.object({
  params: z.object({
    storyId: z.string().uuid(),
  }),
});

export const viewStorySchema = z.object({
  body: z.object({
    storyId: z.string().uuid(),
  }),
});

export const getStoriesQuerySchema = z.object({
  query: z.object({
    limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default(20),
    offset: z.string().transform(Number).pipe(z.number().min(0)).default(0),
    userId: z.string().uuid().optional(),
    includeExpired: z.string().transform(Boolean).default(false),
  }),
});

export const getStoryViewersQuerySchema = z.object({
  query: z.object({
    limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default(50),
    offset: z.string().transform(Number).pipe(z.number().min(0)).default(0),
  }),
});

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type StoryParams = z.infer<typeof storyParamsSchema>;
export type ViewStoryInput = z.infer<typeof viewStorySchema>;
export type GetStoriesQuery = z.infer<typeof getStoriesQuerySchema>;
export type GetStoryViewersQuery = z.infer<typeof getStoryViewersQuerySchema>;
