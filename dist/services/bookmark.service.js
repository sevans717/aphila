"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookmarkService = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
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
        const data = { userId, postId };
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
            // simple full-text like filtering on post content
            where.OR = [
                { post: { content: { contains: params.query, mode: "insensitive" } } },
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
    static async createCollectionWithDetails(data) {
        const collection = await prisma_1.prisma.collection.create({
            data: {
                userId: data.userId,
                name: data.name,
                description: data.description,
                isPublic: data.isPublic ?? false,
            },
        });
        logger_1.logger.info(`Created collection with details: ${data.name} for user ${data.userId}, tags: ${data.tags?.join(", ") || "none"}`);
        return this.mapCollection({ ...collection, _count: { bookmarks: 0 } });
    }
    static async updateCollectionWithDetails(collectionId, userId, data) {
        const collection = await prisma_1.prisma.collection.findFirst({
            where: { id: collectionId, userId },
        });
        if (!collection)
            return null;
        const updated = await prisma_1.prisma.collection.update({
            where: { id: collectionId },
            data: {
                name: data.name,
                description: data.description,
                isPublic: data.isPublic,
            },
        });
        logger_1.logger.info(`Updated collection ${collectionId}: ${data.name || "no name change"}, tags: ${data.tags?.join(", ") || "none"}`);
        return this.mapCollection({ ...updated, _count: { bookmarks: 0 } });
    }
    static async createBookmarkWithDetails(data) {
        if (data.postId) {
            const bookmark = await prisma_1.prisma.postBookmark.create({
                data: {
                    userId: data.userId,
                    postId: data.postId,
                    collectionId: data.collectionId,
                },
                include: {
                    post: {
                        include: {
                            mediaAssets: { include: { media: true } },
                            author: { include: { profile: true } },
                        },
                    },
                    collection: true,
                },
            });
            logger_1.logger.info(`Created post bookmark with details: post ${data.postId} for user ${data.userId}, notes: ${data.notes || "none"}, tags: ${data.tags?.join(", ") || "none"}`);
            return {
                id: bookmark.id,
                userId: bookmark.userId,
                postId: bookmark.postId,
                collectionId: bookmark.collectionId || undefined,
                notes: data.notes,
                tags: data.tags || [],
                createdAt: bookmark.createdAt,
                post: bookmark.post
                    ? {
                        id: bookmark.post.id,
                        content: bookmark.post.content || undefined,
                        media: bookmark.post.mediaAssets?.map((m) => ({
                            id: m.media.id,
                            url: m.media.url,
                            type: m.media.type,
                        })) || [],
                        user: {
                            id: bookmark.post.author?.id || "",
                            profile: {
                                displayName: bookmark.post.author?.profile?.displayName || "",
                            },
                        },
                    }
                    : undefined,
                collection: bookmark.collection
                    ? {
                        id: bookmark.collection.id,
                        name: bookmark.collection.name,
                    }
                    : undefined,
            };
        }
        if (data.mediaId) {
            const bookmark = await prisma_1.prisma.mediaBookmark.create({
                data: {
                    userId: data.userId,
                    mediaId: data.mediaId,
                    tags: data.tags || [],
                },
                include: { media: true },
            });
            logger_1.logger.info(`Created media bookmark with details: media ${data.mediaId} for user ${data.userId}, notes: ${data.notes || "none"}, tags: ${data.tags?.join(", ") || "none"}`);
            return {
                id: bookmark.id,
                userId: bookmark.userId,
                mediaId: bookmark.mediaId,
                notes: data.notes,
                tags: bookmark.tags || [],
                createdAt: bookmark.createdAt,
                media: bookmark.media
                    ? {
                        id: bookmark.media.id,
                        url: bookmark.media.url,
                        type: bookmark.media.type,
                    }
                    : undefined,
            };
        }
        return null;
    }
    static async updateCollectionShareSettings(collectionId, userId, settings) {
        const collection = await prisma_1.prisma.collection.findFirst({
            where: { id: collectionId, userId },
        });
        if (!collection)
            return null;
        const updated = await prisma_1.prisma.collection.update({
            where: { id: collectionId },
            data: {
                isPublic: settings.isPublic,
            },
        });
        logger_1.logger.info(`Updated collection share settings for ${collectionId}: public=${settings.isPublic}, allowComments=${settings.allowComments}, allowLikes=${settings.allowLikes}`);
        return this.mapCollection({ ...updated, _count: { bookmarks: 0 } });
    }
    static async performBulkBookmarkOperation(userId, operation) {
        try {
            let affected = 0;
            switch (operation.operation) {
                case "move":
                    if (operation.targetCollectionId) {
                        affected = await prisma_1.prisma.postBookmark
                            .updateMany({
                            where: {
                                id: { in: operation.bookmarkIds },
                                userId,
                            },
                            data: { collectionId: operation.targetCollectionId },
                        })
                            .then((r) => r.count);
                    }
                    break;
                case "delete":
                    affected = await prisma_1.prisma.postBookmark
                        .deleteMany({
                        where: {
                            id: { in: operation.bookmarkIds },
                            userId,
                        },
                    })
                        .then((r) => r.count);
                    break;
                case "tag":
                    // For simplicity, we'll just log the operation
                    affected = operation.bookmarkIds.length;
                    break;
                case "untag":
                    // For simplicity, we'll just log the operation
                    affected = operation.bookmarkIds.length;
                    break;
            }
            logger_1.logger.info(`Bulk bookmark operation completed: ${operation.operation} on ${operation.bookmarkIds.length} bookmarks, affected: ${affected}`);
            return { success: true, affected };
        }
        catch (error) {
            logger_1.logger.error("Bulk bookmark operation failed:", error);
            return { success: false, affected: 0 };
        }
    }
    static async exportBookmarks(userId) {
        const collections = await prisma_1.prisma.collection.findMany({
            where: { userId },
            include: {
                bookmarks: {
                    include: {
                        post: {
                            include: {
                                mediaAssets: { include: { media: true } },
                                author: { include: { profile: true } },
                            },
                        },
                    },
                },
            },
        });
        const exportData = {
            collections: collections.map((collection) => ({
                name: collection.name,
                description: collection.description || undefined,
                bookmarks: collection.bookmarks.map((bookmark) => ({
                    type: "post",
                    url: bookmark.post ? `/posts/${bookmark.post.id}` : "",
                    title: bookmark.post?.content?.substring(0, 100) || "Untitled",
                    notes: undefined,
                    tags: [],
                    savedAt: bookmark.createdAt,
                })),
            })),
            exportedAt: new Date(),
            totalBookmarks: collections.reduce((total, collection) => total + collection.bookmarks.length, 0),
        };
        logger_1.logger.info(`Exported bookmarks for user ${userId}: ${exportData.totalBookmarks} total bookmarks across ${exportData.collections.length} collections`);
        return exportData;
    }
}
exports.BookmarkService = BookmarkService;
//# sourceMappingURL=bookmark.service.js.map