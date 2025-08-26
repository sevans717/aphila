import { z } from 'zod';
export declare const createBookmarkCollectionSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        isPublic: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateBookmarkCollectionSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        isPublic: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const bookmarkPostSchema: z.ZodObject<{
    body: z.ZodObject<{
        postId: z.ZodString;
        collectionId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const collectionParamsSchema: z.ZodObject<{
    params: z.ZodObject<{
        collectionId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const bookmarkParamsSchema: z.ZodObject<{
    params: z.ZodObject<{
        postId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getBookmarksQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        limit: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
        offset: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
        collectionId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type CreateBookmarkCollectionInput = z.infer<typeof createBookmarkCollectionSchema>;
export type UpdateBookmarkCollectionInput = z.infer<typeof updateBookmarkCollectionSchema>;
export type BookmarkPostInput = z.infer<typeof bookmarkPostSchema>;
export type CollectionParams = z.infer<typeof collectionParamsSchema>;
export type BookmarkParams = z.infer<typeof bookmarkParamsSchema>;
export type GetBookmarksQuery = z.infer<typeof getBookmarksQuerySchema>;
//# sourceMappingURL=bookmarks.schema.d.ts.map