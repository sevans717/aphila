import { z } from 'zod';
export declare const searchQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        q: z.ZodString;
        type: z.ZodDefault<z.ZodEnum<{
            all: "all";
            posts: "posts";
            users: "users";
            communities: "communities";
        }>>;
        limit: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
        offset: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
        sort: z.ZodDefault<z.ZodEnum<{
            relevance: "relevance";
            recent: "recent";
            popular: "popular";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const searchPostsQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        q: z.ZodString;
        limit: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
        offset: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
        sort: z.ZodDefault<z.ZodEnum<{
            relevance: "relevance";
            recent: "recent";
            popular: "popular";
        }>>;
        privacy: z.ZodOptional<z.ZodEnum<{
            private: "private";
            public: "public";
            friends: "friends";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const searchUsersQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        q: z.ZodString;
        limit: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
        offset: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
        sort: z.ZodDefault<z.ZodEnum<{
            relevance: "relevance";
            recent: "recent";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getSearchHistoryQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        limit: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
        offset: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type SearchPostsQuery = z.infer<typeof searchPostsQuerySchema>;
export type SearchUsersQuery = z.infer<typeof searchUsersQuerySchema>;
export type GetSearchHistoryQuery = z.infer<typeof getSearchHistoryQuerySchema>;
//# sourceMappingURL=search.schema.d.ts.map