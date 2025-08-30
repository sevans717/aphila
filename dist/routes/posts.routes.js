"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
const analytics_service_1 = require("../services/analytics.service");
const router = (0, express_1.Router)();
// Validation schemas
const createPostSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string().min(1).max(2000),
        mediaIds: zod_1.z.array(zod_1.z.string()).optional().default([]),
        communityId: zod_1.z.string().optional(),
        isPublic: zod_1.z.boolean().optional().default(true),
        tags: zod_1.z.array(zod_1.z.string()).optional().default([]),
    }),
});
const updatePostSchema = zod_1.z.object({
    params: zod_1.z.object({
        postId: zod_1.z.string(),
    }),
    body: zod_1.z.object({
        content: zod_1.z.string().min(1).max(2000).optional(),
        mediaIds: zod_1.z.array(zod_1.z.string()).optional(),
        isPublic: zod_1.z.boolean().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
const postParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        postId: zod_1.z.string(),
    }),
});
const postsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        communityId: zod_1.z.string().optional(),
        userId: zod_1.z.string().optional(),
        limit: zod_1.z
            .string()
            .transform(Number)
            .optional()
            .default(() => 20),
        offset: zod_1.z
            .string()
            .transform(Number)
            .optional()
            .default(() => 0),
        sortBy: zod_1.z
            .enum(["newest", "oldest", "popular"])
            .optional()
            .default("newest"),
    }),
});
const likePostSchema = zod_1.z.object({
    params: zod_1.z.object({
        postId: zod_1.z.string(),
    }),
});
const commentSchema = zod_1.z.object({
    params: zod_1.z.object({
        postId: zod_1.z.string(),
    }),
    body: zod_1.z.object({
        content: zod_1.z.string().min(1).max(500),
        parentId: zod_1.z.string().optional(),
    }),
});
const commentParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        postId: zod_1.z.string(),
        commentId: zod_1.z.string(),
    }),
});
/**
 * Create a new post
 * POST /api/v1/posts
 */
router.post("/", auth_1.requireAuth, (0, validate_1.validateRequest)({ body: createPostSchema.shape.body }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { content, mediaIds, communityId, isPublic } = req.body;
        // Verify community access if specified
        if (communityId) {
            const communityMember = await prisma_1.prisma.communityMembership.findFirst({
                where: {
                    communityId,
                    userId,
                    role: {
                        in: ["MEMBER", "MODERATOR", "ADMIN"],
                    },
                },
            });
            if (!communityMember) {
                return response_1.ResponseHelper.error(res, "FORBIDDEN", "You are not a member of this community", 403);
            }
        }
        // Create the post
        const post = await prisma_1.prisma.post.create({
            data: {
                content,
                authorId: userId,
                communityId: communityId || null,
                isPublic,
                mediaAssets: mediaIds.length > 0
                    ? {
                        create: mediaIds.map((mediaId) => ({
                            mediaId,
                        })),
                    }
                    : undefined,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                displayName: true,
                                // avatar: true, // Temporarily commented out
                            },
                        },
                    },
                },
                community: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                mediaAssets: {
                    include: {
                        media: {
                            select: {
                                id: true,
                                url: true,
                                type: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        });
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: "post_created",
            properties: {
                postId: post.id,
                hasMedia: mediaIds.length > 0,
                communityId,
                isPublic,
                contentLength: content.length,
            },
        }).catch((err) => {
            logger_1.logger.warn("Failed to track post creation analytics:", err);
        });
        logger_1.logger.info("Post created:", {
            postId: post.id,
            userId,
            communityId,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, post, 201);
    }
    catch (error) {
        logger_1.logger.error("Failed to create post:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to create post");
    }
});
/**
 * Get posts feed
 * GET /api/v1/posts
 */
