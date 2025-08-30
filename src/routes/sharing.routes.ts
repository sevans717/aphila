import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const sharePostSchema = z.object({
  platform: z.string().optional(),
  message: z.string().optional(),
  shareType: z
    .enum(["REPOST", "DIRECT", "EXTERNAL", "STORY", "COPY_LINK"])
    .default("REPOST"),
  communityId: z.string().optional(),
});

const shareCommunitySchema = z.object({
  platform: z.string().optional(),
  message: z.string().optional(),
  shareType: z
    .enum(["REPOST", "DIRECT", "EXTERNAL", "STORY", "COPY_LINK"])
    .default("REPOST"),
});

const shareProfileSchema = z.object({
  platform: z.string().optional(),
  message: z.string().optional(),
  shareType: z
    .enum(["REPOST", "DIRECT", "EXTERNAL", "STORY", "COPY_LINK"])
    .default("DIRECT"),
});

// Share post
router.post("/post/:postId", requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = (req as any).user?.userId;
    const validatedData = sharePostSchema.parse(req.body);

    // Verify post exists and user has access
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: true,
        community: true,
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    // Check if post is public or user has access
    if (post.visibility === "PRIVATE" && post.authorId !== userId) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to share this post",
      });
    }

    // Create share record
    const share = await prisma.postShare.create({
      data: {
        userId,
        postId,
        shareType: validatedData.shareType,
        platform: validatedData.platform,
        comment: validatedData.message,
        communityId: validatedData.communityId,
      },
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                id: true,
                profile: {
                  select: {
                    displayName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Update post shares count
    await prisma.post.update({
      where: { id: postId },
      data: {
        sharesCount: {
          increment: 1,
        },
      },
    });

    // Generate share URL
    const shareUrl = `${process.env.FRONTEND_URL || "https://sav3.io"}/share/post/${postId}`;

    res.json({
      success: true,
      data: {
        share,
        shareUrl,
        sharedAt: share.createdAt,
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: "Invalid input data",
        details: error.issues,
      });
    }

    console.error("Share post error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to share post",
    });
  }
});

// Share community
router.post("/community/:communityId", requireAuth, async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = (req as any).user?.userId;
    const validatedData = shareCommunitySchema.parse(req.body);

    // Verify community exists
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        owner: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
        category: true,
      },
    });

    if (!community) {
      return res.status(404).json({
        success: false,
        error: "Community not found",
      });
    }

    // Check if community is private and user is member
    if (community.visibility === "PRIVATE") {
      const membership = await prisma.communityMembership.findUnique({
        where: {
          userId_communityId: {
            userId,
            communityId,
          },
        },
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          error: "You don't have permission to share this community",
        });
      }
    }

    // Create share record (using PostShare for community shares)
    const share = await prisma.postShare.create({
      data: {
        userId,
        postId: communityId, // Using postId field to store community ID for simplicity
        shareType: validatedData.shareType,
        platform: validatedData.platform,
        comment: validatedData.message,
      },
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    });

    // Generate share URL
    const shareUrl = `${process.env.FRONTEND_URL || "https://sav3.io"}/share/community/${communityId}`;

    res.json({
      success: true,
      data: {
        share,
        community: {
          id: community.id,
          name: community.name,
          description: community.description,
          owner: community.owner,
          category: community.category,
        },
        shareUrl,
        sharedAt: share.createdAt,
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: "Invalid input data",
        details: error.issues,
      });
    }

    console.error("Share community error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to share community",
    });
  }
});

// Share profile
router.post("/profile/:userId", requireAuth, async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const userId = (req as any).user?.userId;
    const validatedData = shareProfileSchema.parse(req.body);

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        profile: {
          select: {
            displayName: true,
            bio: true,
            isVisible: true,
          },
        },
        privacySetting: {
          select: {
            searchable: true,
            allowMessagesFrom: true,
          },
        },
      },
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Check privacy settings
    if (!targetUser.privacySetting?.searchable) {
      return res.status(403).json({
        success: false,
        error: "This profile is not shareable",
      });
    }

    // Create share record (using MediaShare for profile shares)
    const share = await prisma.mediaShare.create({
      data: {
        userId,
        mediaId: targetUserId, // Using mediaId field to store user ID for simplicity
        shareType: validatedData.shareType,
        platform: validatedData.platform,
        comment: validatedData.message,
      },
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    });

    // Generate share URL
    const shareUrl = `${process.env.FRONTEND_URL || "https://sav3.io"}/share/profile/${targetUserId}`;

    res.json({
      success: true,
      data: {
        share,
        profile: {
          id: targetUser.id,
          displayName: targetUser.profile?.displayName,
          bio: targetUser.profile?.bio,
        },
        shareUrl,
        sharedAt: share.createdAt,
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: "Invalid input data",
        details: error.issues,
      });
    }

    console.error("Share profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to share profile",
    });
  }
});

