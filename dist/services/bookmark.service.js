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
            }
        });
        return this.mapCollection({ ...collection, _count: { bookmarks: 0 } });
    }
    static async getUserCollections(userId) {
        const collections = await prisma_1.prisma.collection.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        return collections.map((c) => this.mapCollection({ ...c, _count: { bookmarks: 0 } }));
    }
    static async getCollectionById(collectionId, userId) {
        const collection = await prisma_1.prisma.collection.findFirst({
            where: { id: collectionId, userId }
        });
        return collection ? this.mapCollection({ ...collection, _count: { bookmarks: 0 } }) : null;
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
            where: { userId_postId: { userId, postId } }
        });
        if (existing) {
            await prisma_1.prisma.postBookmark.delete({ where: { id: existing.id } });
            return { bookmarked: false };
        }
        let data = { userId, postId };
        if (collectionId) {
            const owns = await prisma_1.prisma.collection.findFirst({ where: { id: collectionId, userId } });
            if (owns)
                data.collectionId = collectionId;
        }
        const bookmark = await prisma_1.prisma.postBookmark.create({
            data
        });
        return { bookmarked: true, bookmarkId: bookmark.id };
    }
    // Media bookmarks
    static async toggleMediaBookmark(userId, mediaId) {
        const existing = await prisma_1.prisma.mediaBookmark.findUnique({
            where: { userId_mediaId: { userId, mediaId } }
        });
        if (existing) {
            await prisma_1.prisma.mediaBookmark.delete({ where: { id: existing.id } });
            return { bookmarked: false };
        }
        const bookmark = await prisma_1.prisma.mediaBookmark.create({
            data: { userId, mediaId }
        });
        return { bookmarked: true, bookmarkId: bookmark.id };
    }
    static async getBookmarkStats(userId) {
        const [postCount, mediaCount, collectionsCount] = await Promise.all([
            prisma_1.prisma.postBookmark.count({ where: { userId } }),
            prisma_1.prisma.mediaBookmark.count({ where: { userId } }),
            prisma_1.prisma.collection.count({ where: { userId } })
        ]);
        return {
            totalPostBookmarks: postCount,
            totalMediaBookmarks: mediaCount,
            collectionsCount
        };
    }
}
exports.BookmarkService = BookmarkService;
//# sourceMappingURL=bookmark.service.js.map