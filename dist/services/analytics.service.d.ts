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
export declare class AnalyticsService {
    /**
     * Track user event
     */
    static trackEvent(event: AnalyticsEvent): Promise<void>;
    /**
     * Track user session start
     */
    static trackSessionStart(userId: string, platform: string, appVersion?: string): Promise<void>;
    /**
     * Track user session end
     */
    static trackSessionEnd(userId: string, platform: string, sessionDuration: number, appVersion?: string): Promise<void>;
    /**
     * Track swipe action
     */
    static trackSwipe(userId: string, targetUserId: string, action: "like" | "pass" | "super_like", platform: string): Promise<void>;
    /**
     * Track match creation
     */
    static trackMatch(userId1: string, userId2: string, platform: string): Promise<void>;
    /**
     * Track message sent
     */
    static trackMessage(senderId: string, receiverId: string, messageType: string, platform: string): Promise<void>;
    /**
     * Track profile completion
     */
    static trackProfileCompletion(userId: string, completionPercentage: number, platform: string): Promise<void>;
    /**
     * Track subscription events
     */
    static trackSubscription(userId: string, action: "subscribe" | "cancel" | "renew" | "expire", subscriptionType: string, platform: string): Promise<void>;
    /**
     * Track detailed session data
     */
    static trackSessionData(sessionData: SessionData): Promise<void>;
    /**
     * Track detailed swipe analytics
     */
    static trackSwipeAnalytics(swipeData: SwipeAnalytics): Promise<void>;
    /**
     * Track detailed match analytics
     */
    static trackMatchAnalytics(matchData: MatchAnalytics): Promise<void>;
    /**
     * Track detailed message analytics
     */
    static trackMessageAnalytics(messageData: MessageAnalytics): Promise<void>;
    /**
     * Track detailed subscription analytics
     */
    static trackSubscriptionAnalytics(subscriptionData: SubscriptionAnalytics): Promise<void>;
    /**
     * Track detailed feature usage analytics
     */
    static trackFeatureUsageAnalytics(featureData: FeatureUsageAnalytics): Promise<void>;
    /**
     * Get user metrics for dashboard
     */
    static getUserMetrics(startDate: Date, endDate: Date): Promise<UserMetrics>;
    /**
     * Get engagement metrics
     */
    static getEngagementMetrics(startDate: Date, endDate: Date): Promise<EngagementMetrics>;
    /**
     * Get platform distribution
     */
    static getPlatformDistribution(): Promise<Record<string, number>>;
    /**
     * Get detailed conversion funnel data
     */
    static getDetailedConversionFunnel(startDate: Date, endDate: Date): Promise<ConversionFunnelData>;
    /**
     * Get detailed platform distribution
     */
    static getDetailedPlatformDistribution(): Promise<PlatformDistribution>;
    /**
     * Get retention metrics
     */
    static getRetentionMetrics(startDate: Date, endDate: Date): Promise<RetentionMetrics>;
    /**
     * Get revenue metrics
     */
    static getRevenueMetrics(startDate: Date, endDate: Date): Promise<RevenueMetrics>;
    /**
     * Clean up old analytics data
     */
    static cleanupOldAnalytics(olderThanDays?: number): Promise<void>;
}
//# sourceMappingURL=analytics.service.d.ts.map