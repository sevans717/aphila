import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";
import { handleServiceError } from "../utils/error";

export interface CreateShareData {
  userId: string;
  postId?: string;
  mediaId?: string;
  platform?: string;
  comment?: string;
}

export interface ShareWithDetails {
  id: string;
  platform?: string;
  comment?: string;
  createdAt: Date;
  post?: {
    id: string;
    content?: string;
    author: {
      id: string;
      profile: {
        displayName: string;
      };
    };
  };
  media?: {
    id: string;
    url: string;
    type: string;
  };
}

export interface ShareData {
  userId: string;
  contentId: string;
  contentType: "post" | "media" | "story" | "profile";
  platform: SharePlatform;
  destination?: ShareDestination;
  message?: string;
  recipients?: string[];
  privacy?: "public" | "friends" | "private";
  scheduledAt?: Date;
}

export interface SharePlatform {
  name:
    | "twitter"
    | "facebook"
    | "instagram"
    | "tiktok"
    | "linkedin"
    | "whatsapp"
    | "telegram"
    | "internal"
    | "sms"
    | "email"
    | "link";
  displayName: string;
  apiKey?: string;
  accessToken?: string;
  settings?: Record<string, any>;
}

export interface ShareDestination {
  type: "feed" | "story" | "message" | "group" | "page";
  id?: string;
  name?: string;
  settings?: Record<string, any>;
}

export interface ShareResult {
  shareId: string;
  platform: string;
  status: "pending" | "sent" | "failed" | "scheduled";
  externalId?: string;
  externalUrl?: string;
  error?: string;
  scheduledAt?: Date;
  sentAt?: Date;
  recipients?: ShareRecipient[];
  analytics?: ShareAnalytics;
}

export interface ShareRecipient {
  id?: string;
  type: "user" | "group" | "public";
  name?: string;
  status: "pending" | "sent" | "delivered" | "read" | "failed";
  sentAt?: Date;
  readAt?: Date;
  error?: string;
}

