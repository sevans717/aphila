"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const prisma_1 = require("../lib/prisma");
class SearchService {
    static async searchAll(userId, query, limit = 5) {
        const q = query.trim();
        if (!q)
            return { posts: [], users: [], communities: [] };
        const [posts, users, communities] = await Promise.all([
            prisma_1.prisma.post.findMany({
                where: {
                    content: { contains: q, mode: 'insensitive' },
                    isArchived: false
                },
                select: {
                    id: true,
                    content: true,
                    author: { select: { id: true, profile: { select: { displayName: true } } } },
                    createdAt: true
                },
                take: limit
            }),
            prisma_1.prisma.user.findMany({
                where: {
                    profile: { displayName: { contains: q, mode: 'insensitive' } },
                    isActive: true
                },
                select: {
                    id: true,
                    profile: { select: { displayName: true, bio: true } },
                    photos: { where: { isPrimary: true }, select: { url: true } }
                },
                take: limit
            }),
            prisma_1.prisma.community.findMany({
                where: {
                    name: { contains: q, mode: 'insensitive' }
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    _count: { select: { memberships: true } }
                },
                take: limit
            }),
        ]);
        // Log query with results count
        await prisma_1.prisma.searchQuery.create({
            data: {
                userId,
                query: q,
                results: posts.length + users.length + communities.length
            }
        });
        return { posts, users, communities };
    }
    static async searchPosts(userId, query, options = {}) {
        const { limit = 20, cursor } = options;
        const q = query.trim();
        const posts = await prisma_1.prisma.post.findMany({
            where: {
                content: { contains: q, mode: 'insensitive' },
                isArchived: false
            },
            include: {
                author: {
                    include: {
                        profile: { select: { displayName: true } },
                        photos: { where: { isPrimary: true }, select: { url: true } }
                    }
                },
                _count: { select: { likes: true, comments: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
        });
        let nextCursor;
        if (posts.length > limit) {
            const next = posts.pop();
            nextCursor = next?.id;
        }
        return { items: posts, nextCursor };
    }
    static async searchUsers(userId, query, options = {}) {
        const { limit = 20, cursor } = options;
        const q = query.trim();
        const users = await prisma_1.prisma.user.findMany({
            where: {
                OR: [
                    { profile: { displayName: { contains: q, mode: 'insensitive' } } },
                    { email: { contains: q, mode: 'insensitive' } }
                ],
                isActive: true,
                id: { not: userId }
            },
            include: {
                profile: { select: { displayName: true, bio: true } },
                photos: { where: { isPrimary: true }, select: { url: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
        });
        let nextCursor;
        if (users.length > limit) {
            const next = users.pop();
            nextCursor = next?.id;
        }
        return { items: users, nextCursor };
    }
    static async getSearchHistory(userId, limit = 10) {
        const history = await prisma_1.prisma.searchQuery.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { query: true, createdAt: true },
            distinct: ['query'],
            take: limit
        });
        return history;
    }
    static async clearSearchHistory(userId) {
        await prisma_1.prisma.searchQuery.deleteMany({ where: { userId } });
        return { success: true };
    }
}
exports.SearchService = SearchService;
//# sourceMappingURL=search.service.js.map