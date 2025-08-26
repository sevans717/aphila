import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";
import { handleServiceError } from "../utils/error";

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
  reactionType:
    | "like"
    | "love"
    | "laugh"
    | "angry"
    | "sad"
    | "wow"
    | "fire"
    | "heart"
    | "thumbsup"
    | "thumbsdown";
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

export class SocialService {
  static async createComment(
    userId: string,
    data: CreateCommentData
  ): Promise<CommentWithDetails> {
    try {
      const { postId, content, parentId, mediaUrl } = data;

      const comment = await prisma.postComment.create({
        data: {
          userId,
          postId,
          content,
          parentId,
          mediaUrl,
        },
        include: {
          user: {
            include: {
              profile: {
                select: {
                  displayName: true,
                  bio: true,
                },
              },
              photos: {
                where: { isPrimary: true },
                select: {
                  url: true,
                  isPrimary: true,
                },
              },
            },
          },
        },
      });

      logger.info("Comment created", { commentId: comment.id, userId, postId });

      return {
        id: comment.id,
        author: {
          id: comment.user.id,
          profile: {
            displayName: comment.user.profile!.displayName,
            bio: comment.user.profile!.bio || undefined,
          },
          photos: comment.user.photos,
        },
        content: comment.content,
        likesCount: comment.likesCount,
        repliesCount: comment.repliesCount,
        isEdited: comment.isEdited,
        editedAt: comment.editedAt || undefined,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        isLiked: false,
        userLikeType: undefined,
      };
    } catch (error) {
      logger.error("Error creating comment", { error, userId, data });
      return handleServiceError(error);
    }
  }

  static async toggleCommentLike(
    commentId: string,
    userId: string
  ): Promise<{ isLiked: boolean; likesCount: number }> {
    try {
      const existingLike = await prisma.commentLike.findUnique({
        where: {
          userId_commentId: {
            userId,
            commentId,
          },
        },
      });

      let isLiked: boolean;
      let likesCount: number;

      if (existingLike) {
        await prisma.commentLike.delete({
          where: {
            userId_commentId: {
              userId,
              commentId,
            },
          },
        });

        const updatedComment = await prisma.postComment.update({
          where: { id: commentId },
          data: {
            likesCount: {
              decrement: 1,
            },
          },
          select: { likesCount: true },
        });

        isLiked = false;
        likesCount = updatedComment.likesCount;
      } else {
        await prisma.commentLike.create({
          data: {
            userId,
            commentId,
          },
        });

        const updatedComment = await prisma.postComment.update({
          where: { id: commentId },
          data: {
            likesCount: {
              increment: 1,
            },
          },
          select: { likesCount: true },
        });

        isLiked = true;
        likesCount = updatedComment.likesCount;
      }

      return { isLiked, likesCount };
    } catch (error) {
      logger.error("Error toggling comment like", { error, commentId, userId });
      return handleServiceError(error);
    }
  }

