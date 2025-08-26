import { z } from 'zod';
export declare const sharePostSchema: z.ZodObject<{
    body: z.ZodObject<{
        postId: z.ZodString;
        platform: z.ZodEnum<{
            twitter: "twitter";
            facebook: "facebook";
            instagram: "instagram";
            internal: "internal";
        }>;
        message: z.ZodOptional<z.ZodString>;
        recipients: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const shareMediaSchema: z.ZodObject<{
    body: z.ZodObject<{
        mediaId: z.ZodString;
        platform: z.ZodEnum<{
            twitter: "twitter";
            facebook: "facebook";
            instagram: "instagram";
            internal: "internal";
        }>;
        message: z.ZodOptional<z.ZodString>;
        recipients: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const shareParamsSchema: z.ZodObject<{
    params: z.ZodObject<{
        shareId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getSharesQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        limit: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
        offset: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
        platform: z.ZodOptional<z.ZodEnum<{
            twitter: "twitter";
            facebook: "facebook";
            instagram: "instagram";
            internal: "internal";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type SharePostInput = z.infer<typeof sharePostSchema>;
export type ShareMediaInput = z.infer<typeof shareMediaSchema>;
export type ShareParams = z.infer<typeof shareParamsSchema>;
export type GetSharesQuery = z.infer<typeof getSharesQuerySchema>;
//# sourceMappingURL=sharing.schema.d.ts.map