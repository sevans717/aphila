import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";
import { ResponseHelper } from "../utils/response";
import { AnalyticsService } from "../services/analytics.service";

const router = Router();

// Validation schemas
const createBookmarkSchema = z.object({
  body: z
    .object({
      postId: z.string().optional(),
      mediaId: z.string().optional(),
      collectionId: z.string().optional(),
      tags: z.array(z.string()).optional().default([]),
    })
    .refine((data) => data.postId || data.mediaId, {
      message: "Either postId or mediaId must be provided",
    }),
});

const updateBookmarkSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    collectionId: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

const bookmarkParamsSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

const bookmarksQuerySchema = z.object({
  query: z.object({
    collectionId: z.string().optional(),
    type: z.enum(["post", "media"]).optional(),
    limit: z
      .string()
      .transform(Number)
      .optional()
      .default(() => 20),
    offset: z
      .string()
      .transform(Number)
      .optional()
      .default(() => 0),
  }),
});

const createCollectionSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50),
    description: z.string().max(200).optional(),
    isPublic: z.boolean().optional().default(false),
  }),
});

const updateCollectionSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    description: z.string().max(200).optional(),
    isPublic: z.boolean().optional(),
  }),
});

const collectionParamsSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

/**
 * Get user's bookmarks
 * GET /api/v1/bookmarks
 */
