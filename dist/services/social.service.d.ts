export interface CreateCommentData {
    postId: string;
    content: string;
    parentId?: string;
    mediaUrl?: string;
}
export interface CommentWithDetails {
    id: string;
    author: {
        id: string;
        profile: {
            displayName: string;
            bio?: string;
        };
        photos: {
            url: string;
            isPrimary: boolean;
        }[];
    };
    content: string;
    likesCount: number;
    repliesCount: number;
    isEdited: boolean;
    editedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    isLiked: boolean;
    userLikeType?: any;
    replies?: CommentWithDetails[];
}
export interface UpdateCommentData {
    content?: string;
    mediaUrl?: string;
    isPinned?: boolean;
    isHidden?: boolean;
}
export interface LikeData {
    userId: string;
    targetId: string;
    targetType: "post" | "comment" | "story" | "profile";
    likeType?: "like" | "love" | "laugh" | "angry" | "sad" | "wow";
}
export interface LikeResult {
    liked: boolean;
    likeId?: string;
    likeType?: string;
    totalLikes: number;
    likeBreakdown?: Record<string, number>;
}
export interface ReactionData {
    userId: string;
    targetId: string;
    targetType: "post" | "comment" | "story";
    reactionType: "like" | "love" | "laugh" | "angry" | "sad" | "wow" | "fire" | "heart" | "thumbsup" | "thumbsdown";
    intensity?: number;
}
export interface ReactionResult {
    reactionId: string;
    reactionType: string;
    totalReactions: number;
    reactionBreakdown: Record<string, number>;
    userReaction?: string;
}
export interface SocialInteraction {
    id: string;
    userId: string;
    targetId: string;
    targetType: string;
    interactionType: "like" | "comment" | "share" | "view" | "mention" | "tag";
    metadata?: Record<string, any>;
    timestamp: Date;
}
export interface CommentThread {
    id: string;
    postId: string;
    rootComment: CommentWithDetails;
    replies: CommentWithDetails[];
    totalReplies: number;
    depth: number;
    isLocked: boolean;
    isPinned: boolean;
}
export interface MentionData {
    userId: string;
    mentionedUserId: string;
    contentId: string;
    contentType: "post" | "comment" | "story";
    position: {
        start: number;
        end: number;
    };
    context?: string;
}
export interface TagData {
    userId: string;
    taggedUserId: string;
    contentId: string;
    contentType: "post" | "story" | "photo";
    position?: {
        x: number;
        y: number;
    };
    approved: boolean;
}
export interface FollowData {
    followerId: string;
    followingId: string;
    isClose?: boolean;
    notifications?: boolean;
}
export interface FollowResult {
    following: boolean;
    followId?: string;
    mutualFollows: number;
    followerCount: number;
    followingCount: number;
}
export interface BlockData {
    blockerId: string;
    blockedId: string;
    reason?: string;
    reportId?: string;
}
export interface SocialStats {
    userId: string;
    followersCount: number;
    followingCount: number;
    postsCount: number;
    likesReceived: number;
    commentsReceived: number;
    sharesReceived: number;
    engagementRate: number;
    averageLikesPerPost: number;
    averageCommentsPerPost: number;
}
export interface SocialGraph {
    userId: string;
    connections: Array<{
        userId: string;
        relationship: "following" | "follower" | "mutual" | "blocked";
        strength: number;
        lastInteraction: Date;
        mutualConnections: number;
    }>;
    suggestions: Array<{
        userId: string;
        score: number;
        reasons: string[];
        mutualConnections: number;
    }>;
}
export interface SocialFeed {
    items: Array<{
        id: string;
        type: "post" | "story" | "activity" | "suggestion";
        content: any;
        timestamp: Date;
        score: number;
        reason?: string;
    }>;
    hasMore: boolean;
    nextCursor?: string;
    algorithm: string;
}
export interface EngagementMetrics {
    targetId: string;
    targetType: string;
    totalEngagements: number;
    engagementTypes: Record<string, number>;
    uniqueUsers: number;
    engagementRate: number;
    peakEngagementTime: Date;
    engagementTimeline: Array<{
        timestamp: Date;
        count: number;
    }>;
}
export interface SocialNotification {
    id: string;
    userId: string;
    actorId: string;
    actorName: string;
    actorAvatar?: string;
    type: "like" | "comment" | "follow" | "mention" | "tag" | "share";
    contentId?: string;
    contentType?: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
    metadata?: Record<string, any>;
}
export interface ContentModeration {
    contentId: string;
    contentType: string;
    status: "pending" | "approved" | "rejected" | "flagged";
    flags: string[];
    moderatorId?: string;
    reason?: string;
    actionTaken?: string;
    reviewedAt?: Date;
}
export interface SocialPrivacy {
    userId: string;
    allowComments: boolean;
    allowTags: boolean;
    allowMentions: boolean;
    whoCanFollow: "everyone" | "friends" | "nobody";
    whoCanMessage: "everyone" | "friends" | "nobody";
    profileVisibility: "public" | "friends" | "private";
    postDefaultPrivacy: "public" | "friends" | "private";
}
export declare class SocialService {
    static createComment(userId: string, data: CreateCommentData): Promise<CommentWithDetails>;
    static toggleCommentLike(commentId: string, userId: string): Promise<{
        isLiked: boolean;
        likesCount: number;
    }>;
    static getPostComments(postId: string, viewerId?: string, limit?: number): Promise<CommentWithDetails[]>;
    static getPostLikesBreakdown(postId: string): Promise<{
        totalLikes: number;
        likeBreakdown: Record<string, number>;
    }>;
    static togglePostLike(postId: string, userId: string, type?: string): Promise<{
        isLiked: boolean;
        likesCount: number;
    }>;
    static getPostLikes(postId: string, limit?: number, offset?: number): Promise<{
        likes: Array<{
            id: string;
            type: string;
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
            createdAt: Date;
        }>;
        total: number;
    }>;
    static updateComment(commentId: string, authorId: string, data: {
        content: string;
    }): Promise<CommentWithDetails>;
    static deleteComment(commentId: string, authorId: string): Promise<void>;
    static getCommentReplies(commentId: string, limit?: number, offset?: number): Promise<{
        replies: CommentWithDetails[];
        total: number;
    }>;
    static getPostStats(postId: string): Promise<{
        likesCount: number;
        commentsCount: number;
        sharesCount: number;
        viewsCount: number;
        likeBreakdown: Record<string, number>;
    }>;
}
//# sourceMappingURL=social.service.d.ts.map