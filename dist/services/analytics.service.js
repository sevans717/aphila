"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const env_1 = require("../config/env");
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
const error_1 = require("../utils/error");
class AnalyticsService {
    /**
     * Track user event
     */
    static async trackEvent(event) {
        if (!env_1.env.enableAnalytics) {
            return;
        }
        try {
            // Store in search query table for analytics (using it as a flexible event store)
            await prisma_1.prisma.searchQuery.create({
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
            logger_1.logger.info(`Analytics event tracked: ${event.event} for user ${event.userId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to track analytics event:', error);
        }
    }
    /**
     * Track user session start
     */
    static async trackSessionStart(userId, platform, appVersion) {
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
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { lastLogin: new Date() },
        });
    }
    /**
     * Track user session end
     */
    static async trackSessionEnd(userId, platform, sessionDuration, appVersion) {
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
    static async trackSwipe(userId, targetUserId, action, platform) {
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
    static async trackMatch(userId1, userId2, platform) {
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
    static async trackMessage(senderId, receiverId, messageType, platform) {
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
    static async trackProfileCompletion(userId, completionPercentage, platform) {
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
    static async trackSubscription(userId, action, subscriptionType, platform) {
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
    static async trackFeatureUsage(userId, feature, action, platform, metadata) {
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
    static async getUserMetrics(startDate, endDate) {
        try {
            const [dailyActive, weeklyActive, monthlyActive, newUsers, retained] = await Promise.all([
                // Daily active users
                prisma_1.prisma.user.count({
                    where: {
                        lastLogin: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                        },
                    },
                }),
                // Weekly active users
                prisma_1.prisma.user.count({
                    where: {
                        lastLogin: {
                            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                        },
                    },
                }),
                // Monthly active users
                prisma_1.prisma.user.count({
                    where: {
                        lastLogin: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                        },
                    },
                }),
                // New users in date range
                prisma_1.prisma.user.count({
                    where: {
                        createdAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                }),
                // Retained users (users who signed up before start date and were active in range)
                prisma_1.prisma.user.count({
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get user metrics:', error);
            return (0, error_1.handleServiceError)(error);
        }
    }
    /**
     * Get engagement metrics
     */
    static async getEngagementMetrics(startDate, endDate) {
        try {
            const [totalMatches, totalMessages, userCount] = await Promise.all([
                prisma_1.prisma.match.count({
                    where: {
                        createdAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                }),
                prisma_1.prisma.message.count({
                    where: {
                        createdAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                }),
                prisma_1.prisma.user.count({
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get engagement metrics:', error);
            return (0, error_1.handleServiceError)(error);
        }
    }
    /**
     * Get platform distribution
     */
    static async getPlatformDistribution() {
        try {
            const devices = await prisma_1.prisma.device.groupBy({
                by: ['platform'],
                _count: { id: true },
                where: {
                    isActive: true,
                },
            });
            const distribution = {};
            devices.forEach(device => {
                distribution[device.platform] = device._count.id;
            });
            return distribution;
        }
        catch (error) {
            logger_1.logger.error('Failed to get platform distribution:', error);
            return (0, error_1.handleServiceError)(error);
        }
    }
    /**
     * Get conversion funnel data
     */
    static async getConversionFunnel(startDate, endDate) {
        try {
            // This would typically involve complex queries to track user journey
            // For now, return basic funnel metrics
            const [signups, profileCompleted, firstSwipe, firstMatch, firstMessage] = await Promise.all([
                prisma_1.prisma.user.count({
                    where: {
                        createdAt: { gte: startDate, lte: endDate },
                    },
                }),
                prisma_1.prisma.profile.count({
                    where: {
                        user: {
                            createdAt: { gte: startDate, lte: endDate },
                        },
                        displayName: { not: null },
                        bio: { not: null },
                    },
                }),
                prisma_1.prisma.like.count({
                    where: {
                        createdAt: { gte: startDate, lte: endDate },
                    },
                }),
                prisma_1.prisma.match.count({
                    where: {
                        createdAt: { gte: startDate, lte: endDate },
                    },
                }),
                prisma_1.prisma.message.count({
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get conversion funnel:', error);
            return (0, error_1.handleServiceError)(error);
        }
    }
    /**
     * Clean up old analytics data
     */
    static async cleanupOldAnalytics(olderThanDays = 90) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
            const deleted = await prisma_1.prisma.notification.deleteMany({
                where: {
                    type: 'analytics',
                    createdAt: { lt: cutoffDate },
                },
            });
            logger_1.logger.info(`Cleaned up ${deleted.count} old analytics records`);
        }
        catch (error) {
            logger_1.logger.error('Failed to cleanup analytics data:', error);
        }
    }
}
exports.AnalyticsService = AnalyticsService;
//# sourceMappingURL=analytics.service.js.map