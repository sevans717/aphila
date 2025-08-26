import { z } from 'zod';

export const analyticsDateRangeSchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  }),
});

export const trackEventSchema = z.object({
  body: z.object({
    event: z.string().min(1).max(100),
    properties: z.record(z.string(), z.any()).optional(),
    platform: z.string().optional(),
    appVersion: z.string().optional(),
    deviceInfo: z.record(z.string(), z.any()).optional(),
  }),
});

export const trackSessionSchema = z.object({
  body: z.object({
    action: z.enum(['start', 'end']),
    platform: z.string(),
    appVersion: z.string().optional(),
    sessionDuration: z.number().min(0).optional(), // For session end
  }),
});

export const trackSwipeSchema = z.object({
  body: z.object({
    targetUserId: z.string().uuid(),
    action: z.enum(['like', 'pass', 'super_like']),
    platform: z.string(),
  }),
});

export const trackMatchSchema = z.object({
  body: z.object({
    matchedUserId: z.string().uuid(),
    platform: z.string(),
  }),
});

export const trackMessageSchema = z.object({
  body: z.object({
    receiverId: z.string().uuid(),
    messageType: z.string(),
    platform: z.string(),
  }),
});

export const trackSubscriptionSchema = z.object({
  body: z.object({
    action: z.enum(['subscribe', 'cancel', 'renew', 'expire']),
    subscriptionType: z.string(),
    platform: z.string(),
  }),
});

export const trackFeatureUsageSchema = z.object({
  body: z.object({
    feature: z.string(),
    action: z.string(),
    platform: z.string(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
});

export type AnalyticsDateRangeQuery = z.infer<typeof analyticsDateRangeSchema>;
export type TrackEventInput = z.infer<typeof trackEventSchema>;
export type TrackSessionInput = z.infer<typeof trackSessionSchema>;
export type TrackSwipeInput = z.infer<typeof trackSwipeSchema>;
export type TrackMatchInput = z.infer<typeof trackMatchSchema>;
export type TrackMessageInput = z.infer<typeof trackMessageSchema>;
export type TrackSubscriptionInput = z.infer<typeof trackSubscriptionSchema>;
export type TrackFeatureUsageInput = z.infer<typeof trackFeatureUsageSchema>;
