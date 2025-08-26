"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSearchHistoryQuerySchema = exports.searchUsersQuerySchema = exports.searchPostsQuerySchema = exports.searchQuerySchema = void 0;
const zod_1 = require("zod");
exports.searchQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        q: zod_1.z.string().min(1).max(100),
        type: zod_1.z.enum(['all', 'posts', 'users', 'communities']).default('all'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(50)).default(20),
        offset: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(0)).default(0),
        sort: zod_1.z.enum(['relevance', 'recent', 'popular']).default('relevance'),
    }),
});
exports.searchPostsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        q: zod_1.z.string().min(1).max(100),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(50)).default(20),
        offset: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(0)).default(0),
        sort: zod_1.z.enum(['relevance', 'recent', 'popular']).default('relevance'),
        privacy: zod_1.z.enum(['public', 'friends', 'private']).optional(),
    }),
});
exports.searchUsersQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        q: zod_1.z.string().min(1).max(100),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(50)).default(20),
        offset: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(0)).default(0),
        sort: zod_1.z.enum(['relevance', 'recent']).default('relevance'),
    }),
});
exports.getSearchHistoryQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(50)).default(20),
        offset: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(0)).default(0),
    }),
});
//# sourceMappingURL=search.schema.js.map