"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostService = void 0;
const prisma_1 = require("../lib/prisma");
class PostService {
    static async getPostById(postId, viewerId) {
        const post = await prisma_1.prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: {
                    include: {
                        profile: { select: { displayName: true, bio: true } },
                        photos: { where: { isPrimary: true }, select: { url: true, isPrimary: true } }
                    }
                },
                community: { select: { id: true, name: true } },
                mediaAssets: { include: { media: true }, orderBy: { order: 'asc' } },
                _count: { select: { likes: true, comments: true, shares: true, views: true } }
            }
        });
        if (!post)
            return null;
        return {
            id: post.id,
            author: {
                id: post.author.id,
                profile: {
                    displayName: post.author.profile.displayName,
                    bio: post.author.profile.bio || undefined,
                },
                photos: post.author.photos,
            },
            community: post.community || undefined,
            content: post.content || undefined,
            mediaAssets: [],
            type: post.type,
            visibility: post.visibility,
            likesCount: post._count.likes,
            commentsCount: post._count.comments,
            sharesCount: post._count.shares,
            viewsCount: post._count.views,
            isEdited: post.isEdited,
            editedAt: post.editedAt || undefined,
            isPinned: post.isPinned,
            isArchived: post.isArchived,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            isLiked: false,
            isBookmarked: false,
            userLikeType: undefined,
        };
    }
    static async createPost(params) {
        const post = await prisma_1.prisma.post.create({
            data: {
                authorId: params.authorId,
                content: params.content ?? null,
                communityId: params.communityId || null,
                type: params.type || 'TEXT',
                visibility: params.visibility || 'PUBLIC'
            },
            include: {
                author: { include: { profile: { select: { displayName: true, bio: true } }, photos: { where: { isPrimary: true }, select: { url: true, isPrimary: true } } } },
                community: { select: { id: true, name: true } },
                mediaAssets: { include: { media: true }, orderBy: { order: 'asc' } },
                _count: { select: { likes: true, comments: true, shares: true, views: true } }
            }
        });
        return this.toPostWithDetails(post);
    }
    static async updatePost(postId, userId, data) {
        const existing = await prisma_1.prisma.post.findUnique({ where: { id: postId } });
        if (!existing || existing.authorId !== userId)
            return null;
        const updated = await prisma_1.prisma.post.update({
            where: { id: postId },
            data: {
                content: data.content ?? existing.content,
                isPinned: data.isPinned ?? existing.isPinned,
                isArchived: data.isArchived ?? existing.isArchived,
                isEdited: true,
                editedAt: new Date()
            },
            include: {
                author: { include: { profile: { select: { displayName: true, bio: true } }, photos: { where: { isPrimary: true }, select: { url: true, isPrimary: true } } } },
                community: { select: { id: true, name: true } },
                mediaAssets: { include: { media: true }, orderBy: { order: 'asc' } },
                _count: { select: { likes: true, comments: true, shares: true, views: true } }
            }
        });
        return this.toPostWithDetails(updated);
    }
    static async deletePost(postId, userId) {
        const existing = await prisma_1.prisma.post.findUnique({ where: { id: postId }, select: { id: true, authorId: true } });
        if (!existing || existing.authorId !== userId)
            return false;
        await prisma_1.prisma.post.delete({ where: { id: postId } });
        return true;
    }
    static async getFeed(userId, options = {}) {
        const { limit = 20, cursor } = options;
        const posts = await prisma_1.prisma.post.findMany({
            where: { isArchived: false },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            include: {
                author: { include: { profile: { select: { displayName: true, bio: true } }, photos: { where: { isPrimary: true }, select: { url: true, isPrimary: true } } } },
                community: { select: { id: true, name: true } },
                mediaAssets: { include: { media: true }, orderBy: { order: 'asc' } },
                _count: { select: { likes: true, comments: true, shares: true, views: true } }
            }
        });
        let nextCursor;
        if (posts.length > limit) {
            const next = posts.pop();
            nextCursor = next?.id;
        }
        return { items: posts.map(p => this.toPostWithDetails(p)), nextCursor };
    }
    static toPostWithDetails(post) {
        return {
            id: post.id,
            author: {
                id: post.author.id,
                profile: {
                    displayName: post.author.profile?.displayName || '',
                    bio: post.author.profile?.bio || undefined,
                },
                photos: post.author.photos || [],
            },
            community: post.community || undefined,
            content: post.content || undefined,
            mediaAssets: [],
            type: post.type,
            visibility: post.visibility,
            likesCount: post._count.likes,
            commentsCount: post._count.comments,
            sharesCount: post._count.shares,
            viewsCount: post._count.views,
            isEdited: post.isEdited,
            editedAt: post.editedAt || undefined,
            isPinned: post.isPinned,
            isArchived: post.isArchived,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            isLiked: false,
            isBookmarked: false,
            userLikeType: undefined,
        };
    }
}
exports.PostService = PostService;
//# sourceMappingURL=post.service.js.map