import { z } from 'zod';

export const createBookmarkCollectionSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    isPublic: z.boolean().default(false),
  }),
});

export const updateBookmarkCollectionSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    isPublic: z.boolean().optional(),
  }),
});

export const bookmarkPostSchema = z.object({
  body: z.object({
    postId: z.string().uuid(),
    collectionId: z.string().uuid().optional(),
  }),
});

export const collectionParamsSchema = z.object({
  params: z.object({
    collectionId: z.string().uuid(),
  }),
});

export const bookmarkParamsSchema = z.object({
  params: z.object({
    postId: z.string().uuid(),
  }),
});

export const getBookmarksQuerySchema = z.object({
  query: z.object({
    limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default(20),
    offset: z.string().transform(Number).pipe(z.number().min(0)).default(0),
    collectionId: z.string().uuid().optional(),
  }),
});

export type CreateBookmarkCollectionInput = z.infer<typeof createBookmarkCollectionSchema>;
export type UpdateBookmarkCollectionInput = z.infer<typeof updateBookmarkCollectionSchema>;
export type BookmarkPostInput = z.infer<typeof bookmarkPostSchema>;
export type CollectionParams = z.infer<typeof collectionParamsSchema>;
export type BookmarkParams = z.infer<typeof bookmarkParamsSchema>;
export type GetBookmarksQuery = z.infer<typeof getBookmarksQuerySchema>;
