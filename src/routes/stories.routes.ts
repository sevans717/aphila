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
const createStorySchema = z.object({
  body: z.object({
    caption: z.string().min(1).max(500).optional(),
    mediaIds: z.array(z.string()).min(1),
    expiresIn: z
      .number()
      .min(1)
      .max(24 * 60 * 60)
      .optional()
      .default(24 * 60 * 60), // 24 hours default
  }),
});

const storyParamsSchema = z.object({
  params: z.object({
    storyId: z.string(),
  }),
});

const storiesQuerySchema = z.object({
  query: z.object({
    userId: z.string().optional(),
    limit: z
      .string()
      .transform((val) => parseInt(val, 10))
      .optional()
      .default(() => 20),
    offset: z
      .string()
      .transform((val) => parseInt(val, 10))
      .optional()
      .default(() => 0),
  }),
});

const viewStorySchema = z.object({
  params: z.object({
    storyId: z.string(),
  }),
});

/**
 * Get user's stories and friends' stories
 * GET /api/v1/stories
 */
router.get(
  "/",
  requireAuth,
  validateRequest({ query: storiesQuerySchema.shape.query }),
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const {
        userId: targetUserId,
        limit,
        offset,
      } = (req as any).validatedQuery;

      const whereClause: any = {
        expiresAt: {
          gt: new Date(),
        },
      };

      if (targetUserId) {
        // Get specific user's stories
        whereClause.userId = targetUserId;
      } else {
        // Get user's own stories and friends' stories
        // For now, get user's stories and public stories from followed users
        // TODO: Implement proper friend/follow system
        whereClause.OR = [
          { userId: userId },
          {
            userId: { not: userId },
            // Stories are always public in this implementation
          },
        ];
      }

      const stories = await prisma.story.findMany({
        where: whereClause,
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
          media: {
            select: {
              id: true,
              url: true,
              type: true,
            },
          },
          views: {
            where: { viewerId: userId },
            select: { id: true, viewedAt: true },
          },
          _count: {
            select: {
              views: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });

      // Transform stories to include isViewed flag
      const transformedStories = stories.map((story) => ({
        ...story,
        isViewed: story.views.length > 0,
        views: undefined, // Remove the views array
      }));

      const total = await prisma.story.count({ where: whereClause });

      return ResponseHelper.success(res, {
        stories: transformedStories,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    } catch (error: any) {
      logger.error("Failed to get stories:", error);
      return ResponseHelper.serverError(res, "Failed to get stories");
    }
  }
);

/**
 * Create a new story
 * POST /api/v1/stories
 */
router.post(
  "/",
  requireAuth,
  validateRequest({ body: createStorySchema.shape.body }),
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { caption, mediaIds, expiresIn } = req.body;

      // Calculate expiration date
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      // Create the story
      const story = await prisma.story.create({
        data: {
          caption,
          user: {
            connect: { id: userId },
          },
          expiresAt,
          media: {
            connect: mediaIds.map((id: string) => ({ id })),
          },
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
          media: {
            select: {
              id: true,
              url: true,
              type: true,
            },
          },
          _count: {
            select: {
              views: true,
            },
          },
        },
      });

      // Track analytics
      await AnalyticsService.trackEvent({
        userId,
        event: "story_created",
        properties: {
          storyId: story.id,
          mediaCount: mediaIds.length,
          expiresIn,
          hasCaption: !!caption,
        },
      }).catch((err) => {
        logger.warn("Failed to track story creation analytics:", err);
      });

      logger.info("Story created:", {
        storyId: story.id,
        userId,
        expiresAt,
        requestId: res.locals.requestId,
      });

      return ResponseHelper.success(res, story, 201);
    } catch (error: any) {
      logger.error("Failed to create story:", error);
      return ResponseHelper.serverError(res, "Failed to create story");
    }
  }
);

/**
 * Get story by ID
 * GET /api/v1/stories/:storyId
 */
router.get(
  "/:storyId",
  requireAuth,
  validateRequest({ params: storyParamsSchema.shape.params }),
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { storyId } = req.params;

      const story = await prisma.story.findFirst({
        where: {
          id: storyId,
          expiresAt: {
            gt: new Date(),
          },
          userId: userId, // Stories are private to their owners
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
          media: {
            select: {
              id: true,
              url: true,
              type: true,
            },
          },
          views: {
            where: { viewerId: userId },
            select: { id: true, viewedAt: true },
          },
          _count: {
            select: {
              views: true,
            },
          },
        },
      });

      if (!story) {
        return ResponseHelper.notFound(res, "Story");
      }

      // Transform story to include isViewed flag
      const transformedStory = {
        ...story,
        isViewed: story.views.length > 0,
        views: undefined,
      };

      return ResponseHelper.success(res, transformedStory);
    } catch (error: any) {
      logger.error("Failed to get story:", error);
      return ResponseHelper.serverError(res, "Failed to get story");
    }
  }
);