router.get(
  "/",
  requireAuth,
  validateRequest({ query: bookmarksQuerySchema.shape.query }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { collectionId, type, limit, offset } = req.validatedQuery;

      const where: any = { userId };
      if (collectionId) where.collectionId = collectionId;

      // Get post bookmarks
      let postBookmarks: any[] = [];
      if (!type || type === "post") {
        postBookmarks = await prisma.postBookmark.findMany({
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
      let mediaBookmarks: any[] = [];
      if (!type || type === "media") {
        mediaBookmarks = await prisma.mediaBookmark.findMany({
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
        ...postBookmarks.map((b: any) => ({ ...b, type: "post" })),
        ...mediaBookmarks.map((b: any) => ({ ...b, type: "media" })),
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Apply final pagination
      const paginatedBookmarks = allBookmarks.slice(offset, offset + limit);

      return ResponseHelper.success(res, {
        bookmarks: paginatedBookmarks,
        pagination: {
          total: allBookmarks.length,
          limit,
          offset,
          hasMore: offset + limit < allBookmarks.length,
        },
      });
    } catch (error: any) {
      logger.error("Failed to get bookmarks:", error);
      return ResponseHelper.serverError(res, "Failed to get bookmarks");
    }
  }
);

/**
 * Add bookmark
 * POST /api/v1/bookmarks
 */
router.post(
  "/",
  requireAuth,
  validateRequest({ body: createBookmarkSchema.shape.body }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { postId, mediaId, collectionId, tags } = req.body;

      let bookmark;

      if (postId) {
        // Check if post exists
        const post = await prisma.post.findUnique({
          where: { id: postId },
        });

        if (!post) {
          return ResponseHelper.notFound(res, "Post");
        }

        // Check if already bookmarked
        const existingBookmark = await prisma.postBookmark.findUnique({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
        });

        if (existingBookmark) {
          return ResponseHelper.error(
            res,
            "CONFLICT",
            "Post already bookmarked",
            409
          );
        }

        bookmark = await prisma.postBookmark.create({
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
      } else if (mediaId) {
        // Check if media exists
        const media = await prisma.mediaAsset.findUnique({
          where: { id: mediaId },
        });

        if (!media) {
          return ResponseHelper.notFound(res, "Media");
        }

        // Check if already bookmarked
        const existingBookmark = await prisma.mediaBookmark.findUnique({
          where: {
            userId_mediaId: {
              userId,
              mediaId,
            },
          },
        });

        if (existingBookmark) {
          return ResponseHelper.error(
            res,
            "CONFLICT",
            "Media already bookmarked",
            409
          );
        }

        bookmark = await prisma.mediaBookmark.create({
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
      await AnalyticsService.trackEvent({
        userId,
        event: "bookmark_created",
        properties: {
          bookmarkId: bookmark.id,
          type: postId ? "post" : "media",
          itemId: postId || mediaId,
          collectionId,
        },
      }).catch((err) => {
        logger.warn("Failed to track bookmark creation analytics:", err);
      });

      logger.info("Bookmark created:", {
        bookmarkId: bookmark.id,
        userId,
        type: postId ? "post" : "media",
        requestId: res.locals.requestId,
      });

      return ResponseHelper.success(res, bookmark, 201);
    } catch (error: any) {
      logger.error("Failed to create bookmark:", error);
      return ResponseHelper.serverError(res, "Failed to create bookmark");
    }
  }
);

/**
 * Update bookmark
 * PUT /api/v1/bookmarks/:id
 */
router.put(
  "/:id",
  requireAuth,
  validateRequest({
    params: updateBookmarkSchema.shape.params,
    body: updateBookmarkSchema.shape.body,
  }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { collectionId } = req.body;

      // Check if bookmark exists and belongs to user
      const bookmark = await prisma.postBookmark.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!bookmark) {
        return ResponseHelper.notFound(res, "Bookmark");
      }

      const updatedBookmark = await prisma.postBookmark.update({
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

      logger.info("Bookmark updated:", {
        bookmarkId: id,
        userId,
        requestId: res.locals.requestId,
      });

      return ResponseHelper.success(res, updatedBookmark);
    } catch (error: any) {
      logger.error("Failed to update bookmark:", error);
      return ResponseHelper.serverError(res, "Failed to update bookmark");
    }
  }
);

/**
 * Remove bookmark
 * DELETE /api/v1/bookmarks/:id
 */
router.delete(
  "/:id",
  requireAuth,
  validateRequest({ params: bookmarkParamsSchema.shape.params }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      // Check if bookmark exists and belongs to user
      const bookmark = await prisma.postBookmark.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!bookmark) {
        return ResponseHelper.notFound(res, "Bookmark");
      }

      // Delete the bookmark
      await prisma.postBookmark.delete({
        where: { id },
      });

      // Track analytics
      await AnalyticsService.trackEvent({
        userId,
        event: "bookmark_deleted",
        properties: {
          bookmarkId: id,
          postId: bookmark.postId,
        },
      }).catch((err) => {
        logger.warn("Failed to track bookmark deletion analytics:", err);
      });

      logger.info("Bookmark deleted:", {
        bookmarkId: id,
        userId,
        requestId: res.locals.requestId,
      });

      return ResponseHelper.success(res, { deleted: true });
    } catch (error: any) {
      logger.error("Failed to delete bookmark:", error);
      return ResponseHelper.serverError(res, "Failed to delete bookmark");
    }
  }
);

/**
 * Check if post is bookmarked
 * GET /api/v1/bookmarks/check/:postId
 */
router.get(
  "/check/:postId",
  requireAuth,
  validateRequest({
    params: z.object({
      postId: z.string(),
    }),
  }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { postId } = req.params;

      const bookmark = await prisma.postBookmark.findUnique({
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

      return ResponseHelper.success(res, {
        isBookmarked: !!bookmark,
        bookmark: bookmark || null,
      });
    } catch (error: any) {
      logger.error("Failed to check bookmark:", error);
      return ResponseHelper.serverError(res, "Failed to check bookmark");
    }
  }
);

/**
 * Get user's collections
 * GET /api/v1/bookmarks/collections
 */
router.get("/collections", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    const collections = await prisma.collection.findMany({
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

    return ResponseHelper.success(res, { collections });
  } catch (error: any) {
    logger.error("Failed to get collections:", error);
    return ResponseHelper.serverError(res, "Failed to get collections");
  }
});

/**
 * Create collection
 * POST /api/v1/bookmarks/collections
 */
router.post(
  "/collections",
  requireAuth,
  validateRequest({ body: createCollectionSchema.shape.body }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { name, description, isPublic } = req.body;

      // Check if collection with this name already exists for user
      const existingCollection = await prisma.collection.findFirst({
        where: {
          userId,
          name: { equals: name, mode: "insensitive" },
        },
      });

      if (existingCollection) {
        return ResponseHelper.error(
          res,
          "CONFLICT",
          "Collection with this name already exists",
          409
        );
      }

      const collection = await prisma.collection.create({
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

      logger.info("Collection created:", {
        collectionId: collection.id,
        userId,
        requestId: res.locals.requestId,
      });

      return ResponseHelper.success(res, collection, 201);
    } catch (error: any) {
      logger.error("Failed to create collection:", error);
      return ResponseHelper.serverError(res, "Failed to create collection");
    }
  }
);

/**
 * Update collection
 * PUT /api/v1/bookmarks/collections/:id
 */
router.put(
  "/collections/:id",
  requireAuth,
  validateRequest({
    params: updateCollectionSchema.shape.params,
    body: updateCollectionSchema.shape.body,
  }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const updateData = req.body;

      // Check if collection exists and belongs to user
      const collection = await prisma.collection.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!collection) {
        return ResponseHelper.notFound(res, "Collection");
      }

      // If updating name, check for conflicts
      if (updateData.name) {
        const conflictingCollection = await prisma.collection.findFirst({
          where: {
            userId,
            name: { equals: updateData.name, mode: "insensitive" },
            id: { not: id },
          },
        });

        if (conflictingCollection) {
          return ResponseHelper.error(
            res,
            "CONFLICT",
            "Collection with this name already exists",
            409
          );
        }
      }

      const updatedCollection = await prisma.collection.update({
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

      logger.info("Collection updated:", {
        collectionId: id,
        userId,
        requestId: res.locals.requestId,
      });

      return ResponseHelper.success(res, updatedCollection);
    } catch (error: any) {
      logger.error("Failed to update collection:", error);
      return ResponseHelper.serverError(res, "Failed to update collection");
    }
  }
);

/**
 * Delete collection
 * DELETE /api/v1/bookmarks/collections/:id
 */
router.delete(
  "/collections/:id",
  requireAuth,
  validateRequest({ params: collectionParamsSchema.shape.params }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      // Check if collection exists and belongs to user
      const collection = await prisma.collection.findFirst({
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
        return ResponseHelper.notFound(res, "Collection");
      }

      // Delete the collection (bookmarks will be cascade deleted or set to null)
      await prisma.collection.delete({
        where: { id },
      });

      logger.info("Collection deleted:", {
        collectionId: id,
        userId,
        bookmarksCount: collection._count.bookmarks,
        requestId: res.locals.requestId,
      });

      return ResponseHelper.success(res, { deleted: true });
    } catch (error: any) {
      logger.error("Failed to delete collection:", error);
      return ResponseHelper.serverError(res, "Failed to delete collection");
    }
  }
);

export default router;
