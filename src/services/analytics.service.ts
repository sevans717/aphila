import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

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
  deviceType: 'mobile' | 'tablet' | 'desktop';
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
  action: 'like' | 'pass' | 'super_like';
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
  messageType: 'text' | 'image' | 'gif' | 'sticker' | 'voice';
  timestamp: Date;
  responseTime?: number;
  isFirstMessage: boolean;
  platform: string;
}

export interface SubscriptionAnalytics {
  userId: string;
  action: 'subscribe' | 'cancel' | 'renew' | 'expire';
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

      logger.info(`Analytics event tracked: ${event.event} for user ${event.userId}`);
    } catch (error) {
      logger.error('Failed to track analytics event:', error);
    }
  }

  /**
   * Track user session start
   */
  static async trackSessionStart(userId: string, platform: string, appVersion?: string): Promise<void> {
    await this.trackEvent({
      userId,
      event: 'session_start',
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
      event: 'session_end',
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
    action: 'like' | 'pass' | 'super_like',
    platform: string
  ): Promise<void> {
    await this.trackEvent({
      userId,
      event: 'swipe',
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
  static async trackMatch(userId1: string, userId2: string, platform: string): Promise<void> {
    // Track for both users
    await Promise.all([
      this.trackEvent({
        userId: userId1,
        event: 'match_created',
        platform,
        properties: {
          matchedUserId: userId2,
          timestamp: new Date().toISOString(),
        },
      }),
      this.trackEvent({
        userId: userId2,
        event: 'match_created',
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
      event: 'message_sent',
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
  static async trackProfileCompletion(userId: string, completionPercentage: number, platform: string): Promise<void> {
    await this.trackEvent({
      userId,
      event: 'profile_completion',
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
    action: 'subscribe' | 'cancel' | 'renew' | 'expire',
    subscriptionType: string,
    platform: string
  ): Promise<void> {
    await this.trackEvent({
      userId,
      event: 'subscription',
      platform,
      properties: {
        action,
        subscriptionType,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track feature usage
   */
  static async trackFeatureUsage(
    userId: string, 
    feature: string, 
    action: string,
    platform: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      userId,
      event: 'feature_usage',
      platform,
      properties: {
        feature,
        action,
        metadata,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Get user metrics for dashboard
   */
  static async getUserMetrics(startDate: Date, endDate: Date): Promise<UserMetrics> {
    try {
      const [dailyActive, weeklyActive, monthlyActive, newUsers, retained] = await Promise.all([
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
      logger.error('Failed to get user metrics:', error);
      throw error;
    }
  }

  /**
   * Get engagement metrics
   */
  static async getEngagementMetrics(startDate: Date, endDate: Date): Promise<EngagementMetrics> {
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
      logger.error('Failed to get engagement metrics:', error);
      throw error;
    }
  }

  /**
   * Get platform distribution
   */
  static async getPlatformDistribution(): Promise<Record<string, number>> {
    try {
      const devices = await prisma.device.groupBy({
        by: ['platform'],
        _count: {
          id: true,
        },
        where: {
          isActive: true,
        },
      });

      const distribution: Record<string, number> = {};
      devices.forEach(device => {
        distribution[device.platform] = device._count.id;
      });

      return distribution;
    } catch (error) {
      logger.error('Failed to get platform distribution:', error);
      throw error;
    }
  }

  /**
   * Get conversion funnel data
   */
  static async getConversionFunnel(startDate: Date, endDate: Date): Promise<any> {
    try {
      // This would typically involve complex queries to track user journey
      // For now, return basic funnel metrics
      
      const [signups, profileCompleted, firstSwipe, firstMatch, firstMessage] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        
        prisma.profile.count({
          where: {
            user: {
              createdAt: { gte: startDate, lte: endDate },
            },
            displayName: { not: null as any },
            bio: { not: null },
          },
        }),
        
        prisma.like.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        
        prisma.match.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        
        prisma.message.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
      ]);

      return {
        signups,
        profileCompleted,
        firstSwipe,
        firstMatch,
        firstMessage,
        conversionRates: {
          signupToProfile: signups > 0 ? (profileCompleted / signups) * 100 : 0,
          profileToSwipe: profileCompleted > 0 ? (firstSwipe / profileCompleted) * 100 : 0,
          swipeToMatch: firstSwipe > 0 ? (firstMatch / firstSwipe) * 100 : 0,
          matchToMessage: firstMatch > 0 ? (firstMessage / firstMatch) * 100 : 0,
        },
      };
    } catch (error) {
      logger.error('Failed to get conversion funnel:', error);
      throw error;
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
          type: 'analytics',
          createdAt: { lt: cutoffDate },
        },
      });

      logger.info(`Cleaned up ${deleted.count} old analytics records`);
    } catch (error) {
      logger.error('Failed to cleanup analytics data:', error);
    }
  }
}
