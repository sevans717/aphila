"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookmarkService = void 0;
const prisma_1 = require("../lib/prisma");
class BookmarkService {
    // Collections
    static async createCollection(params) {
        const collection = await prisma_1.prisma.collection.create({
            data: {
                userId: params.userId,
                name: params.name,
                description: params.description,
                isPublic: params.isPublic ?? false,
            },
        });
        return this.mapCollection({ ...collection, _count: { bookmarks: 0 } });
    }
    static async getUserCollections(userId) {
        const collections = await prisma_1.prisma.collection.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        return collections.map((c) => this.mapCollection({ ...c, _count: { bookmarks: 0 } }));
    }
    static async getCollectionById(collectionId, userId) {
        const collection = await prisma_1.prisma.collection.findFirst({
            where: { id: collectionId, userId },
        });
        return collection
            ? this.mapCollection({ ...collection, _count: { bookmarks: 0 } })
            : null;
    }
    static mapCollection(c) {
        return {
            id: c.id,
            name: c.name,
            description: c.description || undefined,
            isPublic: c.isPublic,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            itemsCount: c._count?.bookmarks ?? 0,
        };
    }
    // Post bookmarks
    static async togglePostBookmark(userId, postId, collectionId) {
        const existing = await prisma_1.prisma.postBookmark.findUnique({
            where: { userId_postId: { userId, postId } },
        });
        if (existing) {
            await prisma_1.prisma.postBookmark.delete({ where: { id: existing.id } });
            return { bookmarked: false };
        }
        let data = { userId, postId };
        if (collectionId) {
            const owns = await prisma_1.prisma.collection.findFirst({
                where: { id: collectionId, userId },
            });
            if (owns)
                data.collectionId = collectionId;
        }
        const bookmark = await prisma_1.prisma.postBookmark.create({
            data,
        });
        return { bookmarked: true, bookmarkId: bookmark.id };
    }
    // Media bookmarks
    static async toggleMediaBookmark(userId, mediaId) {
        const existing = await prisma_1.prisma.mediaBookmark.findUnique({
            where: { userId_mediaId: { userId, mediaId } },
        });
        if (existing) {
            await prisma_1.prisma.mediaBookmark.delete({ where: { id: existing.id } });
            return { bookmarked: false };
        }
        const bookmark = await prisma_1.prisma.mediaBookmark.create({
            data: { userId, mediaId },
        });
        return { bookmarked: true, bookmarkId: bookmark.id };
    }
    static async getBookmarkStats(userId) {
        const [postCount, mediaCount, collectionsCount] = await Promise.all([
            prisma_1.prisma.postBookmark.count({ where: { userId } }),
            prisma_1.prisma.mediaBookmark.count({ where: { userId } }),
            prisma_1.prisma.collection.count({ where: { userId } }),
        ]);
        return {
            totalPostBookmarks: postCount,
            totalMediaBookmarks: mediaCount,
            collectionsCount,
        };
    }
    // Listing & search
    static async listBookmarks(params) {
        const limit = Math.min(params.limit ?? 25, 200);
        const offset = params.offset ?? 0;
        const where = { userId: params.userId };
        if (params.filters) {
            const f = params.filters;
            if (f.collectionId)
                where.collectionId = f.collectionId;
            if (f.type === "post")
                where.postId = { not: null };
            if (f.type === "media")
                where.mediaId = { not: null };
            if (f.hasNotes === true)
                where.notes = { not: null };
            if (f.dateFrom || f.dateTo)
                where.createdAt = {};
            if (f.dateFrom)
                where.createdAt.gte = f.dateFrom;
            if (f.dateTo)
                where.createdAt.lte = f.dateTo;
            if (f.tags && f.tags.length)
                where.tags = { hasSome: f.tags };
        }
        if (params.query) {
            // simple full-text like filtering on post content or media caption
            where.OR = [
                { post: { content: { contains: params.query, mode: "insensitive" } } },
                { media: { caption: { contains: params.query, mode: "insensitive" } } },
            ];
        }
        // Prisma does not have a unified `Bookmark` model in this schema. Query post and media bookmarks separately.
        const sortField = params.sortBy === "updated" ? "updatedAt" : "createdAt";
        if (params.filters?.type === "post") {
            const [total, items] = await Promise.all([
                prisma_1.prisma.postBookmark.count({ where }),
                prisma_1.prisma.postBookmark.findMany({
                    where,
                    include: {
                        post: {
                            include: {
                                mediaAssets: { include: { media: true } },
                                author: { include: { profile: true } },
                            },
                        },
                        collection: true,
                    },
                    orderBy: { [sortField]: params.sortOrder ?? "desc" },
                    take: limit,
                    skip: offset,
                }),
            ]);
            const mapped = items.map((b) => ({
                id: b.id,
                userId: b.userId,
                postId: b.postId || undefined,
                mediaId: undefined,
                collectionId: b.collectionId || undefined,
                notes: undefined,
                tags: [],
                createdAt: b.createdAt,
                post: b.post
                    ? {
                        id: b.post.id,
                        content: b.post.content || undefined,
                        media: (b.post.mediaAssets || []).map((m) => ({
                            id: m.media.id,
                            url: m.media.url,
                            type: m.media.type,
                        })),
                        user: {
                            id: b.post.author?.id,
                            profile: { displayName: b.post.author?.profile?.displayName },
                        },
                    }
                    : undefined,
                media: undefined,
                collection: b.collection
                    ? {
                        id: b.collection.id,
                        name: b.collection.name,
                        color: b.collection.color || undefined,
                    }
                    : undefined,
            }));
            return { items: mapped, total };
        }
        if (params.filters?.type === "media") {
            const [total, items] = await Promise.all([
                prisma_1.prisma.mediaBookmark.count({ where }),
                prisma_1.prisma.mediaBookmark.findMany({
                    where,
                    include: { media: true },
                    orderBy: { [sortField]: params.sortOrder ?? "desc" },
                    take: limit,
                    skip: offset,
                }),
            ]);
            const mapped = items.map((b) => ({
                id: b.id,
                userId: b.userId,
                postId: undefined,
                mediaId: b.mediaId || undefined,
                collectionId: undefined,
                notes: undefined,
                tags: b.tags || [],
                createdAt: b.createdAt,
                post: undefined,
                media: b.media
                    ? {
                        id: b.media.id,
                        url: b.media.url,
                        type: b.media.type,
                        caption: b.media.caption || undefined,
                    }
                    : undefined,
                collection: undefined,
            }));
            return { items: mapped, total };
        }
        // Combined listing: fetch both types, merge and sort in-memory, then paginate
        const [postTotal, mediaTotal, postItems, mediaItems] = await Promise.all([
            prisma_1.prisma.postBookmark.count({ where }),
            prisma_1.prisma.mediaBookmark.count({ where }),
            prisma_1.prisma.postBookmark.findMany({
                where,
                include: {
                    post: {
                        include: {
                            mediaAssets: { include: { media: true } },
                            author: { include: { profile: true } },
                        },
                    },
                    collection: true,
                },
                orderBy: { [sortField]: params.sortOrder ?? "desc" },
                take: 1000,
            }),
            prisma_1.prisma.mediaBookmark.findMany({
                where,
                include: { media: true },
                orderBy: { [sortField]: params.sortOrder ?? "desc" },
                take: 1000,
            }),
        ]);
        const mappedPosts = postItems.map((b) => ({
            id: b.id,
            userId: b.userId,
            postId: b.postId || undefined,
            mediaId: undefined,
            collectionId: b.collectionId || undefined,
            notes: undefined,
            tags: [],
            createdAt: b.createdAt,
            post: b.post
                ? {
                    id: b.post.id,
                    content: b.post.content || undefined,
                    media: (b.post.mediaAssets || []).map((m) => ({
                        id: m.media.id,
                        url: m.media.url,
                        type: m.media.type,
                    })),
                    user: {
                        id: b.post.author?.id,
                        profile: { displayName: b.post.author?.profile?.displayName },
                    },
                }
                : undefined,
            media: undefined,
            collection: b.collection
                ? {
                    id: b.collection.id,
                    name: b.collection.name,
                    color: b.collection.color || undefined,
                }
                : undefined,
        }));
        const mappedMedia = mediaItems.map((b) => ({
            id: b.id,
            userId: b.userId,
            postId: undefined,
            mediaId: b.mediaId || undefined,
            collectionId: undefined,
            notes: undefined,
            tags: b.tags || [],
            createdAt: b.createdAt,
            post: undefined,
            media: b.media
                ? {
                    id: b.media.id,
                    url: b.media.url,
                    type: b.media.type,
                    caption: b.media.caption || undefined,
                }
                : undefined,
            collection: undefined,
        }));
        const combined = mappedPosts.concat(mappedMedia);
        combined.sort((a, b) => (b.createdAt.getTime
            ? b.createdAt.getTime()
            : new Date(b.createdAt).getTime()) -
            (a.createdAt.getTime
                ? a.createdAt.getTime()
                : new Date(a.createdAt).getTime()));
        const total = postTotal + mediaTotal;
        const page = combined.slice(offset, offset + limit);
        return { items: page, total };
    }
    static async listCollectionsWithCounts(userId) {
        const cols = await prisma_1.prisma.collection.findMany({
            where: { userId },
            include: { _count: { select: { bookmarks: true } } },
            orderBy: { createdAt: "desc" },
        });
        return cols.map((c) => this.mapCollection({
            ...c,
            _count: { bookmarks: c._count?.bookmarks ?? 0 },
        }));
    }
    static async getCollectionAnalytics(collectionId) {
        // Collections in this schema are tied to post bookmarks only.
        const total = await prisma_1.prisma.postBookmark.count({ where: { collectionId } });
        const posts = total;
        const media = 0;
        const bookmarksByMonth = await prisma_1.prisma.$queryRaw `
      SELECT to_char("createdAt", 'YYYY-MM') AS month, count(*)::int AS count
      FROM "post_bookmarks"
      WHERE "collectionId" = ${collectionId}
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `;
        const mostUsedTags = [];
        return {
            collectionId,
            totalBookmarks: total,
            bookmarksByType: { posts, media },
            bookmarksByMonth: bookmarksByMonth.map((r) => ({
                month: r.month,
                count: Number(r.count),
            })),
            mostUsedTags,
            shareCount: 0,
            viewCount: 0,
        };
    }
}
exports.BookmarkService = BookmarkService;
//# sourceMappingURL=bookmark.service.js.map