router.get("/", auth_1.requireAuth, (0, validate_1.validateRequest)({ query: postsQuerySchema.shape.query }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { communityId, userId: targetUserId, limit, offset, sortBy, } = req.validatedQuery;
        // Build where clause
        const where = {
            isPublic: true,
        };
        if (communityId) {
            where.communityId = communityId;
        }
        if (targetUserId) {
            where.authorId = targetUserId;
        }
        else {
            // For general feed, only show posts from communities user is member of
            const userCommunities = await prisma_1.prisma.communityMembership.findMany({
                where: {
                    userId,
                    role: {
                        in: ["MEMBER", "MODERATOR", "ADMIN"],
                    },
                },
                select: {
                    communityId: true,
                },
            });
            const communityIds = userCommunities.map((cm) => cm.communityId);
            where.OR = [
                { communityId: { in: communityIds } },
                { communityId: null }, // Public posts
            ];
        }
        // Build order by
        let orderBy = { createdAt: "desc" };
        if (sortBy === "popular") {
            orderBy = [{ likes: { _count: "desc" } }, { createdAt: "desc" }];
        }
        else if (sortBy === "oldest") {
            orderBy = { createdAt: "asc" };
        }
        const posts = await prisma_1.prisma.post.findMany({
            where,
            include: {
                author: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                displayName: true,
                                // avatar: true, // Temporarily commented out
                            },
                        },
                    },
                },
                community: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                mediaAssets: {
                    include: {
                        media: {
                            select: {
                                id: true,
                                url: true,
                                type: true,
                            },
                        },
                    },
                },
                likes: {
                    where: { userId },
                    select: { id: true },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
            orderBy,
            take: limit,
            skip: offset,
        });
        // Transform posts to include isLiked flag
        const transformedPosts = posts.map((post) => ({
            ...post,
            isLiked: (post.likes?.length ?? 0) > 0,
            likes: undefined, // Remove the likes array
        }));
        const total = await prisma_1.prisma.post.count({ where });
        return response_1.ResponseHelper.success(res, {
            posts: transformedPosts,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total,
            },
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to get posts:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to get posts");
    }
});
/**
 * Get single post
 * GET /api/v1/posts/:postId
 */
router.get("/:postId", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: postParamsSchema.shape.params }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { postId } = req.params;
        const post = (await prisma_1.prisma.post.findFirst({
            where: {
                id: postId,
                OR: [
                    { isPublic: true },
                    {
                        community: {
                            memberships: {
                                some: {
                                    userId,
                                    role: {
                                        in: ["MEMBER", "MODERATOR", "ADMIN"],
                                    },
                                },
                            },
                        },
                    },
                ],
            },
            include: {
                author: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                displayName: true,
                                // avatar: true, // Temporarily commented out
                            },
                        },
                    },
                },
                community: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                mediaAssets: {
                    include: {
                        media: {
                            select: {
                                id: true,
                                url: true,
                                type: true,
                            },
                        },
                    },
                },
                likes: {
                    where: { userId },
                    select: { id: true },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        }));
        if (!post) {
            return response_1.ResponseHelper.notFound(res, "Post");
        }
        // Transform post to include isLiked flag
        const transformedPost = {
            ...post,
            isLiked: (post.likes?.length ?? 0) > 0,
            likes: undefined,
        };
        return response_1.ResponseHelper.success(res, transformedPost);
    }
    catch (error) {
        logger_1.logger.error("Failed to get post:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to get post");
    }
});
/**
 * Update post
 * PUT /api/v1/posts/:postId
 */
