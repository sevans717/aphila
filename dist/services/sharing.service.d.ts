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
    name: "twitter" | "facebook" | "instagram" | "tiktok" | "linkedin" | "whatsapp" | "telegram" | "internal" | "sms" | "email" | "link";
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
export declare class SharingService {
    static sharePost(data: CreateShareData): Promise<ShareWithDetails>;
    static shareMedia(data: CreateShareData): Promise<ShareWithDetails>;
    static getUserShares(userId: string, limit?: number): Promise<ShareWithDetails[]>;
    static deleteShare(shareId: string, userId: string, type: "post" | "media"): Promise<void>;
    static shareContent(data: CreateShareData): Promise<ShareWithDetails>;
    static getContentShares(contentId: string, type: "post" | "media", limit?: number, offset?: number): Promise<{
        shares: ShareWithDetails[];
        total: number;
    }>;
}
//# sourceMappingURL=sharing.service.d.ts.map