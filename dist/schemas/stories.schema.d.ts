import { z } from 'zod';
export declare const createStorySchema: z.ZodObject<{
    body: z.ZodObject<{
        mediaId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const storyParamsSchema: z.ZodObject<{
    params: z.ZodObject<{
        storyId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const viewStorySchema: z.ZodObject<{
    body: z.ZodObject<{
        storyId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getStoriesQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        limit: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
        offset: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
        userId: z.ZodOptional<z.ZodString>;
        includeExpired: z.ZodDefault<z.ZodPipe<z.ZodString, z.ZodTransform<boolean, string>>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getStoryViewersQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        limit: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
        offset: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type StoryParams = z.infer<typeof storyParamsSchema>;
export type ViewStoryInput = z.infer<typeof viewStorySchema>;
export type GetStoriesQuery = z.infer<typeof getStoriesQuerySchema>;
export type GetStoryViewersQuery = z.infer<typeof getStoryViewersQuerySchema>;
//# sourceMappingURL=stories.schema.d.ts.map