router.put("/:postId", auth_1.requireAuth, (0, validate_1.validateRequest)({
    params: updatePostSchema.shape.params,
    body: updatePostSchema.shape.body,
}), async (req, res) => {
    try {
        const userId = req.user.id;
        const { postId } = req.params;
        const updateData = req.body;
        // Check if user owns the post
        const post = await prisma_1.prisma.post.findFirst({
            where: {
                id: postId,
                authorId: userId,
            },
        });
        if (!post) {
            return response_1.ResponseHelper.notFound(res, "Post");
        }
        // Prepare update data
        const data = {};
        if (updateData.content !== undefined)
            data.content = updateData.content;
        if (updateData.isPublic !== undefined)
            data.isPublic = updateData.isPublic;
        if (updateData.tags !== undefined)
            data.tags = updateData.tags;
        if (updateData.mediaIds !== undefined) {
            data.mediaAssets = {
                deleteMany: {}, // Clear existing
                create: updateData.mediaIds.map((mediaId) => ({
                    mediaId,
                })),
            };
        }
        const updatedPost = await prisma_1.prisma.post.update({
            where: { id: postId },
            data,
            include: {
                author: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                displayName: true,
                                // avatar: true, // Temporarily commented out
                            },
                        },
                    },
                },
                community: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                mediaAssets: {
                    include: {
                        media: {
                            select: {
                                id: true,
                                url: true,
                                type: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        });
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: "post_updated",
            properties: {
                postId,
                fieldsUpdated: Object.keys(updateData),
            },
        }).catch((err) => {
            logger_1.logger.warn("Failed to track post update analytics:", err);
        });
        logger_1.logger.info("Post updated:", {
            postId,
            userId,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, updatedPost);
    }
    catch (error) {
        logger_1.logger.error("Failed to update post:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to update post");
    }
});
/**
 * Delete post
 * DELETE /api/v1/posts/:postId
 */
router.delete("/:postId", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: postParamsSchema.shape.params }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { postId } = req.params;
        // Check if user owns the post
        const post = await prisma_1.prisma.post.findFirst({
            where: {
                id: postId,
                authorId: userId,
            },
        });
        if (!post) {
            return response_1.ResponseHelper.notFound(res, "Post");
        }
        // Delete the post (cascade will handle likes and comments)
        await prisma_1.prisma.post.delete({
            where: { id: postId },
        });
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: "post_deleted",
            properties: {
                postId,
            },
        }).catch((err) => {
            logger_1.logger.warn("Failed to track post deletion analytics:", err);
        });
        logger_1.logger.info("Post deleted:", {
            postId,
            userId,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, { deleted: true });
    }
    catch (error) {
        logger_1.logger.error("Failed to delete post:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to delete post");
    }
});
/**
 * Like/Unlike post
 * POST /api/v1/posts/:postId/like
 */
router.post("/:postId/like", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: likePostSchema.shape.params }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { postId } = req.params;
        // Check if post exists
        const post = await prisma_1.prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post) {
            return response_1.ResponseHelper.notFound(res, "Post");
        }
        // Check if already liked
        const existingLike = await prisma_1.prisma.postLike.findFirst({
            where: {
                postId,
                userId,
            },
        });
        if (existingLike) {
            // Unlike
            await prisma_1.prisma.postLike.deleteMany({
                where: {
                    postId,
                    userId,
                },
            });
            // Track analytics
            await analytics_service_1.AnalyticsService.trackEvent({
                userId,
                event: "post_unliked",
                properties: { postId },
            }).catch((err) => {
                logger_1.logger.warn("Failed to track unlike analytics:", err);
            });
            return response_1.ResponseHelper.success(res, { liked: false });
        }
        else {
            // Like
            await prisma_1.prisma.postLike.create({
                data: {
                    postId,
                    userId,
                },
            });
            // Track analytics
            await analytics_service_1.AnalyticsService.trackEvent({
                userId,
                event: "post_liked",
                properties: { postId },
            }).catch((err) => {
                logger_1.logger.warn("Failed to track like analytics:", err);
            });
            return response_1.ResponseHelper.success(res, { liked: true });
        }
    }
    catch (error) {
        logger_1.logger.error("Failed to toggle post like:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to toggle like");
    }
});
/**
 * Get post likes
 * GET /api/v1/posts/:postId/likes
 */