/**
 * Delete story
 * DELETE /api/v1/stories/:storyId
 */
router.delete(
  "/:storyId",
  requireAuth,
  validateRequest({ params: storyParamsSchema.shape.params }),
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { storyId } = req.params;

      // Check if user owns the story
      const story = await prisma.story.findFirst({
        where: {
          id: storyId,
          userId,
        },
      });

      if (!story) {
        return ResponseHelper.notFound(res, "Story");
      }

      // Delete the story (cascade will handle views)
      await prisma.story.delete({
        where: { id: storyId },
      });

      // Track analytics
      await AnalyticsService.trackEvent({
        userId,
        event: "story_deleted",
        properties: {
          storyId,
        },
      }).catch((err) => {
        logger.warn("Failed to track story deletion analytics:", err);
      });

      logger.info("Story deleted:", {
        storyId,
        userId,
        requestId: res.locals.requestId,
      });

      return ResponseHelper.success(res, { deleted: true });
    } catch (error: any) {
      logger.error("Failed to delete story:", error);
      return ResponseHelper.serverError(res, "Failed to delete story");
    }
  }
);

/**
 * View story (mark as viewed)
 * POST /api/v1/stories/:storyId/view
 */
router.post(
  "/:storyId/view",
  requireAuth,
  validateRequest({ params: viewStorySchema.shape.params }),
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { storyId } = req.params;

      // Check if story exists and is accessible
      const story = await prisma.story.findFirst({
        where: {
          id: storyId,
          expiresAt: {
            gt: new Date(),
          },
          userId: userId, // Only owner can view their own stories
        },
      });

      if (!story) {
        return ResponseHelper.notFound(res, "Story");
      }

      // Prevent self-viewing
      if (story.userId === userId) {
        return ResponseHelper.error(
          res,
          "BAD_REQUEST",
          "Cannot view your own story",
          400
        );
      }

      // Check if already viewed
      const existingView = await prisma.storyView.findUnique({
        where: {
          storyId_viewerId: {
            storyId,
            viewerId: userId,
          },
        },
      });

      if (existingView) {
        return ResponseHelper.success(res, {
          viewed: true,
          viewedAt: existingView.viewedAt,
        });
      }

      // Create view record
      const view = await prisma.storyView.create({
        data: {
          storyId,
          viewerId: userId,
        },
      });

      // Track analytics
      await AnalyticsService.trackEvent({
        userId,
        event: "story_viewed",
        properties: {
          storyId,
          authorId: story.userId,
        },
      }).catch((err) => {
        logger.warn("Failed to track story view analytics:", err);
      });

      logger.info("Story viewed:", {
        storyId,
        viewerId: userId,
        requestId: res.locals.requestId,
      });

      return ResponseHelper.success(res, {
        viewed: true,
        viewedAt: view.viewedAt,
      });
    } catch (error: any) {
      logger.error("Failed to view story:", error);
      return ResponseHelper.serverError(res, "Failed to view story");
    }
  }
);

/**
 * Get story viewers
 * GET /api/v1/stories/:storyId/viewers
 */
router.get(
  "/:storyId/viewers",
  requireAuth,
  validateRequest({ params: storyParamsSchema.shape.params }),
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { storyId } = req.params;

      // Check if user owns the story
      const story = await prisma.story.findFirst({
        where: {
          id: storyId,
          userId,
        },
      });

      if (!story) {
        return ResponseHelper.notFound(res, "Story");
      }

      const viewers = await prisma.storyView.findMany({
        where: { storyId },
        include: {
          viewer: {
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
        orderBy: { viewedAt: "desc" },
      });

      const transformedViewers = viewers.map((view) => ({
        user: view.viewer,
        viewedAt: view.viewedAt,
      }));

      return ResponseHelper.success(res, {
        viewers: transformedViewers,
        count: viewers.length,
      });
    } catch (error: any) {
      logger.error("Failed to get story viewers:", error);
      return ResponseHelper.serverError(res, "Failed to get viewers");
    }
  }
);

/**
 * Get user's story highlights (stories that haven't expired yet)
 * GET /api/v1/stories/highlights
 */
router.get("/highlights", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    // Get user's active stories
    const stories = await prisma.story.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        media: {
          select: {
            id: true,
            url: true,
            type: true,
          },
        },
        _count: {
          select: {
            views: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return ResponseHelper.success(res, {
      highlights: stories,
      total: stories.length,
    });
  } catch (error: any) {
    logger.error("Failed to get story highlights:", error);
    return ResponseHelper.serverError(res, "Failed to get highlights");
  }
});

export default router;
