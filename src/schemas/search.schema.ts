import { z } from 'zod';

export const searchQuerySchema = z.object({
  query: z.object({
    q: z.string().min(1).max(100),
    type: z.enum(['all', 'posts', 'users', 'communities']).default('all'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default(20),
    offset: z.string().transform(Number).pipe(z.number().min(0)).default(0),
    sort: z.enum(['relevance', 'recent', 'popular']).default('relevance'),
  }),
});

export const searchPostsQuerySchema = z.object({
  query: z.object({
    q: z.string().min(1).max(100),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default(20),
    offset: z.string().transform(Number).pipe(z.number().min(0)).default(0),
    sort: z.enum(['relevance', 'recent', 'popular']).default('relevance'),
    privacy: z.enum(['public', 'friends', 'private']).optional(),
  }),
});

export const searchUsersQuerySchema = z.object({
  query: z.object({
    q: z.string().min(1).max(100),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default(20),
    offset: z.string().transform(Number).pipe(z.number().min(0)).default(0),
    sort: z.enum(['relevance', 'recent']).default('relevance'),
  }),
});

export const getSearchHistoryQuerySchema = z.object({
  query: z.object({
    limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default(20),
    offset: z.string().transform(Number).pipe(z.number().min(0)).default(0),
  }),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type SearchPostsQuery = z.infer<typeof searchPostsQuerySchema>;
export type SearchUsersQuery = z.infer<typeof searchUsersQuerySchema>;
export type GetSearchHistoryQuery = z.infer<typeof getSearchHistoryQuerySchema>;
