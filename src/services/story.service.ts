import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";

export interface CreateStoryData {
  userId: string;
  mediaId: string;
}

export interface StoryWithDetails {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  user: {
    id: string;
    profile: {
      displayName: string;
    };
  };
  media: {
    id: string;
    url: string;
    type: string;
  };
  viewsCount: number;
}

export interface StoryData {
  userId: string;
  mediaId: string;
  caption?: string;
  duration?: number;
  privacy?: "public" | "friends" | "close_friends" | "private";
  allowReplies?: boolean;
  allowSharing?: boolean;
  showViewers?: boolean;
  backgroundColor?: string;
  musicId?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  expiresAt?: Date;
}

export interface UpdateStoryData {
  caption?: string;
  privacy?: "public" | "friends" | "close_friends" | "private";
  allowReplies?: boolean;
  allowSharing?: boolean;
  showViewers?: boolean;
  backgroundColor?: string;
  musicId?: string;
}

export interface StoryViewer {
  id: string;
  user: {
    id: string;
    profile: {
      displayName: string;
      avatar?: string;
    };
    photos: Array<{
      url: string;
      isPrimary: boolean;
    }>;
  };
  viewedAt: Date;
  reactionType?: string;
  isCloseFriend?: boolean;
}

export interface StoryReaction {
  id: string;
  userId: string;
  storyId: string;
  reactionType: "like" | "love" | "laugh" | "wow" | "fire" | "clap";
  timestamp: Date;
}

export interface StoryReply {
  id: string;
  storyId: string;
  userId: string;
  content: string;
  mediaUrl?: string;
  replyType: "text" | "media" | "reaction";
  timestamp: Date;
  isRead: boolean;
}

export interface StoryAnalytics {
  storyId: string;
  totalViews: number;
  uniqueViews: number;
  viewsTimeline: Array<{
    timestamp: Date;
    count: number;
  }>;
  demographics: {
    ageGroups: Record<string, number>;
    genders: Record<string, number>;
    locations: Record<string, number>;
  };
  engagementMetrics: {
    replies: number;
    reactions: number;
    shares: number;
    screenshots: number;
    forwards: number;
  };
  dropOffPoints: Array<{
    timestamp: number;
    percentage: number;
  }>;
  averageViewDuration: number;
  completionRate: number;
}

export interface StoryHighlight {
  id: string;
  userId: string;
  name: string;
  coverImageUrl?: string;
  storiesCount: number;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  stories: Array<{
    id: string;
    mediaUrl: string;
    thumbnailUrl?: string;
    duration: number;
    order: number;
  }>;
}

export interface StorySettings {
  userId: string;
  defaultPrivacy: "public" | "friends" | "close_friends";
  allowReplies: boolean;
  allowSharing: boolean;
  showViewers: boolean;
  autoArchive: boolean;
  notifyOnView: boolean;
  hiddenFromUsers: string[];
  closeFriends: string[];
  blockedUsers: string[];
}

export interface StoryTemplate {
  id: string;
  name: string;
  preview: string;
  elements: Array<{
    type: "text" | "sticker" | "filter" | "background";
    data: Record<string, any>;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
      rotation?: number;
    };
  }>;
  category: string;
  isPremium: boolean;
  usageCount: number;
}

