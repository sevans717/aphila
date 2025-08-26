import { z } from 'zod';
export declare const analyticsDateRangeSchema: z.ZodObject<{
    query: z.ZodObject<{
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
        period: z.ZodDefault<z.ZodEnum<{
            year: "year";
            week: "week";
            day: "day";
            month: "month";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const trackEventSchema: z.ZodObject<{
    body: z.ZodObject<{
        event: z.ZodString;
        properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        platform: z.ZodOptional<z.ZodString>;
        appVersion: z.ZodOptional<z.ZodString>;
        deviceInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const trackSessionSchema: z.ZodObject<{
    body: z.ZodObject<{
        action: z.ZodEnum<{
            end: "end";
            start: "start";
        }>;
        platform: z.ZodString;
        appVersion: z.ZodOptional<z.ZodString>;
        sessionDuration: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const trackSwipeSchema: z.ZodObject<{
    body: z.ZodObject<{
        targetUserId: z.ZodString;
        action: z.ZodEnum<{
            like: "like";
            pass: "pass";
            super_like: "super_like";
        }>;
        platform: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const trackMatchSchema: z.ZodObject<{
    body: z.ZodObject<{
        matchedUserId: z.ZodString;
        platform: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const trackMessageSchema: z.ZodObject<{
    body: z.ZodObject<{
        receiverId: z.ZodString;
        messageType: z.ZodString;
        platform: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const trackSubscriptionSchema: z.ZodObject<{
    body: z.ZodObject<{
        action: z.ZodEnum<{
            subscribe: "subscribe";
            cancel: "cancel";
            renew: "renew";
            expire: "expire";
        }>;
        subscriptionType: z.ZodString;
        platform: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const trackFeatureUsageSchema: z.ZodObject<{
    body: z.ZodObject<{
        feature: z.ZodString;
        action: z.ZodString;
        platform: z.ZodString;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type AnalyticsDateRangeQuery = z.infer<typeof analyticsDateRangeSchema>;
export type TrackEventInput = z.infer<typeof trackEventSchema>;
export type TrackSessionInput = z.infer<typeof trackSessionSchema>;
export type TrackSwipeInput = z.infer<typeof trackSwipeSchema>;
export type TrackMatchInput = z.infer<typeof trackMatchSchema>;
export type TrackMessageInput = z.infer<typeof trackMessageSchema>;
export type TrackSubscriptionInput = z.infer<typeof trackSubscriptionSchema>;
export type TrackFeatureUsageInput = z.infer<typeof trackFeatureUsageSchema>;
//# sourceMappingURL=analytics.schema.d.ts.map