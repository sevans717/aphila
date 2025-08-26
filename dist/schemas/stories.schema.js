"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoryViewersQuerySchema = exports.getStoriesQuerySchema = exports.viewStorySchema = exports.storyParamsSchema = exports.createStorySchema = void 0;
const zod_1 = require("zod");
exports.createStorySchema = zod_1.z.object({
    body: zod_1.z.object({
        mediaId: zod_1.z.string().uuid(),
    }),
});
exports.storyParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        storyId: zod_1.z.string().uuid(),
    }),
});
exports.viewStorySchema = zod_1.z.object({
    body: zod_1.z.object({
        storyId: zod_1.z.string().uuid(),
    }),
});
exports.getStoriesQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(50)).default(20),
        offset: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(0)).default(0),
        userId: zod_1.z.string().uuid().optional(),
        includeExpired: zod_1.z.string().transform(Boolean).default(false),
    }),
});
exports.getStoryViewersQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(50)).default(50),
        offset: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(0)).default(0),
    }),
});
//# sourceMappingURL=stories.schema.js.map