  static async getPostComments(
    postId: string,
    viewerId?: string,
    limit: number = 20
  ): Promise<CommentWithDetails[]> {
    try {
      const comments = await prisma.postComment.findMany({
        where: {
          postId,
          parentId: null,
        },
        include: {
          user: {
            include: {
              profile: {
                select: {
                  displayName: true,
                  bio: true,
                },
              },
              photos: {
                where: { isPrimary: true },
                select: {
                  url: true,
                  isPrimary: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return comments.map((comment) => ({
        id: comment.id,
        author: {
          id: comment.user.id,
          profile: {
            displayName: comment.user.profile!.displayName,
            bio: comment.user.profile!.bio || undefined,
          },
          photos: comment.user.photos,
        },
        content: comment.content,
        likesCount: comment.likesCount,
        repliesCount: comment.repliesCount,
        isEdited: comment.isEdited,
        editedAt: comment.editedAt || undefined,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        isLiked: false,
        userLikeType: undefined,
      }));
    } catch (error) {
      logger.error("Error getting post comments", { error, postId, viewerId });
      return handleServiceError(error);
    }
  }

  static async getPostLikesBreakdown(postId: string): Promise<{
    totalLikes: number;
    likeBreakdown: Record<string, number>;
  }> {
    try {
      const [post, likesBreakdown] = await Promise.all([
        prisma.post.findUnique({
          where: { id: postId },
          select: { likesCount: true },
        }),
        prisma.postLike.groupBy({
          by: ["type"],
          where: { postId },
          _count: { type: true },
        }),
      ]);

      if (!post) {
        const err = new Error("Post not found");
        logger.warn("getPostLikesBreakdown called for missing post", {
          postId,
        });
        return handleServiceError(err);
      }

      const likeBreakdown: Record<string, number> = {};
      likesBreakdown.forEach((item) => {
        likeBreakdown[item.type] = item._count.type;
      });

      return {
        totalLikes: post.likesCount,
        likeBreakdown,
      };
    } catch (error) {
      logger.error("Error getting post likes breakdown", { error, postId });
      return handleServiceError(error);
    }
  }

  static async togglePostLike(
    postId: string,
    userId: string,
    type: string = "LIKE"
  ): Promise<{ isLiked: boolean; likesCount: number }> {
    try {
      const existingLike = await prisma.postLike.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      let isLiked: boolean;
      let likesCount: number;

      if (existingLike) {
        await prisma.postLike.delete({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
        });

        const updatedPost = await prisma.post.update({
          where: { id: postId },
          data: {
            likesCount: {
              decrement: 1,
            },
          },
          select: { likesCount: true },
        });

        isLiked = false;
        likesCount = updatedPost.likesCount;
      } else {
        await prisma.postLike.create({
          data: {
            userId,
            postId,
            type: type as any,
          },
        });

        const updatedPost = await prisma.post.update({
          where: { id: postId },
          data: {
            likesCount: {
              increment: 1,
            },
          },
          select: { likesCount: true },
        });

        isLiked = true;
        likesCount = updatedPost.likesCount;
      }

      return { isLiked, likesCount };
    } catch (error) {
      logger.error("Error toggling post like", { error, postId, userId });
      return handleServiceError(error);
    }
  }

  static async getPostLikes(
    postId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
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
  }> {
    try {
      const [likes, total] = await Promise.all([
        prisma.postLike.findMany({
          where: { postId },
          include: {
            user: {
              include: {
                profile: {
                  select: {
                    displayName: true,
                  },
                },
                photos: {
                  where: { isPrimary: true },
                  select: {
                    url: true,
                    isPrimary: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
        }),
        prisma.postLike.count({
          where: { postId },
        }),
      ]);

      return {
        likes: likes.map((like) => ({
          id: like.id,
          type: like.type,
          user: {
            id: like.user.id,
            profile: {
              displayName: like.user.profile!.displayName,
            },
            photos: like.user.photos,
          },
          createdAt: like.createdAt,
        })),
        total,
      };
    } catch (error) {
      logger.error("Error getting post likes", { error, postId });
      return handleServiceError(error);
    }
  }

  static async updateComment(
    commentId: string,
    authorId: string,
    data: { content: string }
  ): Promise<CommentWithDetails> {
    try {
      const comment = await prisma.postComment.update({
        where: {
          id: commentId,
          userId: authorId,
        },
        data: {
          content: data.content,
          isEdited: true,
          editedAt: new Date(),
        },
        include: {
          user: {
            include: {
              profile: {
                select: {
                  displayName: true,
                  bio: true,
                },
              },
              photos: {
                where: { isPrimary: true },
                select: {
                  url: true,
                  isPrimary: true,
                },
              },
            },
          },
        },
      });

      return {
        id: comment.id,
        author: {
          id: comment.user.id,
          profile: {
            displayName: comment.user.profile!.displayName,
            bio: comment.user.profile!.bio || undefined,
          },
          photos: comment.user.photos,
        },
        content: comment.content,
        likesCount: comment.likesCount,
        repliesCount: comment.repliesCount,
        isEdited: comment.isEdited,
        editedAt: comment.editedAt || undefined,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        isLiked: false,
        userLikeType: undefined,
      };
    } catch (error) {
      logger.error("Error updating comment", { error, commentId, authorId });
      return handleServiceError(error);
    }
  }

  static async deleteComment(
    commentId: string,
    authorId: string
  ): Promise<void> {
    try {
      await prisma.postComment.delete({
        where: {
          id: commentId,
          userId: authorId,
        },
      });

      logger.info("Comment deleted", { commentId, authorId });
    } catch (error) {
      logger.error("Error deleting comment", { error, commentId, authorId });
      return handleServiceError(error);
    }
  }

  static async getCommentReplies(
    commentId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{
    replies: CommentWithDetails[];
    total: number;
  }> {
    try {
      const [replies, total] = await Promise.all([
        prisma.postComment.findMany({
          where: {
            parentId: commentId,
          },
          include: {
            user: {
              include: {
                profile: {
                  select: {
                    displayName: true,
                    bio: true,
                  },
                },
                photos: {
                  where: { isPrimary: true },
                  select: {
                    url: true,
                    isPrimary: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
          skip: offset,
          take: limit,
        }),
        prisma.postComment.count({
          where: {
            parentId: commentId,
          },
        }),
      ]);

      return {
        replies: replies.map((reply) => ({
          id: reply.id,
          author: {
            id: reply.user.id,
            profile: {
              displayName: reply.user.profile!.displayName,
              bio: reply.user.profile!.bio || undefined,
            },
            photos: reply.user.photos,
          },
          content: reply.content,
          likesCount: reply.likesCount,
          repliesCount: reply.repliesCount,
          isEdited: reply.isEdited,
          editedAt: reply.editedAt || undefined,
          createdAt: reply.createdAt,
          updatedAt: reply.updatedAt,
          isLiked: false,
          userLikeType: undefined,
        })),
        total,
      };
    } catch (error) {
      logger.error("Error getting comment replies", { error, commentId });
      return handleServiceError(error);
    }
  }

  static async getPostStats(postId: string): Promise<{
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    viewsCount: number;
    likeBreakdown: Record<string, number>;
  }> {
    try {
      const [post, likesBreakdown] = await Promise.all([
        prisma.post.findUnique({
          where: { id: postId },
          select: {
            likesCount: true,
            commentsCount: true,
            sharesCount: true,
            viewsCount: true,
          },
        }),
        prisma.postLike.groupBy({
          by: ["type"],
          where: { postId },
          _count: { type: true },
        }),
      ]);

      if (!post) {
        const err = new Error("Post not found");
        logger.warn("getPostStats called for missing post", { postId });
        return handleServiceError(err);
      }

      const likeBreakdown: Record<string, number> = {};
      likesBreakdown.forEach((item) => {
        likeBreakdown[item.type] = item._count.type;
      });

      return {
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        sharesCount: post.sharesCount,
        viewsCount: post.viewsCount,
        likeBreakdown,
      };
    } catch (error) {
      logger.error("Error getting post stats", { error, postId });
      return handleServiceError(error);
    }
  }
}
