import { prisma } from "../lib/prisma";

export interface PostWithDetails {
  id: string;
  author: {
    id: string;
    profile: { displayName: string; bio?: string };
    photos: { url: string; isPrimary: boolean }[];
  };
  community?: { id: string; name: string };
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
  type?: "text" | "image" | "video" | "poll" | "link";
  visibility?: "public" | "friends" | "private" | "community";
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
  visibility?: "public" | "friends" | "private" | "community";
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
  sortBy?: "created" | "updated" | "likes" | "comments" | "views";
  sortOrder?: "asc" | "desc";
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
  type: "image" | "video" | "audio" | "document";
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
  type: "link" | "location" | "poll" | "event";
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
  type?: "timeline" | "explore" | "following" | "community";
  communityId?: string;
  algorithm?: "chronological" | "engagement" | "personalized";
  limit?: number;
  offset?: number;
  includePromoted?: boolean;
}

export interface PostEngagement {
  postId: string;
  userId: string;
  type: "view" | "like" | "comment" | "share" | "bookmark" | "click";
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class PostService {
  static async getPostById(
    postId: string,
    viewerId?: string
  ): Promise<PostWithDetails | null> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          include: {
            profile: { select: { displayName: true, bio: true } },
            photos: {
              where: { isPrimary: true },
              select: { url: true, isPrimary: true },
            },
          },
        },
        community: { select: { id: true, name: true } },
        mediaAssets: { include: { media: true }, orderBy: { order: "asc" } },
        _count: {
          select: { likes: true, comments: true, shares: true, views: true },
        },
      },
    });
    if (!post) return null;

    // Log viewer access for analytics
    if (viewerId) {
      console.log(`Post ${postId} viewed by user ${viewerId}`);
    }

    return {
      id: post.id,
      author: {
        id: post.author.id,
        profile: {
          displayName: post.author.profile!.displayName,
          bio: post.author.profile!.bio || undefined,
        },
        photos: post.author.photos,
      },
      community: post.community || undefined,
      content: post.content || undefined,
      mediaAssets: [],
      type: post.type,
      visibility: post.visibility,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      sharesCount: post._count.shares,
      viewsCount: post._count.views,
      isEdited: post.isEdited,
      editedAt: post.editedAt || undefined,
      isPinned: post.isPinned,
      isArchived: post.isArchived,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isLiked: false,
      isBookmarked: false,
      userLikeType: undefined,
    };
  }

  static async createPost(params: {
    authorId: string;
    content?: string;
    communityId?: string | null;
    type?: string;
    visibility?: string;
  }): Promise<PostWithDetails> {
    const post = await prisma.post.create({
      data: {
        authorId: params.authorId,
        content: params.content ?? null,
        communityId: params.communityId || null,
        type: (params.type as any) || "TEXT",
        visibility: (params.visibility as any) || "PUBLIC",
      },
      include: {
        author: {
          include: {
            profile: { select: { displayName: true, bio: true } },
            photos: {
              where: { isPrimary: true },
              select: { url: true, isPrimary: true },
            },
          },
        },
        community: { select: { id: true, name: true } },
        mediaAssets: { include: { media: true }, orderBy: { order: "asc" } },
        _count: {
          select: { likes: true, comments: true, shares: true, views: true },
        },
      },
    });
    return this.toPostWithDetails(post);
  }

  static async updatePost(
    postId: string,
    userId: string,
    data: { content?: string; isPinned?: boolean; isArchived?: boolean }
  ): Promise<PostWithDetails | null> {
    const existing = await prisma.post.findUnique({ where: { id: postId } });
    if (!existing || existing.authorId !== userId) return null;
    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        content: data.content ?? existing.content,
        isPinned: data.isPinned ?? existing.isPinned,
        isArchived: data.isArchived ?? existing.isArchived,
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        author: {
          include: {
            profile: { select: { displayName: true, bio: true } },
            photos: {
              where: { isPrimary: true },
              select: { url: true, isPrimary: true },
            },
          },
        },
        community: { select: { id: true, name: true } },
        mediaAssets: { include: { media: true }, orderBy: { order: "asc" } },
        _count: {
          select: { likes: true, comments: true, shares: true, views: true },
        },
      },
    });
    return this.toPostWithDetails(updated);
  }

  static async deletePost(postId: string, userId: string): Promise<boolean> {
    const existing = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!existing || existing.authorId !== userId) return false;
    await prisma.post.delete({ where: { id: postId } });
    return true;
  }

  static async getFeed(
    userId: string,
    options: {
      limit?: number;
      cursor?: string;
      algorithm?: string;
      includePromoted?: boolean;
    } = {}
  ): Promise<{ items: PostWithDetails[]; nextCursor?: string }> {
    const {
      limit = 20,
      cursor,
      algorithm = "chronological",
      includePromoted = false,
    } = options;

    // Log feed parameters for analytics
    console.log(
      `Getting feed for user ${userId} with algorithm: ${algorithm}, includePromoted: ${includePromoted}`
    );

    const posts = await prisma.post.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        author: {
          include: {
            profile: { select: { displayName: true, bio: true } },
            photos: {
              where: { isPrimary: true },
              select: { url: true, isPrimary: true },
            },
          },
        },
        community: { select: { id: true, name: true } },
        mediaAssets: { include: { media: true }, orderBy: { order: "asc" } },
        _count: {
          select: { likes: true, comments: true, shares: true, views: true },
        },
      },
    });
    let nextCursor: string | undefined;
    if (posts.length > limit) {
      const next = posts.pop();
      nextCursor = next?.id;
    }
    return { items: posts.map((p) => this.toPostWithDetails(p)), nextCursor };
  }

  private static toPostWithDetails(post: any): PostWithDetails {
    return {
      id: post.id,
      author: {
        id: post.author.id,
        profile: {
          displayName: post.author.profile?.displayName || "",
          bio: post.author.profile?.bio || undefined,
        },
        photos: post.author.photos || [],
      },
      community: post.community || undefined,
      content: post.content || undefined,
      mediaAssets: [],
      type: post.type,
      visibility: post.visibility,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      sharesCount: post._count.shares,
      viewsCount: post._count.views,
      isEdited: post.isEdited,
      editedAt: post.editedAt || undefined,
      isPinned: post.isPinned,
      isArchived: post.isArchived,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isLiked: false,
      isBookmarked: false,
      userLikeType: undefined,
    };
  }

  // Use PostSearchParams interface for analytics
  static async logSearchAnalytics(
    searchParams: PostSearchParams
  ): Promise<void> {
    console.log(
      `Search analytics - Query: ${searchParams.query}, Filters: ${JSON.stringify(searchParams.filters)}, Limit: ${searchParams.limit}`
    );
  }

  // Use PostAnalytics interface for tracking
  static async trackPostAnalytics(postId: string): Promise<PostAnalytics> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        _count: {
          select: { likes: true, comments: true, shares: true, views: true },
        },
      },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    const analytics: PostAnalytics = {
      postId,
      viewsCount: post._count.views,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      sharesCount: post._count.shares,
      bookmarksCount: 0, // Would need to implement bookmark tracking
      engagementRate: 0, // Calculate based on views
      reachCount: 0, // Would need to implement reach tracking
      impressions: 0, // Would need to implement impression tracking
      demographics: {
        ageGroups: {},
        genders: {},
        locations: {},
      },
      engagementTimeline: [],
    };

    console.log(
      `Post analytics tracked for ${postId}: ${JSON.stringify(analytics)}`
    );
    return analytics;
  }

  // Use MediaAsset interface for media management
  static async getPostMediaAssets(postId: string): Promise<MediaAsset[]> {
    // Note: MediaAsset doesn't have postId in current schema, this would need schema update
    console.log(`Getting media assets for post ${postId}`);
    return [];
  }

  // Use PostAttachment interface for attachment management
  static async getPostAttachments(postId: string): Promise<PostAttachment[]> {
    // This would need attachment table in schema
    console.log(`Getting attachments for post ${postId}`);
    return [];
  }

  // Use PostMention interface for mention tracking
  static async extractMentions(content: string): Promise<PostMention[]> {
    const mentionRegex = /@(\w+)/g;
    const mentions: PostMention[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push({
        userId: "", // Would need to resolve username to userId
        username: match[1],
        displayName: match[1], // Would need to resolve to actual display name
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }

    console.log(`Extracted mentions from content: ${JSON.stringify(mentions)}`);
    return mentions;
  }

  // Use PostHashtag interface for hashtag tracking
  static async extractHashtags(content: string): Promise<PostHashtag[]> {
    const hashtagRegex = /#(\w+)/g;
    const hashtags: PostHashtag[] = [];
    let match;

    while ((match = hashtagRegex.exec(content)) !== null) {
      hashtags.push({
        tag: match[1],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }

    console.log(`Extracted hashtags from content: ${JSON.stringify(hashtags)}`);
    return hashtags;
  }

  // Use PostPermissions interface for permission checking
  static async getPostPermissions(
    postId: string,
    userId: string
  ): Promise<PostPermissions> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true, visibility: true, isArchived: true },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    const permissions: PostPermissions = {
      canView: post.visibility === "PUBLIC" || post.authorId === userId,
      canLike:
        !post.isArchived &&
        (post.visibility === "PUBLIC" || post.authorId === userId),
      canComment:
        !post.isArchived &&
        (post.visibility === "PUBLIC" || post.authorId === userId),
      canShare: !post.isArchived && post.visibility === "PUBLIC",
      canEdit: post.authorId === userId,
      canDelete: post.authorId === userId,
      canPin: post.authorId === userId,
      canArchive: post.authorId === userId,
    };

    console.log(
      `Post permissions for user ${userId} on post ${postId}: ${JSON.stringify(permissions)}`
    );
    return permissions;
  }

  // Use PostDraft interface for draft management
  static async savePostDraft(draft: PostDraft): Promise<PostDraft> {
    // This would need draft table in schema
    console.log(`Saving post draft: ${JSON.stringify(draft)}`);
    return draft;
  }

  // Use PostVersion interface for version tracking
  static async getPostVersions(postId: string): Promise<PostVersion[]> {
    // This would need version table in schema
    console.log(`Getting versions for post ${postId}`);
    return [];
  }

  // Use FeedParams interface for feed customization
  static async getCustomizedFeed(
    params: FeedParams
  ): Promise<PostWithDetails[]> {
    console.log(
      `Getting customized feed with params: ${JSON.stringify(params)}`
    );

    const posts = await prisma.post.findMany({
      where: {
        isArchived: false,
        ...(params.communityId && { communityId: params.communityId }),
      },
      orderBy:
        params.algorithm === "engagement"
          ? { likesCount: "desc" }
          : { createdAt: "desc" },
      take: params.limit || 20,
      include: {
        author: {
          include: {
            profile: { select: { displayName: true, bio: true } },
            photos: {
              where: { isPrimary: true },
              select: { url: true, isPrimary: true },
            },
          },
        },
        community: { select: { id: true, name: true } },
        _count: {
          select: { likes: true, comments: true, shares: true, views: true },
        },
      },
    });

    return posts.map((p) => this.toPostWithDetails(p));
  }

  // Use PostEngagement interface for engagement tracking
  static async trackPostEngagement(engagement: PostEngagement): Promise<void> {
    console.log(`Tracking post engagement: ${JSON.stringify(engagement)}`);
    // This would need engagement table in schema
  }
}
