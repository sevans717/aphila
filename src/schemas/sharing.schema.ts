import { z } from 'zod';

export const sharePostSchema = z.object({
  body: z.object({
    postId: z.string().uuid(),
    platform: z.enum(['twitter', 'facebook', 'instagram', 'internal']),
    message: z.string().max(280).optional(),
    recipients: z.array(z.string().uuid()).optional(), // For internal sharing
  }),
});

export const shareMediaSchema = z.object({
  body: z.object({
    mediaId: z.string().uuid(),
    platform: z.enum(['twitter', 'facebook', 'instagram', 'internal']),
    message: z.string().max(280).optional(),
    recipients: z.array(z.string().uuid()).optional(),
  }),
});

export const shareParamsSchema = z.object({
  params: z.object({
    shareId: z.string().uuid(),
  }),
});

export const getSharesQuerySchema = z.object({
  query: z.object({
    limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default(20),
    offset: z.string().transform(Number).pipe(z.number().min(0)).default(0),
    platform: z.enum(['twitter', 'facebook', 'instagram', 'internal']).optional(),
  }),
});

export type SharePostInput = z.infer<typeof sharePostSchema>;
export type ShareMediaInput = z.infer<typeof shareMediaSchema>;
export type ShareParams = z.infer<typeof shareParamsSchema>;
export type GetSharesQuery = z.infer<typeof getSharesQuerySchema>;
