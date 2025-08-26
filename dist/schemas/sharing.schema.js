"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSharesQuerySchema = exports.shareParamsSchema = exports.shareMediaSchema = exports.sharePostSchema = void 0;
const zod_1 = require("zod");
exports.sharePostSchema = zod_1.z.object({
    body: zod_1.z.object({
        postId: zod_1.z.string().uuid(),
        platform: zod_1.z.enum(['twitter', 'facebook', 'instagram', 'internal']),
        message: zod_1.z.string().max(280).optional(),
        recipients: zod_1.z.array(zod_1.z.string().uuid()).optional(), // For internal sharing
    }),
});
exports.shareMediaSchema = zod_1.z.object({
    body: zod_1.z.object({
        mediaId: zod_1.z.string().uuid(),
        platform: zod_1.z.enum(['twitter', 'facebook', 'instagram', 'internal']),
        message: zod_1.z.string().max(280).optional(),
        recipients: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    }),
});
exports.shareParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        shareId: zod_1.z.string().uuid(),
    }),
});
exports.getSharesQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(50)).default(20),
        offset: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(0)).default(0),
        platform: zod_1.z.enum(['twitter', 'facebook', 'instagram', 'internal']).optional(),
    }),
});
//# sourceMappingURL=sharing.schema.js.map