"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModerationParamsSchema = exports.moderateContentSchema = exports.getReportsQuerySchema = exports.reportParamsSchema = exports.updateReportStatusSchema = exports.createReportSchema = void 0;
const zod_1 = require("zod");
exports.createReportSchema = zod_1.z.object({
    body: zod_1.z.object({
        reportedId: zod_1.z.string().uuid(),
        reason: zod_1.z.string().min(1).max(100),
        description: zod_1.z.string().max(500).optional(),
        contentId: zod_1.z.string().uuid().optional(),
    }),
});
exports.updateReportStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(['reviewed', 'resolved']),
        action: zod_1.z.enum(['warn', 'suspend', 'ban', 'dismiss']).optional(),
        adminNotes: zod_1.z.string().max(500).optional(),
    }),
});
exports.reportParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        reportId: zod_1.z.string().uuid(),
    }),
});
exports.getReportsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        status: zod_1.z.enum(['pending', 'reviewed', 'resolved']).optional(),
        type: zod_1.z.enum(['profile', 'message', 'photo', 'behavior']).optional(),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(50)).default(20),
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).default(1),
    }),
});
exports.moderateContentSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string().min(1),
    }),
});
exports.userModerationParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().uuid(),
    }),
});
//# sourceMappingURL=moderation.schema.js.map