router.get("/:postId/likes", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: postParamsSchema.shape.params }), async (req, res) => {
    try {
        const { postId } = req.params;
        const likes = await prisma_1.prisma.postLike.findMany({
            where: { postId },
            include: {
                user: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                displayName: true,
                                // avatar: true, // Temporarily commented out
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return response_1.ResponseHelper.success(res, {
            likes: likes.map((like) => ({
                user: like.user,
                likedAt: like.createdAt,
            })),
            count: likes.length,
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to get post likes:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to get likes");
    }
});
/**
 * Add comment to post
 * POST /api/v1/posts/:postId/comments
 */
router.post("/:postId/comments", auth_1.requireAuth, (0, validate_1.validateRequest)({
    params: commentSchema.shape.params,
    body: commentSchema.shape.body,
}), async (req, res) => {
    try {
        const userId = req.user.id;
        const { postId } = req.params;
        const { content, parentId } = req.body;
        // Check if post exists
        const post = await prisma_1.prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post) {
            return response_1.ResponseHelper.notFound(res, "Post");
        }
        // If replying to a comment, check if parent exists
        if (parentId) {
            const parentComment = await prisma_1.prisma.postComment.findUnique({
                where: { id: parentId },
            });
            if (!parentComment || parentComment.postId !== postId) {
                return response_1.ResponseHelper.notFound(res, "Parent comment");
            }
        }
        const comment = await prisma_1.prisma.postComment.create({
            data: {
                content,
                userId,
                postId,
                parentId: parentId || null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                displayName: true,
                                // avatar: true, // Temporarily commented out
                            },
                        },
                    },
                },
                replies: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                profile: {
                                    select: {
                                        displayName: true,
                                        // avatar: true, // Temporarily commented out
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: "comment_created",
            properties: {
                postId,
                commentId: comment.id,
                isReply: !!parentId,
            },
        }).catch((err) => {
            logger_1.logger.warn("Failed to track comment analytics:", err);
        });
        logger_1.logger.info("Comment created:", {
            commentId: comment.id,
            postId,
            userId,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, comment, 201);
    }
    catch (error) {
        logger_1.logger.error("Failed to create comment:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to create comment");
    }
});
/**
 * Get post comments
 * GET /api/v1/posts/:postId/comments
 */
router.get("/:postId/comments", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: postParamsSchema.shape.params }), async (req, res) => {
    try {
        const { postId } = req.params;
        // Get top-level comments with their replies
        const comments = await prisma_1.prisma.postComment.findMany({
            where: {
                postId,
                parentId: null, // Only top-level comments
            },
            include: {
                user: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                displayName: true,
                                // avatar: true, // Temporarily commented out
                            },
                        },
                    },
                },
                replies: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                profile: {
                                    select: {
                                        displayName: true,
                                        // avatar: true, // Temporarily commented out
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return response_1.ResponseHelper.success(res, { comments });
    }
    catch (error) {
        logger_1.logger.error("Failed to get comments:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to get comments");
    }
});
/**
 * Delete comment
 * DELETE /api/v1/posts/:postId/comments/:commentId
 */
router.delete("/:postId/comments/:commentId", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: commentParamsSchema.shape.params }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { postId, commentId } = req.params;
        // Check if user owns the comment
        const comment = await prisma_1.prisma.postComment.findFirst({
            where: {
                id: commentId,
                postId,
                userId,
            },
        });
        if (!comment) {
            return response_1.ResponseHelper.notFound(res, "Comment");
        }
        // Delete the comment (cascade will handle replies)
        await prisma_1.prisma.postComment.delete({
            where: { id: commentId },
        });
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: "comment_deleted",
            properties: {
                postId,
                commentId,
            },
        }).catch((err) => {
            logger_1.logger.warn("Failed to track comment deletion analytics:", err);
        });
        logger_1.logger.info("Comment deleted:", {
            commentId,
            postId,
            userId,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, { deleted: true });
    }
    catch (error) {
        logger_1.logger.error("Failed to delete comment:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to delete comment");
    }
});
exports.default = router;
//# sourceMappingURL=posts.routes.js.map