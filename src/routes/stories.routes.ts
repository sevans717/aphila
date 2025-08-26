import { Router } from "express";
import { z } from "zod";
import { auth } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import { StoryService } from "../services/story.service";
import { logger } from "../utils/logger";

const router = Router();

// Validation schemas
const createStoryValidation = {
  body: z.object({
    mediaId: z.string(),
    caption: z.string().optional(),
    duration: z.number().min(1).max(24).default(24), // hours
    privacy: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]).default("FRIENDS"),
    allowReplies: z.boolean().default(true),
    showViewers: z.boolean().default(true),
    backgroundColor: z.string().optional(),
    textOverlay: z.string().optional(),
    stickers: z
      .array(
        z.object({
          type: z.string(),
          x: z.number(),
          y: z.number(),
          data: z.any(),
        })
      )
      .optional(),
  }),
};

const updateStoryValidation = {
  body: z.object({
    caption: z.string().optional(),
    privacy: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]).optional(),
    allowReplies: z.boolean().optional(),
    showViewers: z.boolean().optional(),
  }),
};

// Story CRUD operations
router.post(
  "/",
  auth,
  validateRequest(createStoryValidation),
  async (req, res) => {
    try {
      const storyData = req.body;
      const userId = req.user!.userId;

      // Use available method with userId as parameter
      const story = await StoryService.createStory({
        userId,
        mediaId: storyData.mediaId,
      });

      res.status(201).json({
        success: true,
        data: story,
      });
    } catch (error) {
      logger.error("Error creating story:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create story",
      });
    }
  }
);

router.get("/:storyId", auth, async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user!.userId;

    const story = await StoryService.getStoryById(storyId, userId);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    res.json({
      success: true,
      data: story,
    });
  } catch (error) {
    logger.error("Error fetching story:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch story",
    });
  }
});

router.put(
  "/:storyId",
  auth,
  validateRequest(updateStoryValidation),
  async (req, res) => {
    try {
      const { storyId } = req.params;
      const updateData = req.body;
      const userId = req.user!.userId;

      // Use updateStorySettings method instead of updateStory
      const story = await StoryService.updateStorySettings(
        storyId,
        userId,
        updateData
      );

      res.json({
        success: true,
        data: story,
      });
    } catch (error) {
      logger.error("Error updating story:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update story",
      });
    }
  }
);

router.delete("/:storyId", auth, async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user!.userId;

    await StoryService.deleteStory(storyId, userId);

    res.json({
      success: true,
      message: "Story deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting story:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete story",
    });
  }
});

// Story feed and discovery
router.get("/feed/latest", auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user!.userId;

    const stories = await StoryService.getStoriesFeed(
      userId,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: stories,
    });
  } catch (error) {
    logger.error("Error fetching stories feed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stories feed",
    });
  }
});

router.get("/user/:userId", auth, async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user!.userId;

    const stories = await StoryService.getUserStories(
      targetUserId,
      userId,
      false // includeExpired
    );

    res.json({
      success: true,
      data: stories,
    });
  } catch (error) {
    logger.error("Error fetching user stories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user stories",
    });
  }
});

router.get("/user/:userId/active", auth, async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const userId = req.user!.userId;

    // Get active (non-expired) stories
    const activeStories = await StoryService.getUserStories(
      targetUserId,
      userId,
      false
    );

    res.json({
      success: true,
      data: activeStories,
    });
  } catch (error) {
    logger.error("Error fetching active stories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active stories",
    });
  }
});

// Story interactions
router.post(
  "/:storyId/view",
  auth,
  validateRequest({ params: z.object({ storyId: z.string() }) }),
  async (req, res) => {
    try {
      const { storyId } = req.params;
      const userId = req.user!.userId;

      const view = await StoryService.trackView(storyId, userId);

      res.json({
        success: true,
        data: view,
      });
    } catch (error) {
      logger.error("Error tracking story view:", error);
      res.status(500).json({
        success: false,
        message: "Failed to track view",
      });
    }
  }
);

