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
export declare class StoryService {
    static createStory(data: CreateStoryData): Promise<StoryWithDetails>;
    static getActiveStories(userId?: string): Promise<StoryWithDetails[]>;
    static viewStory(storyId: string, viewerId: string): Promise<void>;
    static deleteStory(storyId: string, userId: string): Promise<void>;
    static getStoryById(storyId: string, viewerId: string): Promise<StoryWithDetails | null>;
    static updateStorySettings(storyId: string, userId: string, data: any): Promise<StoryWithDetails>;
    static getStoriesFeed(userId: string, limit?: number, offset?: number): Promise<{
        stories: StoryWithDetails[];
        total: number;
    }>;
    static getUserStories(targetUserId: string, viewerId?: string, includeExpired?: boolean): Promise<{
        stories: StoryWithDetails[];
        total: number;
    }>;
    static trackView(storyId: string, viewerId: string): Promise<void>;
    static getStoryViewers(storyId: string, ownerId: string, limit?: number, offset?: number): Promise<{
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
    }>;
    static getStoryStats(storyId: string, userId: string): Promise<{
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
    }>;
    static getAnalyticsOverview(startDate?: Date | string, endDate?: Date | string): Promise<{
        timeframe: {
            start: string;
            end: string;
        };
        totalStories: number;
        totalViews: number;
        totalReplies: number;
        avgViewDuration: number;
        topStories: {
            id: any;
            media: any;
            user: {
                id: any;
                displayName: any;
            };
            views: any;
        }[];
    }>;
    static addToHighlights(storyId: string, userId: string, highlightName?: string, coverImage?: string): Promise<{
        id: string;
        userId: string;
        createdAt: Date;
        duration: number;
        content: string | null;
        expiresAt: Date;
        isPublic: boolean;
        viewsCount: number;
        mediaId: string;
        caption: string | null;
        isHighlight: boolean;
    }>;
    static getNearbyStories(latitude: number, longitude: number, radiusKm?: number, limit?: number, offset?: number): Promise<{
        stories: {
            id: string;
            createdAt: Date;
            expiresAt: Date;
            distanceKm: number;
            user: {
                id: string;
                displayName: string | undefined;
            };
            media: {
                id: string;
                type: import("@prisma/client").$Enums.MediaType;
                url: string;
            };
            views: number;
        }[];
        total: number;
    }>;
    static cleanupExpiredStories(): Promise<{
        deletedCount: number;
    }>;
}
//# sourceMappingURL=story.service.d.ts.map