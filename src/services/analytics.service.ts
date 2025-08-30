import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";
import { handleServiceError } from "../utils/error";

export interface AnalyticsEvent {
  userId: string;
  event: string;
  properties?: Record<string, any>;
  platform?: string;
  appVersion?: string;
  deviceInfo?: Record<string, any>;
  timestamp?: Date;
}

export interface UserMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  newUsers: number;
  retainedUsers: number;
}

export interface EngagementMetrics {
  totalMatches: number;
  totalMessages: number;
  averageSessionDuration: number;
  messagesPerUser: number;
  matchesPerUser: number;
}

export interface DeviceInfo {
  deviceId: string;
  deviceType: "mobile" | "tablet" | "desktop";
  operatingSystem: string;
  osVersion: string;
  appVersion: string;
  screenSize?: string;
  userAgent?: string;
}

export interface SessionData {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  platform: string;
  deviceInfo: DeviceInfo;
  actions: string[];
  screens: string[];
}

export interface SwipeAnalytics {
  userId: string;
  targetUserId: string;
  action: "like" | "pass" | "super_like";
  timestamp: Date;
  platform: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface MatchAnalytics {
  matchId: string;
  user1Id: string;
  user2Id: string;
  matchedAt: Date;
  firstMessageSentAt?: Date;
  conversationStarted: boolean;
  platform: string;
}

export interface MessageAnalytics {
  messageId: string;
  senderId: string;
  receiverId: string;
  messageType: "text" | "image" | "gif" | "sticker" | "voice";
  timestamp: Date;
  responseTime?: number;
  isFirstMessage: boolean;
  platform: string;
}

export interface SubscriptionAnalytics {
  userId: string;
  action: "subscribe" | "cancel" | "renew" | "expire";
  subscriptionType: string;
  timestamp: Date;
  platform: string;
  revenue?: number;
  trialPeriod?: boolean;
}

export interface FeatureUsageAnalytics {
  userId: string;
  feature: string;
  action: string;
  timestamp: Date;
  platform: string;
  metadata?: Record<string, any>;
  duration?: number;
  success: boolean;
}

export interface ConversionFunnelData {
  signups: number;
  profileCompleted: number;
  firstSwipe: number;
  firstMatch: number;
  firstMessage: number;
  subscriptions: number;
  conversionRates: {
    signupToProfile: number;
    profileToSwipe: number;
    swipeToMatch: number;
    matchToMessage: number;
    messageToSubscription: number;
  };
}

export interface PlatformDistribution {
  ios: number;
  android: number;
  web: number;
  total: number;
  percentages: {
    ios: number;
    android: number;
    web: number;
  };
}

export interface RetentionMetrics {
  day1: number;
  day7: number;
  day30: number;
  day90: number;
  cohortSizes: Record<string, number>;
}

export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
  churnRate: number;
  subscriptionsByTier: Record<string, number>;
}

export class AnalyticsService {
  /**
   * Track user event
   */
  static async trackEvent(event: AnalyticsEvent): Promise<void> {
    if (!env.enableAnalytics) {
      return;
    }

    try {
      // Store in search query table for analytics (using it as a flexible event store)
      await prisma.searchQuery.create({
        data: {
          userId: event.userId,
          query: JSON.stringify({
            event: event.event,
            properties: event.properties,
            platform: event.platform,
            appVersion: event.appVersion,
            deviceInfo: event.deviceInfo,
          }),
          results: 0,
          createdAt: event.timestamp || new Date(),
        },
      });

      logger.info(
        `Analytics event tracked: ${event.event} for user ${event.userId}`
      );
    } catch (error) {
      logger.error("Failed to track analytics event:", error);
    }
  }

