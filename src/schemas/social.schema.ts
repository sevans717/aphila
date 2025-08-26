import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(280),
    parentCommentId: z.string().uuid().optional(),
  }),
});

export const updateCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(280),
  }),
});

export const likeParamsSchema = z.object({
  params: z.object({
    postId: z.string().uuid(),
  }),
});

export const commentParamsSchema = z.object({
  params: z.object({
    postId: z.string().uuid(),
    commentId: z.string().uuid().optional(),
  }),
});

export const getCommentsQuerySchema = z.object({
  query: z.object({
    limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default(20),
    offset: z.string().transform(Number).pipe(z.number().min(0)).default(0),
  }),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type LikeParams = z.infer<typeof likeParamsSchema>;
export type CommentParams = z.infer<typeof commentParamsSchema>;
export type GetCommentsQuery = z.infer<typeof getCommentsQuerySchema>;
