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
const createBookmarkSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        postId: zod_1.z.string().optional(),
        mediaId: zod_1.z.string().optional(),
        collectionId: zod_1.z.string().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional().default([]),
    })
        .refine((data) => data.postId || data.mediaId, {
        message: "Either postId or mediaId must be provided",
    }),
});
const updateBookmarkSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
    body: zod_1.z.object({
        collectionId: zod_1.z.string().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
const bookmarkParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
});
const bookmarksQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        collectionId: zod_1.z.string().optional(),
        type: zod_1.z.enum(["post", "media"]).optional(),
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
    }),
});
const createCollectionSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(50),
        description: zod_1.z.string().max(200).optional(),
        isPublic: zod_1.z.boolean().optional().default(false),
    }),
});
const updateCollectionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(50).optional(),
        description: zod_1.z.string().max(200).optional(),
        isPublic: zod_1.z.boolean().optional(),
    }),
});
const collectionParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
});
/**
 * Get user's bookmarks
 * GET /api/v1/bookmarks
 */
router.get("/", auth_1.requireAuth, (0, validate_1.validateRequest)({ query: bookmarksQuerySchema.shape.query }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { collectionId, type, limit, offset } = req.validatedQuery;
        const where = { userId };
        if (collectionId)
            where.collectionId = collectionId;
        // Get post bookmarks
        let postBookmarks = [];
        if (!type || type === "post") {
            postBookmarks = await prisma_1.prisma.postBookmark.findMany({
                where,
                include: {
                    post: {
                        include: {
                            author: {
                                select: {
                                    id: true,
                                    profile: {
                                        select: {
                                            displayName: true,
                                            avatar: true,
                                        },
                                    },
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
                    },
                    collection: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: type === "post" ? limit : Math.ceil(limit / 2),
                skip: type === "post" ? offset : Math.floor(offset / 2),
            });
        }
        // Get media bookmarks
        let mediaBookmarks = [];
        if (!type || type === "media") {
            mediaBookmarks = await prisma_1.prisma.mediaBookmark.findMany({
                where: { userId },
                include: {
                    media: {
                        select: {
                            id: true,
                            url: true,
                            type: true,
                            width: true,
                            height: true,
                            duration: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: type === "media" ? limit : Math.floor(limit / 2),
                skip: type === "media" ? offset : Math.floor(offset / 2),
            });
        }
        // Combine and sort by creation date
        const allBookmarks = [
            ...postBookmarks.map((b) => ({ ...b, type: "post" })),
            ...mediaBookmarks.map((b) => ({ ...b, type: "media" })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        // Apply final pagination
        const paginatedBookmarks = allBookmarks.slice(offset, offset + limit);
        return response_1.ResponseHelper.success(res, {
            bookmarks: paginatedBookmarks,
            pagination: {
                total: allBookmarks.length,
                limit,
                offset,
                hasMore: offset + limit < allBookmarks.length,
            },
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to get bookmarks:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to get bookmarks");
    }
});
/**
 * Add bookmark
 * POST /api/v1/bookmarks
 */
router.post("/", auth_1.requireAuth, (0, validate_1.validateRequest)({ body: createBookmarkSchema.shape.body }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { postId, mediaId, collectionId, tags } = req.body;
        let bookmark;
        if (postId) {
            // Check if post exists
            const post = await prisma_1.prisma.post.findUnique({
                where: { id: postId },
            });
            if (!post) {
                return response_1.ResponseHelper.notFound(res, "Post");
            }
            // Check if already bookmarked
            const existingBookmark = await prisma_1.prisma.postBookmark.findUnique({
                where: {
                    userId_postId: {
                        userId,
                        postId,
                    },
                },
            });
            if (existingBookmark) {
                return response_1.ResponseHelper.error(res, "CONFLICT", "Post already bookmarked", 409);
            }
            bookmark = await prisma_1.prisma.postBookmark.create({
                data: {
                    userId,
                    postId,
                    collectionId: collectionId || null,
                },
                include: {
                    post: {
                        select: {
                            id: true,
                            content: true,
                            createdAt: true,
                        },
                    },
                    collection: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
        }
        else if (mediaId) {
            // Check if media exists
            const media = await prisma_1.prisma.mediaAsset.findUnique({
                where: { id: mediaId },
            });
            if (!media) {
                return response_1.ResponseHelper.notFound(res, "Media");
            }
            // Check if already bookmarked
            const existingBookmark = await prisma_1.prisma.mediaBookmark.findUnique({
                where: {
                    userId_mediaId: {
                        userId,
                        mediaId,
                    },
                },
            });
            if (existingBookmark) {
                return response_1.ResponseHelper.error(res, "CONFLICT", "Media already bookmarked", 409);
            }
            bookmark = await prisma_1.prisma.mediaBookmark.create({
                data: {
                    userId,
                    mediaId,
                    tags,
                },
                include: {
                    media: {
                        select: {
                            id: true,
                            url: true,
                            type: true,
                        },
                    },
                },
            });
        }
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: "bookmark_created",
            properties: {
                bookmarkId: bookmark.id,
                type: postId ? "post" : "media",
                itemId: postId || mediaId,
                collectionId,
            },
        }).catch((err) => {
            logger_1.logger.warn("Failed to track bookmark creation analytics:", err);
        });
        logger_1.logger.info("Bookmark created:", {
            bookmarkId: bookmark.id,
            userId,
            type: postId ? "post" : "media",
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, bookmark, 201);
    }
    catch (error) {
        logger_1.logger.error("Failed to create bookmark:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to create bookmark");
    }
});
/**
 * Update bookmark
 * PUT /api/v1/bookmarks/:id
 */
router.put("/:id", auth_1.requireAuth, (0, validate_1.validateRequest)({
    params: updateBookmarkSchema.shape.params,
    body: updateBookmarkSchema.shape.body,
}), async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { collectionId } = req.body;
        // Check if bookmark exists and belongs to user
        const bookmark = await prisma_1.prisma.postBookmark.findFirst({
            where: {
                id,
                userId,
            },
        });
        if (!bookmark) {
            return response_1.ResponseHelper.notFound(res, "Bookmark");
        }
        const updatedBookmark = await prisma_1.prisma.postBookmark.update({
            where: { id },
            data: {
                collectionId: collectionId || null,
            },
            include: {
                post: {
                    select: {
                        id: true,
                        content: true,
                    },
                },
                collection: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        logger_1.logger.info("Bookmark updated:", {
            bookmarkId: id,
            userId,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, updatedBookmark);
    }
    catch (error) {
        logger_1.logger.error("Failed to update bookmark:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to update bookmark");
    }
});
/**
 * Remove bookmark
 * DELETE /api/v1/bookmarks/:id
 */
router.delete("/:id", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: bookmarkParamsSchema.shape.params }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        // Check if bookmark exists and belongs to user
        const bookmark = await prisma_1.prisma.postBookmark.findFirst({
            where: {
                id,
                userId,
            },
        });
        if (!bookmark) {
            return response_1.ResponseHelper.notFound(res, "Bookmark");
        }
        // Delete the bookmark
        await prisma_1.prisma.postBookmark.delete({
            where: { id },
        });
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: "bookmark_deleted",
            properties: {
                bookmarkId: id,
                postId: bookmark.postId,
            },
        }).catch((err) => {
            logger_1.logger.warn("Failed to track bookmark deletion analytics:", err);
        });
        logger_1.logger.info("Bookmark deleted:", {
            bookmarkId: id,
            userId,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, { deleted: true });
    }
    catch (error) {
        logger_1.logger.error("Failed to delete bookmark:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to delete bookmark");
    }
});
/**
 * Check if post is bookmarked
 * GET /api/v1/bookmarks/check/:postId
 */
router.get("/check/:postId", auth_1.requireAuth, (0, validate_1.validateRequest)({
    params: zod_1.z.object({
        postId: zod_1.z.string(),
    }),
}), async (req, res) => {
    try {
        const userId = req.user.id;
        const { postId } = req.params;
        const bookmark = await prisma_1.prisma.postBookmark.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
            select: {
                id: true,
                collectionId: true,
                createdAt: true,
            },
        });
        return response_1.ResponseHelper.success(res, {
            isBookmarked: !!bookmark,
            bookmark: bookmark || null,
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to check bookmark:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to check bookmark");
    }
});
/**
 * Get user's collections
 * GET /api/v1/bookmarks/collections
 */
router.get("/collections", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const collections = await prisma_1.prisma.collection.findMany({
            where: { userId },
            include: {
                _count: {
                    select: {
                        bookmarks: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return response_1.ResponseHelper.success(res, { collections });
    }
    catch (error) {
        logger_1.logger.error("Failed to get collections:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to get collections");
    }
});
/**
 * Create collection
 * POST /api/v1/bookmarks/collections
 */
router.post("/collections", auth_1.requireAuth, (0, validate_1.validateRequest)({ body: createCollectionSchema.shape.body }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description, isPublic } = req.body;
        // Check if collection with this name already exists for user
        const existingCollection = await prisma_1.prisma.collection.findFirst({
            where: {
                userId,
                name: { equals: name, mode: "insensitive" },
            },
        });
        if (existingCollection) {
            return response_1.ResponseHelper.error(res, "CONFLICT", "Collection with this name already exists", 409);
        }
        const collection = await prisma_1.prisma.collection.create({
            data: {
                userId,
                name,
                description,
                isPublic,
            },
            include: {
                _count: {
                    select: {
                        bookmarks: true,
                    },
                },
            },
        });
        logger_1.logger.info("Collection created:", {
            collectionId: collection.id,
            userId,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, collection, 201);
    }
    catch (error) {
        logger_1.logger.error("Failed to create collection:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to create collection");
    }
});
/**
 * Update collection
 * PUT /api/v1/bookmarks/collections/:id
 */
router.put("/collections/:id", auth_1.requireAuth, (0, validate_1.validateRequest)({
    params: updateCollectionSchema.shape.params,
    body: updateCollectionSchema.shape.body,
}), async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updateData = req.body;
        // Check if collection exists and belongs to user
        const collection = await prisma_1.prisma.collection.findFirst({
            where: {
                id,
                userId,
            },
        });
        if (!collection) {
            return response_1.ResponseHelper.notFound(res, "Collection");
        }
        // If updating name, check for conflicts
        if (updateData.name) {
            const conflictingCollection = await prisma_1.prisma.collection.findFirst({
                where: {
                    userId,
                    name: { equals: updateData.name, mode: "insensitive" },
                    id: { not: id },
                },
            });
            if (conflictingCollection) {
                return response_1.ResponseHelper.error(res, "CONFLICT", "Collection with this name already exists", 409);
            }
        }
        const updatedCollection = await prisma_1.prisma.collection.update({
            where: { id },
            data: updateData,
            include: {
                _count: {
                    select: {
                        bookmarks: true,
                    },
                },
            },
        });
        logger_1.logger.info("Collection updated:", {
            collectionId: id,
            userId,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, updatedCollection);
    }
    catch (error) {
        logger_1.logger.error("Failed to update collection:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to update collection");
    }
});
/**
 * Delete collection
 * DELETE /api/v1/bookmarks/collections/:id
 */
router.delete("/collections/:id", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: collectionParamsSchema.shape.params }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        // Check if collection exists and belongs to user
        const collection = await prisma_1.prisma.collection.findFirst({
            where: {
                id,
                userId,
            },
            include: {
                _count: {
                    select: {
                        bookmarks: true,
                    },
                },
            },
        });
        if (!collection) {
            return response_1.ResponseHelper.notFound(res, "Collection");
        }
        // Delete the collection (bookmarks will be cascade deleted or set to null)
        await prisma_1.prisma.collection.delete({
            where: { id },
        });
        logger_1.logger.info("Collection deleted:", {
            collectionId: id,
            userId,
            bookmarksCount: collection._count.bookmarks,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, { deleted: true });
    }
    catch (error) {
        logger_1.logger.error("Failed to delete collection:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to delete collection");
    }
});
exports.default = router;
//# sourceMappingURL=bookmarks.routes.js.map