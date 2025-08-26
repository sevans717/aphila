import { z } from 'zod';

export const createPostSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(500).optional(),
    mediaIds: z.array(z.string()).optional(),
    location: z.string().optional(),
    privacy: z.enum(['public', 'friends', 'private']).default('public'),
    tags: z.array(z.string()).optional(),
  }),
});

export const updatePostSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(500).optional(),
    privacy: z.enum(['public', 'friends', 'private']).optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const getPostsQuerySchema = z.object({
  query: z.object({
    limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default(20),
    offset: z.string().transform(Number).pipe(z.number().min(0)).default(0),
    userId: z.string().optional(),
    privacy: z.enum(['public', 'friends', 'private']).optional(),
  }),
});

export const postParamsSchema = z.object({
  params: z.object({
    postId: z.string().uuid(),
  }),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type GetPostsQuery = z.infer<typeof getPostsQuerySchema>;
export type PostParams = z.infer<typeof postParamsSchema>;
