import { z } from 'zod';

export const createNotificationSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    type: z.string(),
    title: z.string().min(1).max(100),
    body: z.string().min(1).max(500),
    data: z.record(z.string(), z.any()).optional(),
  }),
});

export const markNotificationReadSchema = z.object({
  body: z.object({
    notificationIds: z.array(z.string().uuid()),
  }),
});

export const notificationParamsSchema = z.object({
  params: z.object({
    notificationId: z.string().uuid(),
  }),
});

export const getNotificationsQuerySchema = z.object({
  query: z.object({
    limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default(20),
    offset: z.string().transform(Number).pipe(z.number().min(0)).default(0),
    unreadOnly: z.string().transform(Boolean).default(false),
    type: z.string().optional(),
  }),
});

export const updatePushSettingsSchema = z.object({
  body: z.object({
    enabled: z.boolean(),
    types: z.array(z.string()).optional(),
  }),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;
export type NotificationParams = z.infer<typeof notificationParamsSchema>;
export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;
export type UpdatePushSettingsInput = z.infer<typeof updatePushSettingsSchema>;