// Get share link
router.get("/link/:contentType/:contentId", async (req, res) => {
  try {
    const { contentType, contentId } = req.params;

    let shareUrl: string;
    let content: any = null;

    switch (contentType) {
      case "post":
        content = await prisma.post.findUnique({
          where: { id: contentId },
          select: {
            id: true,
            visibility: true,
            author: {
              select: {
                id: true,
                profile: {
                  select: {
                    displayName: true,
                  },
                },
              },
            },
          },
        });
        if (!content) {
          return res.status(404).json({
            success: false,
            error: "Post not found",
          });
        }
        if (content.visibility === "PRIVATE") {
          return res.status(403).json({
            success: false,
            error: "This content is private",
          });
        }
        shareUrl = `${process.env.FRONTEND_URL || "https://sav3.io"}/share/post/${contentId}`;
        break;

      case "community":
        content = await prisma.community.findUnique({
          where: { id: contentId },
          select: {
            id: true,
            name: true,
            visibility: true,
          },
        });
        if (!content) {
          return res.status(404).json({
            success: false,
            error: "Community not found",
          });
        }
        if (content.visibility === "PRIVATE") {
          return res.status(403).json({
            success: false,
            error: "This community is private",
          });
        }
        shareUrl = `${process.env.FRONTEND_URL || "https://sav3.io"}/share/community/${contentId}`;
        break;

      case "profile":
        content = await prisma.user.findUnique({
          where: { id: contentId },
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                isVisible: true,
              },
            },
            privacySetting: {
              select: {
                searchable: true,
              },
            },
          },
        });
        if (!content) {
          return res.status(404).json({
            success: false,
            error: "User not found",
          });
        }
        if (
          !content.privacySetting?.searchable ||
          !content.profile?.isVisible
        ) {
          return res.status(403).json({
            success: false,
            error: "This profile is not shareable",
          });
        }
        shareUrl = `${process.env.FRONTEND_URL || "https://sav3.io"}/share/profile/${contentId}`;
        break;

      default:
        return res.status(400).json({
          success: false,
          error: "Invalid content type",
        });
    }

    res.json({
      success: true,
      data: {
        contentType,
        contentId,
        shareUrl,
        content,
      },
    });
  } catch (error: any) {
    console.error("Get share link error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate share link",
    });
  }
});

// Get sharing stats
router.get("/stats/:contentType/:contentId", requireAuth, async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const userId = (req as any).user?.userId;

    const stats: any = {
      totalShares: 0,
      sharesByPlatform: {},
      recentShares: [],
    };

    switch (contentType) {
      case "post": {
        // Get post shares
        const postShares = await prisma.postShare.findMany({
          where: { postId: contentId },
          include: {
            user: {
              select: {
                id: true,
                profile: {
                  select: {
                    displayName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        });

        stats.totalShares = postShares.length;
        stats.sharesByPlatform = postShares.reduce((acc: any, share) => {
          const platform = share.platform || "app";
          acc[platform] = (acc[platform] || 0) + 1;
          return acc;
        }, {});
        stats.recentShares = postShares.slice(0, 5);
        break;
      }

      case "community": {
        // Get community shares (stored in PostShare with communityId)
        const communityShares = await prisma.postShare.findMany({
          where: { postId: contentId }, // communityId stored in postId field
          include: {
            user: {
              select: {
                id: true,
                profile: {
                  select: {
                    displayName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        });

        stats.totalShares = communityShares.length;
        stats.sharesByPlatform = communityShares.reduce((acc: any, share) => {
          const platform = share.platform || "app";
          acc[platform] = (acc[platform] || 0) + 1;
          return acc;
        }, {});
        stats.recentShares = communityShares.slice(0, 5);
        break;
      }

      case "profile": {
        // Get profile shares (stored in MediaShare with userId in mediaId field)
        const profileShares = await prisma.mediaShare.findMany({
          where: { mediaId: contentId }, // userId stored in mediaId field
          include: {
            user: {
              select: {
                id: true,
                profile: {
                  select: {
                    displayName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        });

        stats.totalShares = profileShares.length;
        stats.sharesByPlatform = profileShares.reduce((acc: any, share) => {
          const platform = share.platform || "app";
          acc[platform] = (acc[platform] || 0) + 1;
          return acc;
        }, {});
        stats.recentShares = profileShares.slice(0, 5);
        break;
      }

      default:
        return res.status(400).json({
          success: false,
          error: "Invalid content type",
        });
    }

    res.json({
      success: true,
      data: {
        contentType,
        contentId,
        userId,
        stats,
      },
    });
  } catch (error: any) {
    console.error("Get sharing stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get sharing stats",
    });
  }
});

export default router;