  /**
   * Track user session start
   */
  static async trackSessionStart(
    userId: string,
    platform: string,
    appVersion?: string
  ): Promise<void> {
    await this.trackEvent({
      userId,
      event: "session_start",
      platform,
      appVersion,
      properties: {
        timestamp: new Date().toISOString(),
      },
    });

    // Update user's last login
    await prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });
  }

  /**
   * Track user session end
   */
  static async trackSessionEnd(
    userId: string,
    platform: string,
    sessionDuration: number,
    appVersion?: string
  ): Promise<void> {
    await this.trackEvent({
      userId,
      event: "session_end",
      platform,
      appVersion,
      properties: {
        duration: sessionDuration,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track swipe action
   */
  static async trackSwipe(
    userId: string,
    targetUserId: string,
    action: "like" | "pass" | "super_like",
    platform: string
  ): Promise<void> {
    await this.trackEvent({
      userId,
      event: "swipe",
      platform,
      properties: {
        action,
        targetUserId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track match creation
   */
  static async trackMatch(
    userId1: string,
    userId2: string,
    platform: string
  ): Promise<void> {
    // Track for both users
    await Promise.all([
      this.trackEvent({
        userId: userId1,
        event: "match_created",
        platform,
        properties: {
          matchedUserId: userId2,
          timestamp: new Date().toISOString(),
        },
      }),
      this.trackEvent({
        userId: userId2,
        event: "match_created",
        platform,
        properties: {
          matchedUserId: userId1,
          timestamp: new Date().toISOString(),
        },
      }),
    ]);
  }

  /**
   * Track message sent
   */
  static async trackMessage(
    senderId: string,
    receiverId: string,
    messageType: string,
    platform: string
  ): Promise<void> {
    await this.trackEvent({
      userId: senderId,
      event: "message_sent",
      platform,
      properties: {
        receiverId,
        messageType,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track profile completion
   */
  static async trackProfileCompletion(
    userId: string,
    completionPercentage: number,
    platform: string
  ): Promise<void> {
    await this.trackEvent({
      userId,
      event: "profile_completion",
      platform,
      properties: {
        completionPercentage,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track subscription events
   */
  static async trackSubscription(
    userId: string,
    action: "subscribe" | "cancel" | "renew" | "expire",
    subscriptionType: string,
    platform: string
  ): Promise<void> {
    await this.trackEvent({
      userId,
      event: "subscription",
      platform,
      properties: {
        action,
        subscriptionType,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track detailed session data
   */
  static async trackSessionData(sessionData: SessionData): Promise<void> {
    if (!env.enableAnalytics) {
      return;
    }

    try {
      await this.trackEvent({
        userId: sessionData.userId,
        event: "session_data",
        platform: sessionData.platform,
        properties: {
          sessionId: sessionData.sessionId,
          startTime: sessionData.startTime.toISOString(),
          endTime: sessionData.endTime?.toISOString(),
          duration: sessionData.duration,
          deviceInfo: sessionData.deviceInfo,
          actions: sessionData.actions,
          screens: sessionData.screens,
        },
      });

      logger.info(
        `Session data tracked for user ${sessionData.userId}, duration: ${sessionData.duration}ms`
      );
    } catch (error) {
      logger.error("Failed to track session data:", error);
    }
  }

  /**
   * Track detailed swipe analytics
   */
  static async trackSwipeAnalytics(swipeData: SwipeAnalytics): Promise<void> {
    if (!env.enableAnalytics) {
      return;
    }

    try {
      await this.trackEvent({
        userId: swipeData.userId,
        event: "swipe_analytics",
        platform: swipeData.platform,
        properties: {
          targetUserId: swipeData.targetUserId,
          action: swipeData.action,
          timestamp: swipeData.timestamp.toISOString(),
          location: swipeData.location,
        },
      });

      logger.info(
        `Swipe analytics tracked: ${swipeData.action} from ${swipeData.userId} to ${swipeData.targetUserId}`
      );
    } catch (error) {
      logger.error("Failed to track swipe analytics:", error);
    }
  }

  /**
   * Track detailed match analytics
   */
  static async trackMatchAnalytics(matchData: MatchAnalytics): Promise<void> {
    if (!env.enableAnalytics) {
      return;
    }

    try {
      await this.trackEvent({
        userId: matchData.user1Id,
        event: "match_analytics",
        platform: matchData.platform,
        properties: {
          matchId: matchData.matchId,
          user2Id: matchData.user2Id,
          matchedAt: matchData.matchedAt.toISOString(),
          firstMessageSentAt: matchData.firstMessageSentAt?.toISOString(),
          conversationStarted: matchData.conversationStarted,
        },
      });

      logger.info(
        `Match analytics tracked: ${matchData.matchId} between ${matchData.user1Id} and ${matchData.user2Id}`
      );
    } catch (error) {
      logger.error("Failed to track match analytics:", error);
    }
  }

  /**
   * Track detailed message analytics
   */
  static async trackMessageAnalytics(
    messageData: MessageAnalytics
  ): Promise<void> {
    if (!env.enableAnalytics) {
      return;
    }

    try {
      await this.trackEvent({
        userId: messageData.senderId,
        event: "message_analytics",
        platform: messageData.platform,
        properties: {
          messageId: messageData.messageId,
          receiverId: messageData.receiverId,
          messageType: messageData.messageType,
          timestamp: messageData.timestamp.toISOString(),
          responseTime: messageData.responseTime,
          isFirstMessage: messageData.isFirstMessage,
        },
      });

      logger.info(
        `Message analytics tracked: ${messageData.messageType} from ${messageData.senderId} to ${messageData.receiverId}`
      );
    } catch (error) {
      logger.error("Failed to track message analytics:", error);
    }
  }

  /**
   * Track detailed subscription analytics
   */
  static async trackSubscriptionAnalytics(
    subscriptionData: SubscriptionAnalytics
  ): Promise<void> {
    if (!env.enableAnalytics) {
      return;
    }

    try {
      await this.trackEvent({
        userId: subscriptionData.userId,
        event: "subscription_analytics",
        platform: subscriptionData.platform,
        properties: {
          action: subscriptionData.action,
          subscriptionType: subscriptionData.subscriptionType,
          timestamp: subscriptionData.timestamp.toISOString(),
          revenue: subscriptionData.revenue,
          trialPeriod: subscriptionData.trialPeriod,
        },
      });

      logger.info(
        `Subscription analytics tracked: ${subscriptionData.action} for user ${subscriptionData.userId}, type: ${subscriptionData.subscriptionType}`
      );
    } catch (error) {
      logger.error("Failed to track subscription analytics:", error);
    }
  }

  /**
   * Track detailed feature usage analytics
   */
  static async trackFeatureUsageAnalytics(
    featureData: FeatureUsageAnalytics
  ): Promise<void> {
    if (!env.enableAnalytics) {
      return;
    }

    try {
      await this.trackEvent({
        userId: featureData.userId,
        event: "feature_usage_analytics",
        platform: featureData.platform,
        properties: {
          feature: featureData.feature,
          action: featureData.action,
          timestamp: featureData.timestamp.toISOString(),
          metadata: featureData.metadata,
          duration: featureData.duration,
          success: featureData.success,
        },
      });

      logger.info(
        `Feature usage analytics tracked: ${featureData.feature} - ${featureData.action} by ${featureData.userId}, success: ${featureData.success}`
      );
    } catch (error) {
      logger.error("Failed to track feature usage analytics:", error);
    }
  }

  /**
   * Get user metrics for dashboard
   */
  static async getUserMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<UserMetrics> {
    try {
      const [dailyActive, weeklyActive, monthlyActive, newUsers, retained] =
        await Promise.all([
          // Daily active users
          prisma.user.count({
            where: {
              lastLogin: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
              },
            },
          }),

          // Weekly active users
          prisma.user.count({
            where: {
              lastLogin: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
              },
            },
          }),

          // Monthly active users
          prisma.user.count({
            where: {
              lastLogin: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          }),

          // New users in date range
          prisma.user.count({
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          }),

          // Retained users (users who signed up before start date and were active in range)
          prisma.user.count({
            where: {
              createdAt: { lt: startDate },
              lastLogin: {
                gte: startDate,
                lte: endDate,
              },
            },
          }),
        ]);

      return {
        dailyActiveUsers: dailyActive,
        weeklyActiveUsers: weeklyActive,
        monthlyActiveUsers: monthlyActive,
        newUsers,
        retainedUsers: retained,
      };
    } catch (error) {
      logger.error("Failed to get user metrics:", error);
      return handleServiceError(error) as any;
    }
  }

  /**
   * Get engagement metrics
   */
  static async getEngagementMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<EngagementMetrics> {
    try {
      const [totalMatches, totalMessages, userCount] = await Promise.all([
        prisma.match.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),

        prisma.message.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),

        prisma.user.count({
          where: {
            isActive: true,
          },
        }),
      ]);

      return {
        totalMatches,
        totalMessages,
        averageSessionDuration: 0, // Would need session tracking to calculate
        messagesPerUser: userCount > 0 ? totalMessages / userCount : 0,
        matchesPerUser: userCount > 0 ? totalMatches / userCount : 0,
      };
    } catch (error) {
      logger.error("Failed to get engagement metrics:", error);
      return handleServiceError(error) as any;
    }
  }

  /**
   * Get platform distribution
   */
  static async getPlatformDistribution(): Promise<Record<string, number>> {
    try {
      const devices = await prisma.device.groupBy({
        by: ["platform"],
        _count: { id: true },
        where: {
          isActive: true,
        },
      });

      const distribution: Record<string, number> = {};
      devices.forEach((device) => {
        distribution[device.platform] = device._count.id;
      });

      return distribution;
    } catch (error) {
      logger.error("Failed to get platform distribution:", error);
      return handleServiceError(error) as any;
    }
  }

  /**
   * Get detailed conversion funnel data
   */
  static async getDetailedConversionFunnel(
    startDate: Date,
    endDate: Date
  ): Promise<ConversionFunnelData> {
    try {
      // Calculate conversion funnel data directly
      const [signups, profileCompleted, firstSwipe, firstMatch, firstMessage] =
        await Promise.all([
          // Total signups
          prisma.user.count({
            where: {
              createdAt: { gte: startDate, lte: endDate },
            },
          }),

          // Profile completed (users with profile data)
          prisma.user.count({
            where: {
              createdAt: { gte: startDate, lte: endDate },
              profile: { isNot: null },
            },
          }),

          // First swipes (users who have liked at least one other user)
          prisma.user.count({
            where: {
              createdAt: { gte: startDate, lte: endDate },
              sentLikes: { some: {} },
            },
          }),

          // First matches (users who have at least one match)
          prisma.user.count({
            where: {
              createdAt: { gte: startDate, lte: endDate },
              initiatedMatches: { some: {} },
            },
          }),

          // First messages (users who have sent at least one message)
          prisma.user.count({
            where: {
              createdAt: { gte: startDate, lte: endDate },
              sentMessages: { some: {} },
            },
          }),
        ]);

      const detailedFunnel: ConversionFunnelData = {
        signups,
        profileCompleted,
        firstSwipe,
        firstMatch,
        firstMessage,
        subscriptions: 0, // Would need subscription tracking
        conversionRates: {
          signupToProfile: signups > 0 ? (profileCompleted / signups) * 100 : 0,
          profileToSwipe:
            profileCompleted > 0 ? (firstSwipe / profileCompleted) * 100 : 0,
          swipeToMatch: firstSwipe > 0 ? (firstMatch / firstSwipe) * 100 : 0,
          matchToMessage:
            firstMatch > 0 ? (firstMessage / firstMatch) * 100 : 0,
          messageToSubscription: firstMessage > 0 ? 0 : 0, // Would need subscription data
        },
      };

      logger.info(
        `Detailed conversion funnel calculated: ${detailedFunnel.signups} signups, ${detailedFunnel.conversionRates.signupToProfile}% profile completion rate`
      );

      return detailedFunnel;
    } catch (error) {
      logger.error("Failed to get detailed conversion funnel:", error);
      return handleServiceError(error) as any;
    }
  }

  /**
   * Get detailed platform distribution
   */
  static async getDetailedPlatformDistribution(): Promise<PlatformDistribution> {
    try {
      const distribution = await this.getPlatformDistribution();

      const total = Object.values(distribution).reduce(
        (sum, count) => sum + count,
        0
      );
      const ios = distribution.ios || 0;
      const android = distribution.android || 0;
      const web = distribution.web || 0;

      const detailedDistribution: PlatformDistribution = {
        ios,
        android,
        web,
        total,
        percentages: {
          ios: total > 0 ? (ios / total) * 100 : 0,
          android: total > 0 ? (android / total) * 100 : 0,
          web: total > 0 ? (web / total) * 100 : 0,
        },
      };

      logger.info(
        `Platform distribution: iOS ${detailedDistribution.percentages.ios}%, Android ${detailedDistribution.percentages.android}%, Web ${detailedDistribution.percentages.web}%`
      );

      return detailedDistribution;
    } catch (error) {
      logger.error("Failed to get detailed platform distribution:", error);
      return handleServiceError(error) as any;
    }
  }

  /**
   * Get retention metrics
   */
  static async getRetentionMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<RetentionMetrics> {
    try {
      // Calculate retention for different cohorts
      const [day1, day7, day30, day90] = await Promise.all([
        // Day 1 retention
        prisma.user.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            lastLogin: {
              gte: new Date(startDate.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Day 7 retention
        prisma.user.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            lastLogin: {
              gte: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Day 30 retention
        prisma.user.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            lastLogin: {
              gte: new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Day 90 retention
        prisma.user.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            lastLogin: {
              gte: new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      const totalCohort = await prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      });

      const retention: RetentionMetrics = {
        day1: totalCohort > 0 ? (day1 / totalCohort) * 100 : 0,
        day7: totalCohort > 0 ? (day7 / totalCohort) * 100 : 0,
        day30: totalCohort > 0 ? (day30 / totalCohort) * 100 : 0,
        day90: totalCohort > 0 ? (day90 / totalCohort) * 100 : 0,
        cohortSizes: {
          total: totalCohort,
          retained_day1: day1,
          retained_day7: day7,
          retained_day30: day30,
          retained_day90: day90,
        },
      };

      logger.info(
        `Retention metrics calculated: Day 1: ${retention.day1}%, Day 7: ${retention.day7}%, Day 30: ${retention.day30}%`
      );

      return retention;
    } catch (error) {
      logger.error("Failed to get retention metrics:", error);
      return handleServiceError(error) as any;
    }
  }

  /**
   * Get revenue metrics
   */
  static async getRevenueMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<RevenueMetrics> {
    try {
      // This would typically involve subscription and payment data
      // For now, return basic revenue structure

      const subscriptions = await prisma.subscription.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          isActive: true,
        },
      });

      const revenue: RevenueMetrics = {
        totalRevenue: 0, // Would need payment tracking
        monthlyRecurringRevenue: subscriptions * 9.99, // Assuming $9.99/month average
        averageRevenuePerUser: 0, // Would need user payment history
        lifetimeValue: 0, // Would need historical payment data
        churnRate: 0, // Would need cancellation tracking
        subscriptionsByTier: {
          basic: Math.floor(subscriptions * 0.6),
          premium: Math.floor(subscriptions * 0.3),
          vip: Math.floor(subscriptions * 0.1),
        },
      };

      logger.info(
        `Revenue metrics calculated: ${subscriptions} active subscriptions, estimated MRR: $${revenue.monthlyRecurringRevenue}`
      );

      return revenue;
    } catch (error) {
      logger.error("Failed to get revenue metrics:", error);
      return handleServiceError(error) as any;
    }
  }

  /**
   * Clean up old analytics data
   */
  static async cleanupOldAnalytics(olderThanDays: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const deleted = await prisma.notification.deleteMany({
        where: {
          type: "analytics",
          createdAt: { lt: cutoffDate },
        },
      });

      logger.info(`Cleaned up ${deleted.count} old analytics records`);
    } catch (error) {
      logger.error("Failed to cleanup analytics data:", error);
    }
  }
}
