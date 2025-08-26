import { z } from 'zod';
export declare const createCommentSchema: z.ZodObject<{
    body: z.ZodObject<{
        content: z.ZodString;
        parentCommentId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateCommentSchema: z.ZodObject<{
    body: z.ZodObject<{
        content: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const likeParamsSchema: z.ZodObject<{
    params: z.ZodObject<{
        postId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const commentParamsSchema: z.ZodObject<{
    params: z.ZodObject<{
        postId: z.ZodString;
        commentId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getCommentsQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        limit: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
        offset: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type LikeParams = z.infer<typeof likeParamsSchema>;
export type CommentParams = z.infer<typeof commentParamsSchema>;
export type GetCommentsQuery = z.infer<typeof getCommentsQuerySchema>;
//# sourceMappingURL=social.schema.d.ts.map