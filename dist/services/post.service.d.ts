export interface PostWithDetails {
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
    community?: {
        id: string;
        name: string;
    };
    content?: string;
    mediaAssets: any[];
    type: string;
    visibility: string;
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    viewsCount: number;
    isEdited: boolean;
    editedAt?: Date;
    isPinned: boolean;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
    isLiked?: boolean;
    isBookmarked?: boolean;
    userLikeType?: any;
}
export interface CreatePostData {
    authorId: string;
    content?: string;
    mediaIds?: string[];
    communityId?: string;
    type?: 'text' | 'image' | 'video' | 'poll' | 'link';
    visibility?: 'public' | 'friends' | 'private' | 'community';
    tags?: string[];
    location?: {
        latitude: number;
        longitude: number;
        name?: string;
    };
    scheduledAt?: Date;
    expiresAt?: Date;
}
export interface UpdatePostData {
    content?: string;
    visibility?: 'public' | 'friends' | 'private' | 'community';
    tags?: string[];
    isPinned?: boolean;
    isArchived?: boolean;
}
export interface PostFilters {
    authorId?: string;
    communityId?: string;
    type?: string;
    visibility?: string;
    tags?: string[];
    hasMedia?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
    isArchived?: boolean;
    isPinned?: boolean;
}
export interface PostSearchParams {
    query?: string;
    filters?: PostFilters;
    sortBy?: 'created' | 'updated' | 'likes' | 'comments' | 'views';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    viewerId?: string;
}
export interface PostAnalytics {
    postId: string;
    viewsCount: number;
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    bookmarksCount: number;
    engagementRate: number;
    reachCount: number;
    impressions: number;
    clickThroughRate?: number;
    demographics: {
        ageGroups: Record<string, number>;
        genders: Record<string, number>;
        locations: Record<string, number>;
    };
    engagementTimeline: Array<{
        timestamp: Date;
        likes: number;
        comments: number;
        shares: number;
        views: number;
    }>;
}
export interface MediaAsset {
    id: string;
    url: string;
    type: 'image' | 'video' | 'audio' | 'document';
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    duration?: number;
    thumbnailUrl?: string;
    caption?: string;
    altText?: string;
    order: number;
}
export interface PostAttachment {
    id: string;
    type: 'link' | 'location' | 'poll' | 'event';
    data: Record<string, any>;
    metadata?: Record<string, any>;
}
export interface PostMention {
    userId: string;
    username: string;
    displayName: string;
    startIndex: number;
    endIndex: number;
}
export interface PostHashtag {
    tag: string;
    startIndex: number;
    endIndex: number;
}
export interface PostPermissions {
    canView: boolean;
    canLike: boolean;
    canComment: boolean;
    canShare: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canPin: boolean;
    canArchive: boolean;
}
export interface PostDraft {
    id: string;
    authorId: string;
    content?: string;
    mediaIds?: string[];
    communityId?: string;
    type: string;
    visibility: string;
    tags: string[];
    scheduledAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface PostVersion {
    id: string;
    postId: string;
    content?: string;
    reason?: string;
    createdAt: Date;
    createdBy: string;
}
export interface FeedParams {
    userId: string;
    type?: 'timeline' | 'explore' | 'following' | 'community';
    communityId?: string;
    algorithm?: 'chronological' | 'engagement' | 'personalized';
    limit?: number;
    offset?: number;
    includePromoted?: boolean;
}
export interface PostEngagement {
    postId: string;
    userId: string;
    type: 'view' | 'like' | 'comment' | 'share' | 'bookmark' | 'click';
    timestamp: Date;
    metadata?: Record<string, any>;
}
export declare class PostService {
    static getPostById(postId: string, viewerId?: string): Promise<PostWithDetails | null>;
    static createPost(params: {
        authorId: string;
        content?: string;
        communityId?: string | null;
        type?: string;
        visibility?: string;
    }): Promise<PostWithDetails>;
    static updatePost(postId: string, userId: string, data: {
        content?: string;
        isPinned?: boolean;
        isArchived?: boolean;
    }): Promise<PostWithDetails | null>;
    static deletePost(postId: string, userId: string): Promise<boolean>;
    static getFeed(userId: string, options?: {
        limit?: number;
        cursor?: string;
    }): Promise<{
        items: PostWithDetails[];
        nextCursor?: string;
    }>;
    private static toPostWithDetails;
}
//# sourceMappingURL=post.service.d.ts.map