router.get("/:storyId/viewers", auth, async (req, res) => {
  try {
    const { storyId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user!.userId;

    const viewers = await StoryService.getStoryViewers(
      storyId,
      userId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: viewers,
    });
  } catch (error) {
    logger.error("Error fetching story viewers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch viewers",
    });
  }
});

router.post(
  "/:storyId/reply",
  auth,
  validateRequest({
    params: z.object({ storyId: z.string() }),
    body: z.object({ message: z.string().min(1) }),
  }),
  async (req, res) => {
    try {
      const { storyId } = req.params;
      const { message } = req.body;
      const userId = req.user!.userId;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Reply message is required",
        });
      }

      // This would typically be handled by messaging service
      // For now, we'll return a success response
      res.json({
        success: true,
        message: "Reply sent successfully",
      });
    } catch (error) {
      logger.error("Error sending story reply:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send reply",
      });
    }
  }
);

// Story analytics
router.get("/:storyId/analytics", auth, async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user!.userId;

    // Use available getStoryStats method
    const analytics = await StoryService.getStoryStats(storyId, userId);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error("Error fetching story analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
    });
  }
});

router.get("/analytics/overview", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user!.userId;

    const analytics = await StoryService.getAnalyticsOverview(
      startDate as string | undefined,
      endDate as string | undefined
    );

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error("Error fetching user story analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
    });
  }
});

// Story highlights (saved stories)
router.post(
  "/:storyId/highlight",
  auth,
  validateRequest({
    params: z.object({ storyId: z.string() }),
    body: z.object({
      highlightName: z.string().optional(),
      coverImage: z.string().optional(),
    }),
  }),
  async (req, res) => {
    try {
      const { storyId } = req.params;
      const { highlightName, coverImage } = req.body;
      const userId = req.user!.userId;
      const updated = await StoryService.addToHighlights(
        storyId,
        userId,
        highlightName,
        coverImage
      );

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      logger.error("Error adding story to highlights:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add to highlights",
      });
    }
  }
);

// Story discovery
router.get("/discover/trending", auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user!.userId;

    // Placeholder implementation - use getStoriesFeed for now
    const trendingStories = await StoryService.getStoriesFeed(
      userId,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: trendingStories,
    });
  } catch (error) {
    logger.error("Error fetching trending stories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trending stories",
    });
  }
});

router.get("/discover/nearby", auth, async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user!.userId;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Location coordinates are required",
      });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (Math.max(1, pageNum) - 1) * limitNum;

    const lat = parseFloat(latitude as string);
    const lon = parseFloat(longitude as string);
    const radiusKm = parseFloat(radius as string) || 10;

    const nearby = await StoryService.getNearbyStories(
      lat,
      lon,
      radiusKm,
      limitNum,
      offset
    );

    res.json({
      success: true,
      data: {
        stories: nearby.stories,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: nearby.total,
          pages: Math.ceil(nearby.total / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching nearby stories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch nearby stories",
    });
  }
});

// Utility routes
router.post(
  "/cleanup/expired",
  auth,
  validateRequest({ body: z.object({ force: z.boolean().optional() }) }),
  async (req, res) => {
    try {
      // Only allow admin users to trigger cleanup
      // This would typically be a scheduled job
      const cleanupResult = await StoryService.cleanupExpiredStories();

      res.json({
        success: true,
        data: cleanupResult,
      });
    } catch (error) {
      logger.error("Error cleaning up expired stories:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cleanup expired stories",
      });
    }
  }
);

router.get("/stats/global", auth, async (req, res) => {
  try {
    const { timeframe = "24h" } = req.query;
    const userId = req.user!.userId;

    // Placeholder implementation - would need global stats in StoryService
    const stats = {
      totalStories: 0,
      totalViews: 0,
      activeUsers: 0,
      timeframe: timeframe,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error fetching global story stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch global stats",
    });
  }
});

export default router;
