"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommentsQuerySchema = exports.commentParamsSchema = exports.likeParamsSchema = exports.updateCommentSchema = exports.createCommentSchema = void 0;
const zod_1 = require("zod");
exports.createCommentSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string().min(1).max(280),
        parentCommentId: zod_1.z.string().uuid().optional(),
    }),
});
exports.updateCommentSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string().min(1).max(280),
    }),
});
exports.likeParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        postId: zod_1.z.string().uuid(),
    }),
});
exports.commentParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        postId: zod_1.z.string().uuid(),
        commentId: zod_1.z.string().uuid().optional(),
    }),
});
exports.getCommentsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(50)).default(20),
        offset: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(0)).default(0),
    }),
});
//# sourceMappingURL=social.schema.js.map