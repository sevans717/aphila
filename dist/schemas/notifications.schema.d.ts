import { z } from 'zod';
export declare const createNotificationSchema: z.ZodObject<{
    body: z.ZodObject<{
        userId: z.ZodString;
        type: z.ZodString;
        title: z.ZodString;
        body: z.ZodString;
        data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const markNotificationReadSchema: z.ZodObject<{
    body: z.ZodObject<{
        notificationIds: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const notificationParamsSchema: z.ZodObject<{
    params: z.ZodObject<{
        notificationId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getNotificationsQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        limit: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
        offset: z.ZodDefault<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>>;
        unreadOnly: z.ZodDefault<z.ZodPipe<z.ZodString, z.ZodTransform<boolean, string>>>;
        type: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updatePushSettingsSchema: z.ZodObject<{
    body: z.ZodObject<{
        enabled: z.ZodBoolean;
        types: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;
export type NotificationParams = z.infer<typeof notificationParamsSchema>;
export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;
export type UpdatePushSettingsInput = z.infer<typeof updatePushSettingsSchema>;
//# sourceMappingURL=notifications.schema.d.ts.map