export interface ShareTemplate {
  id: string;
  name: string;
  platform: string;
  template: string;
  variables: string[];
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface ShareAnalytics {
  shareId: string;
  platform: string;
  impressions: number;
  clicks: number;
  likes: number;
  comments: number;
  reposts: number;
  clickThroughRate: number;
  engagementRate: number;
  reach: number;
  demographics?: {
    ageGroups: Record<string, number>;
    genders: Record<string, number>;
    locations: Record<string, number>;
  };
}

export interface ShareHistory {
  id: string;
  userId: string;
  contentId: string;
  contentType: string;
  platform: string;
  status: string;
  message?: string;
  recipientCount: number;
  createdAt: Date;
  analytics?: ShareAnalytics;
}

export interface SharePermissions {
  canShare: boolean;
  platforms: string[];
  maxRecipients?: number;
  requiresApproval?: boolean;
  allowScheduling?: boolean;
  allowCustomMessage?: boolean;
}

export interface ShareQuota {
  userId: string;
  platform: string;
  dailyLimit: number;
  dailyUsed: number;
  monthlyLimit: number;
  monthlyUsed: number;
  resetDate: Date;
}

export interface ShareLink {
  id: string;
  shareId: string;
  url: string;
  shortUrl?: string;
  clickCount: number;
  maxClicks?: number;
  expiresAt?: Date;
  password?: string;
  isActive: boolean;
  analytics: {
    clicks: number;
    uniqueVisitors: number;
    referrers: Record<string, number>;
    locations: Record<string, number>;
    devices: Record<string, number>;
  };
}

export interface BulkShareData {
  userId: string;
  contentIds: string[];
  contentType: string;
  platforms: string[];
  message?: string;
  scheduledAt?: Date;
}

export interface ShareCampaign {
  id: string;
  name: string;
  description?: string;
  userId: string;
  contentIds: string[];
  platforms: string[];
  message?: string;
  startDate: Date;
  endDate?: Date;
  status: "draft" | "active" | "paused" | "completed";
  analytics: {
    totalShares: number;
    totalReach: number;
    totalEngagement: number;
    platformBreakdown: Record<string, ShareAnalytics>;
  };
}

export interface ShareWebhook {
  id: string;
  userId: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  lastTriggered?: Date;
  failureCount: number;
}

export class SharingService {
  static async sharePost(data: CreateShareData): Promise<ShareWithDetails> {
    try {
      const { userId, postId, platform, comment } = data;

      if (!postId) {
        const err = new Error("Post ID is required for post sharing");
        logger.warn("sharePost called without postId", { userId });
        return handleServiceError(err);
      }

      const share = await prisma.postShare.create({
        data: {
          userId,
          postId,
          platform,
          comment,
        },
        include: {
          post: {
            include: {
              author: {
                include: {
                  profile: {
                    select: {
                      displayName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      logger.info("Post shared", {
        shareId: share.id,
        postId,
        userId,
        platform,
      });

      return {
        id: share.id,
        platform: share.platform || undefined,
        comment: share.comment || undefined,
        createdAt: share.createdAt,
        post: {
          id: share.post.id,
          content: share.post.content || undefined,
          author: {
            id: share.post.author.id,
            profile: {
              displayName: share.post.author.profile!.displayName,
            },
          },
        },
      };
    } catch (error) {
      logger.error("Error sharing post", { error, data });
      return handleServiceError(error);
    }
  }

  static async shareMedia(data: CreateShareData): Promise<ShareWithDetails> {
    try {
      const { userId, mediaId, platform, comment } = data;

      if (!mediaId) {
        const err = new Error("Media ID is required for media sharing");
        logger.warn("shareMedia called without mediaId", { userId });
        return handleServiceError(err);
      }

      const share = await prisma.mediaShare.create({
        data: {
          userId,
          mediaId,
          platform,
          comment,
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

      logger.info("Media shared", {
        shareId: share.id,
        mediaId,
        userId,
        platform,
      });

      return {
        id: share.id,
        platform: share.platform || undefined,
        comment: share.comment || undefined,
        createdAt: share.createdAt,
        media: share.media,
      };
    } catch (error) {
      logger.error("Error sharing media", { error, data });
      return handleServiceError(error);
    }
  }

  static async getUserShares(
    userId: string,
    limit: number = 20
  ): Promise<ShareWithDetails[]> {
    try {
      const [postShares, mediaShares] = await Promise.all([
        prisma.postShare.findMany({
          where: { userId },
          include: {
            post: {
              include: {
                author: {
                  include: {
                    profile: {
                      select: {
                        displayName: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: Math.ceil(limit / 2),
        }),
        prisma.mediaShare.findMany({
          where: { userId },
          include: {
            media: {
              select: {
                id: true,
                url: true,
                type: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: Math.ceil(limit / 2),
        }),
      ]);

      const allShares: ShareWithDetails[] = [
        ...postShares.map((share) => ({
          id: share.id,
          platform: share.platform || undefined,
          comment: share.comment || undefined,
          createdAt: share.createdAt,
          post: {
            id: share.post.id,
            content: share.post.content || undefined,
            author: {
              id: share.post.author.id,
              profile: {
                displayName: share.post.author.profile!.displayName,
              },
            },
          },
        })),
        ...mediaShares.map((share) => ({
          id: share.id,
          platform: share.platform || undefined,
          comment: share.comment || undefined,
          createdAt: share.createdAt,
          media: share.media,
        })),
      ];

      return allShares
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    } catch (error) {
      logger.error("Error getting user shares", { error, userId });
      return handleServiceError(error);
    }
  }

  static async deleteShare(
    shareId: string,
    userId: string,
    type: "post" | "media"
  ): Promise<void> {
    try {
      if (type === "post") {
        const share = await prisma.postShare.findUnique({
          where: { id: shareId },
          select: { userId: true },
        });

        if (!share) {
          const err = new Error("Share not found");
          logger.warn("deleteShare called for missing post share", {
            shareId,
            userId,
          });
          return handleServiceError(err);
        }

        if (share.userId !== userId) {
          const err = new Error("Unauthorized to delete this share");
          logger.warn("deleteShare unauthorized for post", { shareId, userId });
          return handleServiceError(err);
        }

        await prisma.postShare.delete({
          where: { id: shareId },
        });
      } else {
        const share = await prisma.mediaShare.findUnique({
          where: { id: shareId },
          select: { userId: true },
        });

        if (!share) {
          const err = new Error("Share not found");
          logger.warn("deleteShare called for missing media share", {
            shareId,
            userId,
          });
          return handleServiceError(err);
        }

        if (share.userId !== userId) {
          const err = new Error("Unauthorized to delete this share");
          logger.warn("deleteShare unauthorized for media", {
            shareId,
            userId,
          });
          return handleServiceError(err);
        }

        await prisma.mediaShare.delete({
          where: { id: shareId },
        });
      }

      logger.info("Share deleted", { shareId, userId, type });
    } catch (error) {
      logger.error("Error deleting share", { error, shareId, userId, type });
      return handleServiceError(error);
    }
  }

  static async shareContent(data: CreateShareData): Promise<ShareWithDetails> {
    try {
      if (data.postId) {
        return this.sharePost(data);
      } else if (data.mediaId) {
        return this.shareMedia(data);
      } else {
        const err = new Error("Either postId or mediaId must be provided");
        logger.warn("shareContent called without postId or mediaId", { data });
        return handleServiceError(err);
      }
    } catch (error) {
      logger.error("Error sharing content", { error, data });
      return handleServiceError(error);
    }
  }

  static async getContentShares(
    contentId: string,
    type: "post" | "media",
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    shares: ShareWithDetails[];
    total: number;
  }> {
    try {
      if (type === "post") {
        const [shares, total] = await Promise.all([
          prisma.postShare.findMany({
            where: { postId: contentId },
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
              post: {
                include: {
                  author: {
                    include: {
                      profile: {
                        select: {
                          displayName: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
            skip: offset,
            take: limit,
          }),
          prisma.postShare.count({
            where: { postId: contentId },
          }),
        ]);

        return {
          shares: shares.map((share) => ({
            id: share.id,
            platform: share.platform || undefined,
            comment: share.comment || undefined,
            createdAt: share.createdAt,
            post: {
              id: share.post.id,
              content: share.post.content || undefined,
              author: {
                id: share.post.author.id,
                profile: {
                  displayName: share.post.author.profile!.displayName,
                },
              },
            },
          })),
          total,
        };
      } else {
        const [shares, total] = await Promise.all([
          prisma.mediaShare.findMany({
            where: { mediaId: contentId },
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
            },
            orderBy: { createdAt: "desc" },
            skip: offset,
            take: limit,
          }),
          prisma.mediaShare.count({
            where: { mediaId: contentId },
          }),
        ]);

        return {
          shares: shares.map((share) => ({
            id: share.id,
            platform: share.platform || undefined,
            comment: share.comment || undefined,
            createdAt: share.createdAt,
            media: share.media,
          })),
          total,
        };
      }
    } catch (error) {
      logger.error("Error getting content shares", { error, contentId, type });
      return handleServiceError(error);
    }
  }
}
