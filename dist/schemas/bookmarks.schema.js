"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookmarksQuerySchema = exports.bookmarkParamsSchema = exports.collectionParamsSchema = exports.bookmarkPostSchema = exports.updateBookmarkCollectionSchema = exports.createBookmarkCollectionSchema = void 0;
const zod_1 = require("zod");
exports.createBookmarkCollectionSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100),
        description: zod_1.z.string().max(500).optional(),
        isPublic: zod_1.z.boolean().default(false),
    }),
});
exports.updateBookmarkCollectionSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100).optional(),
        description: zod_1.z.string().max(500).optional(),
        isPublic: zod_1.z.boolean().optional(),
    }),
});
exports.bookmarkPostSchema = zod_1.z.object({
    body: zod_1.z.object({
        postId: zod_1.z.string().uuid(),
        collectionId: zod_1.z.string().uuid().optional(),
    }),
});
exports.collectionParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        collectionId: zod_1.z.string().uuid(),
    }),
});
exports.bookmarkParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        postId: zod_1.z.string().uuid(),
    }),
});
exports.getBookmarksQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(50)).default(20),
        offset: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(0)).default(0),
        collectionId: zod_1.z.string().uuid().optional(),
    }),
});
//# sourceMappingURL=bookmarks.schema.js.map