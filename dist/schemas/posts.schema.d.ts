import { z } from 'zod';
export declare const createPostSchema: z.ZodObject<{
    body: z.ZodObject<{
        content: z.ZodOptional<z.ZodString>;
        mediaIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        location: z.ZodOptional<z.ZodString>;
        privacy: z.ZodDefault<z.ZodEnum<{
            private: "private";
            public: "public";
            friends: "friends";
        }>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updatePostSchema: z.ZodObject<{
    body: z.ZodObject<{
        content: z.ZodOptional<z.ZodString>;
        privacy: z.ZodOptional<z.ZodEnum<{
            private: "private";
            public: "public";
            friends: "friends";
        }>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getPostsQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        limit: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
        offset: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
        userId: z.ZodOptional<z.ZodString>;
        privacy: z.ZodOptional<z.ZodEnum<{
            private: "private";
            public: "public";
            friends: "friends";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const postParamsSchema: z.ZodObject<{
    params: z.ZodObject<{
        postId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type GetPostsQuery = z.infer<typeof getPostsQuerySchema>;
export type PostParams = z.infer<typeof postParamsSchema>;
//# sourceMappingURL=posts.schema.d.ts.map