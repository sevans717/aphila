"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackFeatureUsageSchema = exports.trackSubscriptionSchema = exports.trackMessageSchema = exports.trackMatchSchema = exports.trackSwipeSchema = exports.trackSessionSchema = exports.trackEventSchema = exports.analyticsDateRangeSchema = void 0;
const zod_1 = require("zod");
exports.analyticsDateRangeSchema = zod_1.z.object({
    query: zod_1.z.object({
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
        period: zod_1.z.enum(['day', 'week', 'month', 'year']).default('month'),
    }),
});
exports.trackEventSchema = zod_1.z.object({
    body: zod_1.z.object({
        event: zod_1.z.string().min(1).max(100),
        properties: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
        platform: zod_1.z.string().optional(),
        appVersion: zod_1.z.string().optional(),
        deviceInfo: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    }),
});
exports.trackSessionSchema = zod_1.z.object({
    body: zod_1.z.object({
        action: zod_1.z.enum(['start', 'end']),
        platform: zod_1.z.string(),
        appVersion: zod_1.z.string().optional(),
        sessionDuration: zod_1.z.number().min(0).optional(), // For session end
    }),
});
exports.trackSwipeSchema = zod_1.z.object({
    body: zod_1.z.object({
        targetUserId: zod_1.z.string().uuid(),
        action: zod_1.z.enum(['like', 'pass', 'super_like']),
        platform: zod_1.z.string(),
    }),
});
exports.trackMatchSchema = zod_1.z.object({
    body: zod_1.z.object({
        matchedUserId: zod_1.z.string().uuid(),
        platform: zod_1.z.string(),
    }),
});
exports.trackMessageSchema = zod_1.z.object({
    body: zod_1.z.object({
        receiverId: zod_1.z.string().uuid(),
        messageType: zod_1.z.string(),
        platform: zod_1.z.string(),
    }),
});
exports.trackSubscriptionSchema = zod_1.z.object({
    body: zod_1.z.object({
        action: zod_1.z.enum(['subscribe', 'cancel', 'renew', 'expire']),
        subscriptionType: zod_1.z.string(),
        platform: zod_1.z.string(),
    }),
});
exports.trackFeatureUsageSchema = zod_1.z.object({
    body: zod_1.z.object({
        feature: zod_1.z.string(),
        action: zod_1.z.string(),
        platform: zod_1.z.string(),
        metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    }),
});
//# sourceMappingURL=analytics.schema.js.map