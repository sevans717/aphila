"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialService = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
const error_1 = require("../utils/error");
class SocialService {
    static async createComment(userId, data) {
        try {
            const { postId, content, parentId, mediaUrl } = data;
            const comment = await prisma_1.prisma.postComment.create({
                data: {
                    userId,
                    postId,
                    content,
                    parentId,
                    mediaUrl,
                },
                include: {
                    user: {
                        include: {
                            profile: {
                                select: {
                                    displayName: true,
                                    bio: true,
                                }
                            },
                            photos: {
                                where: { isPrimary: true },
                                select: {
                                    url: true,
                                    isPrimary: true,
                                }
                            }
                        }
                    }
                }
            });
            logger_1.logger.info('Comment created', { commentId: comment.id, userId, postId });
            return {
                id: comment.id,
                author: {
                    id: comment.user.id,
                    profile: {
                        displayName: comment.user.profile.displayName,
                        bio: comment.user.profile.bio || undefined,
                    },
                    photos: comment.user.photos,
                },
                content: comment.content,
                likesCount: comment.likesCount,
                repliesCount: comment.repliesCount,
                isEdited: comment.isEdited,
                editedAt: comment.editedAt || undefined,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt,
                isLiked: false,
                userLikeType: undefined,
            };
        }
        catch (error) {
            logger_1.logger.error('Error creating comment', { error, userId, data });
            return (0, error_1.handleServiceError)(error);
        }
    }
    static async toggleCommentLike(commentId, userId) {
        try {
            const existingLike = await prisma_1.prisma.commentLike.findUnique({
                where: {
                    userId_commentId: {
                        userId,
                        commentId,
                    }
                }
            });
            let isLiked;
            let likesCount;
            if (existingLike) {
                await prisma_1.prisma.commentLike.delete({
                    where: {
                        userId_commentId: {
                            userId,
                            commentId,
                        }
                    }
                });
                const updatedComment = await prisma_1.prisma.postComment.update({
                    where: { id: commentId },
                    data: {
                        likesCount: {
                            decrement: 1
                        }
                    },
                    select: { likesCount: true }
                });
                isLiked = false;
                likesCount = updatedComment.likesCount;
            }
            else {
                await prisma_1.prisma.commentLike.create({
                    data: {
                        userId,
                        commentId,
                    }
                });
                const updatedComment = await prisma_1.prisma.postComment.update({
                    where: { id: commentId },
                    data: {
                        likesCount: {
                            increment: 1
                        }
                    },
                    select: { likesCount: true }
                });
                isLiked = true;
                likesCount = updatedComment.likesCount;
            }
            return { isLiked, likesCount };
        }
        catch (error) {
            logger_1.logger.error('Error toggling comment like', { error, commentId, userId });
            return (0, error_1.handleServiceError)(error);
        }
    }
    static async getPostComments(postId, viewerId, limit = 20) {
        try {
            const comments = await prisma_1.prisma.postComment.findMany({
                where: {
                    postId,
                    parentId: null,
                },
                include: {
                    user: {
                        include: {
                            profile: {
                                select: {
                                    displayName: true,
                                    bio: true,
                                }
                            },
                            photos: {
                                where: { isPrimary: true },
                                select: {
                                    url: true,
                                    isPrimary: true,
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: limit
            });
            return comments.map(comment => ({
                id: comment.id,
                author: {
                    id: comment.user.id,
                    profile: {
                        displayName: comment.user.profile.displayName,
                        bio: comment.user.profile.bio || undefined,
                    },
                    photos: comment.user.photos,
                },
                content: comment.content,
                likesCount: comment.likesCount,
                repliesCount: comment.repliesCount,
                isEdited: comment.isEdited,
                editedAt: comment.editedAt || undefined,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt,
                isLiked: false,
                userLikeType: undefined,
            }));
        }
        catch (error) {
            logger_1.logger.error('Error getting post comments', { error, postId, viewerId });
            return (0, error_1.handleServiceError)(error);
        }
    }
    static async getPostLikesBreakdown(postId) {
        try {
            const [post, likesBreakdown] = await Promise.all([
                prisma_1.prisma.post.findUnique({
                    where: { id: postId },
                    select: { likesCount: true }
                }),
                prisma_1.prisma.postLike.groupBy({
                    by: ['type'],
                    where: { postId },
                    _count: { type: true }
                })
            ]);
            if (!post) {
                throw new Error('Post not found');
            }
            const likeBreakdown = {};
            likesBreakdown.forEach(item => {
                likeBreakdown[item.type] = item._count.type;
            });
            return {
                totalLikes: post.likesCount,
                likeBreakdown,
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting post likes breakdown', { error, postId });
            return (0, error_1.handleServiceError)(error);
        }
    }
    static async togglePostLike(postId, userId, type = 'LIKE') {
        try {
            const existingLike = await prisma_1.prisma.postLike.findUnique({
                where: {
                    userId_postId: {
                        userId,
                        postId,
                    }
                }
            });
            let isLiked;
            let likesCount;
            if (existingLike) {
                await prisma_1.prisma.postLike.delete({
                    where: {
                        userId_postId: {
                            userId,
                            postId,
                        }
                    }
                });
                const updatedPost = await prisma_1.prisma.post.update({
                    where: { id: postId },
                    data: {
                        likesCount: {
                            decrement: 1
                        }
                    },
                    select: { likesCount: true }
                });
                isLiked = false;
                likesCount = updatedPost.likesCount;
            }
            else {
                await prisma_1.prisma.postLike.create({
                    data: {
                        userId,
                        postId,
                        type: type,
                    }
                });
                const updatedPost = await prisma_1.prisma.post.update({
                    where: { id: postId },
                    data: {
                        likesCount: {
                            increment: 1
                        }
                    },
                    select: { likesCount: true }
                });
                isLiked = true;
                likesCount = updatedPost.likesCount;
            }
            return { isLiked, likesCount };
        }
        catch (error) {
            logger_1.logger.error('Error toggling post like', { error, postId, userId });
            return (0, error_1.handleServiceError)(error);
        }
    }
    static async getPostLikes(postId, limit = 20, offset = 0) {
        try {
            const [likes, total] = await Promise.all([
                prisma_1.prisma.postLike.findMany({
                    where: { postId },
                    include: {
                        user: {
                            include: {
                                profile: {
                                    select: {
                                        displayName: true,
                                    }
                                },
                                photos: {
                                    where: { isPrimary: true },
                                    select: {
                                        url: true,
                                        isPrimary: true,
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: offset,
                    take: limit
                }),
                prisma_1.prisma.postLike.count({
                    where: { postId }
                })
            ]);
            return {
                likes: likes.map(like => ({
                    id: like.id,
                    type: like.type,
                    user: {
                        id: like.user.id,
                        profile: {
                            displayName: like.user.profile.displayName,
                        },
                        photos: like.user.photos,
                    },
                    createdAt: like.createdAt,
                })),
                total,
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting post likes', { error, postId });
            return (0, error_1.handleServiceError)(error);
        }
    }
    static async updateComment(commentId, authorId, data) {
        try {
            const comment = await prisma_1.prisma.postComment.update({
                where: {
                    id: commentId,
                    userId: authorId,
                },
                data: {
                    content: data.content,
                    isEdited: true,
                    editedAt: new Date(),
                },
                include: {
                    user: {
                        include: {
                            profile: {
                                select: {
                                    displayName: true,
                                    bio: true,
                                }
                            },
                            photos: {
                                where: { isPrimary: true },
                                select: {
                                    url: true,
                                    isPrimary: true,
                                }
                            }
                        }
                    }
                }
            });
            return {
                id: comment.id,
                author: {
                    id: comment.user.id,
                    profile: {
                        displayName: comment.user.profile.displayName,
                        bio: comment.user.profile.bio || undefined,
                    },
                    photos: comment.user.photos,
                },
                content: comment.content,
                likesCount: comment.likesCount,
                repliesCount: comment.repliesCount,
                isEdited: comment.isEdited,
                editedAt: comment.editedAt || undefined,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt,
                isLiked: false,
                userLikeType: undefined,
            };
        }
        catch (error) {
            logger_1.logger.error('Error updating comment', { error, commentId, authorId });
            return (0, error_1.handleServiceError)(error);
        }
    }
    static async deleteComment(commentId, authorId) {
        try {
            await prisma_1.prisma.postComment.delete({
                where: {
                    id: commentId,
                    userId: authorId,
                },
            });
            logger_1.logger.info('Comment deleted', { commentId, authorId });
        }
        catch (error) {
            logger_1.logger.error('Error deleting comment', { error, commentId, authorId });
            return (0, error_1.handleServiceError)(error);
        }
    }
    static async getCommentReplies(commentId, limit = 10, offset = 0) {
        try {
            const [replies, total] = await Promise.all([
                prisma_1.prisma.postComment.findMany({
                    where: {
                        parentId: commentId,
                    },
                    include: {
                        user: {
                            include: {
                                profile: {
                                    select: {
                                        displayName: true,
                                        bio: true,
                                    }
                                },
                                photos: {
                                    where: { isPrimary: true },
                                    select: {
                                        url: true,
                                        isPrimary: true,
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' },
                    skip: offset,
                    take: limit
                }),
                prisma_1.prisma.postComment.count({
                    where: {
                        parentId: commentId,
                    }
                })
            ]);
            return {
                replies: replies.map(reply => ({
                    id: reply.id,
                    author: {
                        id: reply.user.id,
                        profile: {
                            displayName: reply.user.profile.displayName,
                            bio: reply.user.profile.bio || undefined,
                        },
                        photos: reply.user.photos,
                    },
                    content: reply.content,
                    likesCount: reply.likesCount,
                    repliesCount: reply.repliesCount,
                    isEdited: reply.isEdited,
                    editedAt: reply.editedAt || undefined,
                    createdAt: reply.createdAt,
                    updatedAt: reply.updatedAt,
                    isLiked: false,
                    userLikeType: undefined,
                })),
                total,
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting comment replies', { error, commentId });
            return (0, error_1.handleServiceError)(error);
        }
    }
    static async getPostStats(postId) {
        try {
            const [post, likesBreakdown] = await Promise.all([
                prisma_1.prisma.post.findUnique({
                    where: { id: postId },
                    select: {
                        likesCount: true,
                        commentsCount: true,
                        sharesCount: true,
                        viewsCount: true,
                    }
                }),
                prisma_1.prisma.postLike.groupBy({
                    by: ['type'],
                    where: { postId },
                    _count: { type: true }
                })
            ]);
            if (!post) {
                throw new Error('Post not found');
            }
            const likeBreakdown = {};
            likesBreakdown.forEach(item => {
                likeBreakdown[item.type] = item._count.type;
            });
            return {
                likesCount: post.likesCount,
                commentsCount: post.commentsCount,
                sharesCount: post.sharesCount,
                viewsCount: post.viewsCount,
                likeBreakdown,
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting post stats', { error, postId });
            return (0, error_1.handleServiceError)(error);
        }
    }
}
exports.SocialService = SocialService;
//# sourceMappingURL=social.service.js.map