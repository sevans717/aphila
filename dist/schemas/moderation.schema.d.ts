import { z } from 'zod';
export declare const createReportSchema: z.ZodObject<{
    body: z.ZodObject<{
        reportedId: z.ZodString;
        reason: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        contentId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateReportStatusSchema: z.ZodObject<{
    body: z.ZodObject<{
        status: z.ZodEnum<{
            reviewed: "reviewed";
            resolved: "resolved";
        }>;
        action: z.ZodOptional<z.ZodEnum<{
            warn: "warn";
            suspend: "suspend";
            ban: "ban";
            dismiss: "dismiss";
        }>>;
        adminNotes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const reportParamsSchema: z.ZodObject<{
    params: z.ZodObject<{
        reportId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getReportsQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        status: z.ZodOptional<z.ZodEnum<{
            pending: "pending";
            reviewed: "reviewed";
            resolved: "resolved";
        }>>;
        type: z.ZodOptional<z.ZodEnum<{
            message: "message";
            photo: "photo";
            profile: "profile";
            behavior: "behavior";
        }>>;
        limit: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
        page: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const moderateContentSchema: z.ZodObject<{
    body: z.ZodObject<{
        content: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const userModerationParamsSchema: z.ZodObject<{
    params: z.ZodObject<{
        userId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportStatusInput = z.infer<typeof updateReportStatusSchema>;
export type ReportParams = z.infer<typeof reportParamsSchema>;
export type GetReportsQuery = z.infer<typeof getReportsQuerySchema>;
export type ModerateContentInput = z.infer<typeof moderateContentSchema>;
export type UserModerationParams = z.infer<typeof userModerationParamsSchema>;
//# sourceMappingURL=moderation.schema.d.ts.map