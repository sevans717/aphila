"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePushSettingsSchema = exports.getNotificationsQuerySchema = exports.notificationParamsSchema = exports.markNotificationReadSchema = exports.createNotificationSchema = void 0;
const zod_1 = require("zod");
exports.createNotificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string().uuid(),
        type: zod_1.z.string(),
        title: zod_1.z.string().min(1).max(100),
        body: zod_1.z.string().min(1).max(500),
        data: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    }),
});
exports.markNotificationReadSchema = zod_1.z.object({
    body: zod_1.z.object({
        notificationIds: zod_1.z.array(zod_1.z.string().uuid()),
    }),
});
exports.notificationParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        notificationId: zod_1.z.string().uuid(),
    }),
});
exports.getNotificationsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(50)).default(20),
        offset: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(0)).default(0),
        unreadOnly: zod_1.z.string().transform(Boolean).default(false),
        type: zod_1.z.string().optional(),
    }),
});
exports.updatePushSettingsSchema = zod_1.z.object({
    body: zod_1.z.object({
        enabled: zod_1.z.boolean(),
        types: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
//# sourceMappingURL=notifications.schema.js.map