"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postParamsSchema = exports.getPostsQuerySchema = exports.updatePostSchema = exports.createPostSchema = void 0;
const zod_1 = require("zod");
exports.createPostSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string().min(1).max(500).optional(),
        mediaIds: zod_1.z.array(zod_1.z.string()).optional(),
        location: zod_1.z.string().optional(),
        privacy: zod_1.z.enum(['public', 'friends', 'private']).default('public'),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
exports.updatePostSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string().min(1).max(500).optional(),
        privacy: zod_1.z.enum(['public', 'friends', 'private']).optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
exports.getPostsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(50)).default(20),
        offset: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(0)).default(0),
        userId: zod_1.z.string().optional(),
        privacy: zod_1.z.enum(['public', 'friends', 'private']).optional(),
    }),
});
exports.postParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        postId: zod_1.z.string().uuid(),
    }),
});
//# sourceMappingURL=posts.schema.js.map