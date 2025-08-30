import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const recordEventSchema = z.object({
  eventType: z.string().min(1).max(100),
  eventData: z.any().optional(),
  metadata: z.any().optional(),
  timestamp: z.string().datetime().optional(),
  sessionId: z.string().optional(),
});

const getEventsQuerySchema = z.object({
  eventType: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val))
    .refine((val) => val > 0 && val <= 1000)
    .optional()
    .default(100),
  offset: z
    .string()
    .transform((val) => parseInt(val))
    .refine((val) => val >= 0)
    .optional()
    .default(0),
});

// Get analytics events
router.get("/events", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const validatedQuery = getEventsQuerySchema.parse(req.query);

    const whereClause: any = {
      userId,
    };

    if (validatedQuery.eventType) {
      whereClause.eventType = validatedQuery.eventType;
    }

    if (validatedQuery.startDate || validatedQuery.endDate) {
      whereClause.timestamp = {};
      if (validatedQuery.startDate) {
        whereClause.timestamp.gte = new Date(validatedQuery.startDate);
      }
      if (validatedQuery.endDate) {
        whereClause.timestamp.lte = new Date(validatedQuery.endDate);
      }
    }

    const events = await prisma.analyticsEvent.findMany({
      where: whereClause,
      orderBy: {
        timestamp: "desc",
      },
      take: validatedQuery.limit,
      skip: validatedQuery.offset,
    });

    const totalCount = await prisma.analyticsEvent.count({
      where: whereClause,
    });

    res.json({
      success: true,
      data: {
        userId,
        events,
        pagination: {
          total: totalCount,
          limit: validatedQuery.limit,
          offset: validatedQuery.offset,
          hasMore: validatedQuery.offset + validatedQuery.limit < totalCount,
        },
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: error.issues,
      });
    }

    console.error("Get analytics events error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve analytics events",
    });
  }
});

// Record analytics event
router.post("/events", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const validatedData = recordEventSchema.parse(req.body);

    const event = await prisma.analyticsEvent.create({
      data: {
        userId,
        eventType: validatedData.eventType,
        eventData: validatedData.eventData || {},
        metadata: validatedData.metadata || {},
        timestamp: validatedData.timestamp
          ? new Date(validatedData.timestamp)
          : new Date(),
        sessionId: validatedData.sessionId,
      },
    });

    res.json({
      success: true,
      data: {
        event,
        recordedAt: event.timestamp,
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: "Invalid event data",
        details: error.issues,
      });
    }

    console.error("Record analytics event error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to record analytics event",
    });
  }
});

// Get user metrics
router.get("/metrics", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Get user profile and basic info
    const [user, userCounts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          createdAt: true,
          lastLogin: true,
          profile: {
            select: {
              displayName: true,
            },
          },
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          _count: {
            select: {
              posts: true,
              sentLikes: true,
              receivedLikes: true,
              sentMessages: true,
              receivedMessages: true,
              friendshipsInitiated: true,
              friendshipsReceived: true,
              postLikes: true,
              postComments: true,
              postBookmarks: true,
              postShares: true,
              mediaShares: true,
              stories: true,
              storyViews: true,
              contentViews: true,
              searchQueries: true,
            },
          },
        },
      }),
    ]);

    if (!user || !userCounts) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const counts = userCounts._count;

    // Calculate engagement metrics
    const totalInteractions =
      counts.sentLikes +
      counts.receivedLikes +
      counts.sentMessages +
      counts.receivedMessages +
      counts.postLikes +
      counts.postComments +
      counts.postShares +
      counts.mediaShares +
      counts.storyViews +
      counts.contentViews;

    // Calculate engagement rate (interactions per day since account creation)
    const daysSinceCreation = Math.max(
      1,
      Math.floor(
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    const engagementRate = totalInteractions / daysSinceCreation;

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentActivity = await prisma.analyticsEvent.findMany({
      where: {
        userId,
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        eventType: true,
        timestamp: true,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 50,
    });

    // Get content view analytics
    const contentViews = await prisma.contentView.groupBy({
      by: ["postId", "storyId"],
      where: {
        userId,
        viewedAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        duration: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    });

    // Get search analytics
    const searchAnalytics = await prisma.searchQuery.aggregate({
      where: {
        userId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        id: true,
      },
      _avg: {
        results: true,
      },
    });

    res.json({
      success: true,
      data: {
        userId,
        profile: {
          displayName: user.profile?.displayName,
          accountAge: daysSinceCreation,
          lastLogin: user.lastLogin,
        },
        metrics: {
          totalPosts: counts.posts,
          totalInteractions,
          engagementRate: Math.round(engagementRate * 100) / 100,
          lastActive: user.lastLogin || user.createdAt,

          // Detailed counts
          likes: {
            sent: counts.sentLikes,
            received: counts.receivedLikes,
          },
          messages: {
            sent: counts.sentMessages,
            received: counts.receivedMessages,
          },
          friendships: {
            initiated: counts.friendshipsInitiated,
            received: counts.friendshipsReceived,
          },
          content: {
            posts: counts.posts,
            stories: counts.stories,
            postLikes: counts.postLikes,
            postComments: counts.postComments,
            postBookmarks: counts.postBookmarks,
            postShares: counts.postShares,
            mediaShares: counts.mediaShares,
            storyViews: counts.storyViews,
            contentViews: counts.contentViews,
          },
          analytics: {
            searchQueries: counts.searchQueries,
            events: 0, // Will be calculated separately
          },
        },
        recentActivity: {
          events: recentActivity,
          contentViews,
          searchStats: {
            totalSearches: searchAnalytics._count.id,
            averageResults:
              Math.round((searchAnalytics._avg.results || 0) * 100) / 100,
          },
        },
      },
    });
  } catch (error: any) {
    console.error("Get user metrics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve user metrics",
    });
  }
});

// Get aggregated analytics (admin endpoint)
router.get("/aggregated", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Admin access required",
      });
    }

    // Get aggregated metrics for the platform
    const [
      totalUsers,
      totalPosts,
      totalStories,
      totalCommunities,
      eventStats,
      recentEvents,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.story.count(),
      prisma.community.count(),
      prisma.analyticsEvent.groupBy({
        by: ["eventType"],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: 10,
      }),
      prisma.analyticsEvent.findMany({
        take: 20,
        orderBy: {
          timestamp: "desc",
        },
        include: {
          user: {
            select: {
              profile: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        platform: {
          totalUsers,
          totalPosts,
          totalStories,
          totalCommunities,
        },
        events: {
          stats: eventStats,
          recent: recentEvents,
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Get aggregated analytics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve aggregated analytics",
    });
  }
});

export default router;