export interface StoryDraft {
  id: string;
  userId: string;
  mediaId: string;
  caption?: string;
  elements: Array<{
    type: string;
    data: Record<string, any>;
    position: Record<string, number>;
  }>;
  settings: {
    privacy: string;
    allowReplies: boolean;
    allowSharing: boolean;
    duration: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  stories: StoryWithDetails[];
  isPublic: boolean;
  createdAt: Date;
  viewsCount: number;
}

export interface StoryMusic {
  id: string;
  title: string;
  artist: string;
  duration: number;
  previewUrl: string;
  spotifyId?: string;
  genre: string;
  isPopular: boolean;
  usageCount: number;
}

export interface StoryFilter {
  id: string;
  name: string;
  previewUrl: string;
  category: "beauty" | "funny" | "artistic" | "seasonal";
  isPremium: boolean;
  usageCount: number;
  rating: number;
}

export interface StorySticker {
  id: string;
  name: string;
  imageUrl: string;
  category: "emoji" | "location" | "mention" | "poll" | "question" | "music";
  data?: Record<string, any>;
  isAnimated: boolean;
  isPremium: boolean;
}

export interface StoryPoll {
  id: string;
  storyId: string;
  question: string;
  options: Array<{
    text: string;
    votes: number;
    percentage: number;
  }>;
  totalVotes: number;
  expiresAt: Date;
  allowAnonymous: boolean;
}

export interface StoryQuestion {
  id: string;
  storyId: string;
  question: string;
  responses: Array<{
    id: string;
    userId: string;
    answer: string;
    isPublic: boolean;
    timestamp: Date;
  }>;
  totalResponses: number;
  allowAnonymous: boolean;
}

export class StoryService {
  static async createStory(data: CreateStoryData): Promise<StoryWithDetails> {
    try {
      const { userId, mediaId } = data;

      // Stories expire after 24 hours
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const story = await prisma.story.create({
        data: {
          userId,
          mediaId,
          expiresAt,
        },
        include: {
          user: {
            include: {
              profile: {
                select: {
                  displayName: true,
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

      logger.info("Story created", { storyId: story.id, userId, mediaId });

      return {
        id: story.id,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        user: {
          id: story.user.id,
          profile: {
            displayName: story.user.profile!.displayName,
          },
        },
        media: story.media,
        viewsCount: story._count.views,
      };
    } catch (error) {
      logger.error("Error creating story", { error, data });
      throw error;
    }
  }

  static async getActiveStories(userId?: string): Promise<StoryWithDetails[]> {
    try {
      const now = new Date();

      const stories = await prisma.story.findMany({
        where: {
          expiresAt: {
            gt: now,
          },
          ...(userId && { userId }),
        },
        include: {
          user: {
            include: {
              profile: {
                select: {
                  displayName: true,
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
        orderBy: { createdAt: "desc" },
      });

      return stories.map((story) => ({
        id: story.id,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        user: {
          id: story.user.id,
          profile: {
            displayName: story.user.profile!.displayName,
          },
        },
        media: story.media,
        viewsCount: story._count.views,
      }));
    } catch (error) {
      logger.error("Error getting active stories", { error, userId });
      throw error;
    }
  }

  static async viewStory(storyId: string, viewerId: string): Promise<void> {
    try {
      // Check if story exists and is active
      const story = await prisma.story.findUnique({
        where: { id: storyId },
        select: { expiresAt: true, userId: true },
      });

      if (!story) {
        throw new Error("Story not found");
      }

      if (story.expiresAt < new Date()) {
        throw new Error("Story has expired");
      }

      // Don't record views from the story author
      if (story.userId === viewerId) {
        return;
      }

      // Check if user already viewed this story
      const existingView = await prisma.storyView.findUnique({
        where: {
          storyId_viewerId: {
            storyId: storyId,
            viewerId: viewerId,
          },
        },
      });

      if (!existingView) {
        await prisma.storyView.create({
          data: {
            storyId: storyId,
            viewerId: viewerId,
          },
        });

        logger.info("Story viewed", { storyId, viewerId });
      }
    } catch (error) {
      logger.error("Error viewing story", { error, storyId, viewerId });
      throw error;
    }
  }

  static async deleteStory(storyId: string, userId: string): Promise<void> {
    try {
      const story = await prisma.story.findUnique({
        where: { id: storyId },
        select: { userId: true },
      });

      if (!story) {
        throw new Error("Story not found");
      }

      if (story.userId !== userId) {
        throw new Error("Unauthorized to delete this story");
      }

      await prisma.story.delete({
        where: { id: storyId },
      });

      logger.info("Story deleted", { storyId, userId });
    } catch (error) {
      logger.error("Error deleting story", { error, storyId, userId });
      throw error;
    }
  }

  static async getStoryById(
    storyId: string,
    viewerId: string
  ): Promise<StoryWithDetails | null> {
    try {
      const story = await prisma.story.findUnique({
        where: { id: storyId },
        include: {
          user: {
            include: {
              profile: {
                select: {
                  displayName: true,
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

      if (!story) {
        return null;
      }

      // Check if story is still active
      if (story.expiresAt < new Date()) {
        return null;
      }

      return {
        id: story.id,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        user: {
          id: story.user.id,
          profile: {
            displayName: story.user.profile!.displayName,
          },
        },
        media: story.media,
        viewsCount: story._count.views,
      };
    } catch (error) {
      logger.error("Error getting story by id", { error, storyId, viewerId });
      throw error;
    }
  }

  static async updateStorySettings(
    storyId: string,
    userId: string,
    data: any
  ): Promise<StoryWithDetails> {
    try {
      const story = await prisma.story.findUnique({
        where: { id: storyId },
        select: { userId: true },
      });

      if (!story) {
        throw new Error("Story not found");
      }

      if (story.userId !== userId) {
        throw new Error("Unauthorized to update this story");
      }

      const updatedStory = await prisma.story.update({
        where: { id: storyId },
        data: data,
        include: {
          user: {
            include: {
              profile: {
                select: {
                  displayName: true,
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

      return {
        id: updatedStory.id,
        createdAt: updatedStory.createdAt,
        expiresAt: updatedStory.expiresAt,
        user: {
          id: updatedStory.user.id,
          profile: {
            displayName: updatedStory.user.profile!.displayName,
          },
        },
        media: updatedStory.media,
        viewsCount: updatedStory._count.views,
      };
    } catch (error) {
      logger.error("Error updating story settings", { error, storyId, userId });
      throw error;
    }
  }

  static async getStoriesFeed(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    stories: StoryWithDetails[];
    total: number;
  }> {
    try {
      const now = new Date();

      const [stories, total] = await Promise.all([
        prisma.story.findMany({
          where: {
            expiresAt: {
              gt: now,
            },
          },
          include: {
            user: {
              include: {
                profile: {
                  select: {
                    displayName: true,
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
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
        }),
        prisma.story.count({
          where: {
            expiresAt: {
              gt: now,
            },
          },
        }),
      ]);

      return {
        stories: stories.map((story) => ({
          id: story.id,
          createdAt: story.createdAt,
          expiresAt: story.expiresAt,
          user: {
            id: story.user.id,
            profile: {
              displayName: story.user.profile!.displayName,
            },
          },
          media: story.media,
          viewsCount: story._count?.views ?? 0,
        })),
        total,
      };
    } catch (error) {
      logger.error("Error getting stories feed", { error, userId });
      throw error;
    }
  }

  static async getUserStories(
    targetUserId: string,
    viewerId?: string,
    includeExpired: boolean = false
  ): Promise<{
    stories: StoryWithDetails[];
    total: number;
  }> {
    try {
      const where: any = {
        userId: targetUserId,
      };

      if (!includeExpired) {
        where.expiresAt = {
          gt: new Date(),
        };
      }

      const [stories, total] = await Promise.all([
        prisma.story.findMany({
          where,
          include: {
            user: {
              include: {
                profile: {
                  select: {
                    displayName: true,
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
          orderBy: { createdAt: "desc" },
        }),
        prisma.story.count({
          where,
        }),
      ]);

      return {
        stories: stories.map((story) => ({
          id: story.id,
          createdAt: story.createdAt,
          expiresAt: story.expiresAt,
          user: {
            id: story.user.id,
            profile: {
              displayName: story.user.profile!.displayName,
            },
          },
          media: story.media,
          viewsCount: story._count?.views ?? 0,
        })),
        total,
      };
    } catch (error) {
      logger.error("Error getting user stories", {
        error,
        targetUserId,
        viewerId,
      });
      throw error;
    }
  }

  static async trackView(storyId: string, viewerId: string): Promise<void> {
    try {
      await this.viewStory(storyId, viewerId);
    } catch (error) {
      logger.error("Error tracking story view", { error, storyId, viewerId });
      throw error;
    }
  }

  static async getStoryViewers(
    storyId: string,
    ownerId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    viewers: Array<{
      id: string;
      user: {
        id: string;
        profile: {
          displayName: string;
        };
        photos: {
          url: string;
          isPrimary: boolean;
        }[];
      };
      viewedAt: Date;
    }>;
    total: number;
  }> {
    try {
      // Verify story ownership
      const story = await prisma.story.findUnique({
        where: { id: storyId },
        select: { userId: true },
      });

      if (!story) {
        throw new Error("Story not found");
      }

      if (story.userId !== ownerId) {
        throw new Error("Unauthorized to view story viewers");
      }

      const [viewers, total] = await Promise.all([
        prisma.storyView.findMany({
          where: { storyId },
          include: {
            viewer: {
              include: {
                profile: {
                  select: {
                    displayName: true,
                  },
                },
                photos: {
                  where: { isPrimary: true },
                  select: {
                    url: true,
                    isPrimary: true,
                  },
                },
              },
            },
          },
          orderBy: { viewedAt: "desc" },
          skip: offset,
          take: limit,
        }),
        prisma.storyView.count({
          where: { storyId },
        }),
      ]);

      return {
        viewers: viewers.map((view) => ({
          id: view.id,
          user: {
            id: view.viewer.id,
            profile: {
              displayName: view.viewer.profile!.displayName,
            },
            photos: view.viewer.photos,
          },
          viewedAt: view.viewedAt,
        })),
        total,
      };
    } catch (error) {
      logger.error("Error getting story viewers", { error, storyId, ownerId });
      throw error;
    }
  }

  static async getStoryStats(
    storyId: string,
    userId: string
  ): Promise<{
    viewsCount: number;
    reachCount: number;
    engagementRate: number;
    topViewers: Array<{
      user: {
        id: string;
        profile: {
          displayName: string;
        };
      };
      viewedAt: Date;
    }>;
  }> {
    try {
      // Verify story ownership
      const story = await prisma.story.findUnique({
        where: { id: storyId },
        select: { userId: true },
      });

      if (!story) {
        throw new Error("Story not found");
      }

      if (story.userId !== userId) {
        throw new Error("Unauthorized to view story stats");
      }

      const [viewsCount, topViewers] = await Promise.all([
        prisma.storyView.count({
          where: { storyId },
        }),
        prisma.storyView.findMany({
          where: { storyId },
          include: {
            viewer: {
              include: {
                profile: {
                  select: {
                    displayName: true,
                  },
                },
              },
            },
          },
          orderBy: { viewedAt: "asc" },
          take: 10,
        }),
      ]);

      return {
        viewsCount,
        reachCount: viewsCount, // For now, reach = views
        engagementRate: 0, // Would need to calculate based on interactions
        topViewers: topViewers.map((view) => ({
          user: {
            id: view.viewer.id,
            profile: {
              displayName: view.viewer.profile!.displayName,
            },
          },
          viewedAt: view.viewedAt,
        })),
      };
    } catch (error) {
      logger.error("Error getting story stats", { error, storyId, userId });
      throw error;
    }
  }

  // New: Get aggregated analytics overview for a timeframe
  static async getAnalyticsOverview(
    startDate?: Date | string,
    endDate?: Date | string
  ) {
    try {
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [totalStories, totalViews, avgViewDurationRes, topStories] =
        await Promise.all([
          prisma.story.count({
            where: { createdAt: { gte: start, lte: end } },
          }),
          prisma.storyView.count({
            where: { viewedAt: { gte: start, lte: end } },
          }),
          prisma.contentView.aggregate({
            _avg: { duration: true },
            where: {
              storyId: { not: null },
              viewedAt: { gte: start, lte: end },
            },
          }),
          prisma.story.findMany({
            where: { createdAt: { gte: start, lte: end } },
            include: {
              user: {
                include: {
                  profile: {
                    select: {
                      displayName: true,
                      latitude: true,
                      longitude: true,
                    },
                  },
                },
              },
              media: { select: { id: true, url: true, type: true } },
              _count: { select: { views: true } },
            },
          }),
        ]);

      const avgViewDuration = avgViewDurationRes._avg.duration ?? 0;

      // Sort topStories by views count (safely using _count) in JS and take top 10
      const topSorted = (topStories as any[])
        .map((s) => ({
          id: s.id,
          media: s.media,
          user: { id: s.user.id, displayName: s.user.profile?.displayName },
          views: s._count?.views ?? 0,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      return {
        timeframe: { start: start.toISOString(), end: end.toISOString() },
        totalStories,
        totalViews,
        totalReplies: 0,
        avgViewDuration,
        topStories: topSorted,
      };
    } catch (error) {
      logger.error("Error computing analytics overview", {
        error,
        startDate,
        endDate,
      });
      throw error;
    }
  }

  // New: Mark a story as highlight (DB-backed flag)
  static async addToHighlights(
    storyId: string,
    userId: string,
    highlightName?: string,
    coverImage?: string
  ) {
    try {
      const story = await prisma.story.findUnique({ where: { id: storyId } });
      if (!story) throw new Error("Story not found");
      if (story.userId !== userId)
        throw new Error("Unauthorized to highlight this story");

      const updated = await prisma.story.update({
        where: { id: storyId },
        data: { isHighlight: true },
      });

      await prisma.notification
        .create({
          data: {
            userId,
            type: "story_highlight",
            title: "Story added to highlights",
            body: highlightName
              ? `Added to highlight: ${highlightName}`
              : "Added to highlights",
            data: { storyId, highlightName, coverImage },
          },
        })
        .catch((err) =>
          logger.warn("Failed to create highlight notification", err)
        );

      return updated;
    } catch (error) {
      logger.error("Error adding story to highlights", {
        error,
        storyId,
        userId,
      });
      throw error;
    }
  }

  // New: Discover nearby stories based on latitude/longitude and radius (km)
  static async getNearbyStories(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    limit: number = 20,
    offset: number = 0
  ) {
    try {
      const latDelta = radiusKm / 111;
      const lonDelta =
        radiusKm / (111 * Math.cos((latitude * Math.PI) / 180) || 1);

      const minLat = latitude - latDelta;
      const maxLat = latitude + latDelta;
      const minLon = longitude - lonDelta;
      const maxLon = longitude + lonDelta;

      const now = new Date();

      const stories = await prisma.story.findMany({
        where: {
          expiresAt: { gt: now },
          user: {
            profile: {
              latitude: { gte: minLat, lte: maxLat },
              longitude: { gte: minLon, lte: maxLon },
            },
          },
        },
        include: {
          user: {
            include: {
              profile: {
                select: { displayName: true, latitude: true, longitude: true },
              },
            },
          },
          media: { select: { id: true, url: true, type: true } },
          _count: { select: { views: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      });

      const haversine = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
      ) => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      const filtered = stories
        .map((s) => {
          const lat = s.user.profile?.latitude ?? 0;
          const lon = s.user.profile?.longitude ?? 0;
          const distance = haversine(latitude, longitude, lat, lon);
          return { story: s, distance };
        })
        .filter((x) => x.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);

      return {
        stories: filtered.map((f) => ({
          id: f.story.id,
          createdAt: f.story.createdAt,
          expiresAt: f.story.expiresAt,
          distanceKm: Number(f.distance.toFixed(2)),
          user: {
            id: f.story.userId,
            displayName: f.story.user.profile?.displayName,
          },
          media: f.story.media,
          views: f.story._count.views,
        })),
        total: filtered.length,
      };
    } catch (error) {
      logger.error("Error fetching nearby stories", {
        error,
        latitude,
        longitude,
        radiusKm,
      });
      throw error;
    }
  }

  static async cleanupExpiredStories(): Promise<{ deletedCount: number }> {
    try {
      const now = new Date();

      const result = await prisma.story.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });

      logger.info("Expired stories cleaned up", { deletedCount: result.count });

      return { deletedCount: result.count };
    } catch (error) {
      logger.error("Error cleaning up expired stories", { error });
      throw error;
    }
  }
}
