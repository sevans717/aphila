import { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";
import { handleServiceError } from "../utils/error";

interface DiscoveryFilters {
  userId: string;
  latitude?: number;
  longitude?: number;
  maxDistance?: number;
  minAge?: number;
  maxAge?: number;
  orientation?: string;
  interests?: string[];
  limit?: number;
}

interface SwipeAction {
  swiperId: string;
  swipedId: string;
  isLike: boolean;
  isSuper?: boolean;
}

export class DiscoveryService {
  // Calculate distance between two points using Haversine formula
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Get users for discovery with smart filtering
  static async discoverUsers(filters: DiscoveryFilters) {
    const {
      userId,
      latitude,
      longitude,
      maxDistance = 50,
      minAge = 18,
      maxAge = 65,
      orientation,
      interests = [],
      limit = 20,
    } = filters;

    // Get user's own profile for filtering logic
    const userProfile = await prisma.profile.findUnique({
      where: { userId },
      include: { user: { include: { interests: true } } },
    });

    if (!userProfile) {
      const err = new Error("User profile not found");
      logger.warn("discoverUsers missing profile", { userId });
      return handleServiceError(err);
    }

    // Get users who have already been liked/passed/blocked
    const [likedUsers, blockedUsers] = await Promise.all([
      prisma.like.findMany({
        where: { likerId: userId },
        select: { likedId: true },
      }),
      prisma.block.findMany({
        where: {
          OR: [{ blockerId: userId }, { blockedId: userId }],
        },
        select: { blockerId: true, blockedId: true },
      }),
    ]);

    const excludedUserIds = [
      userId,
      ...likedUsers.map((l: { likedId: string }) => l.likedId),
      ...blockedUsers.map((b: { blockerId: string; blockedId: string }) =>
        b.blockerId === userId ? b.blockedId : b.blockerId
      ),
    ];

    // Calculate age range from birthdate
    const now = new Date();
    const minBirthDate = new Date(
      now.getFullYear() - maxAge,
      now.getMonth(),
      now.getDate()
    );
    const maxBirthDate = new Date(
      now.getFullYear() - minAge,
      now.getMonth(),
      now.getDate()
    );

    // Build where clause for discovery
    const whereClause: any = {
      userId: { notIn: excludedUserIds },
      isVisible: true,
      user: { isActive: true },
      birthdate: {
        gte: minBirthDate,
        lte: maxBirthDate,
      },
    };

    // Add orientation filtering
    if (orientation) {
      whereClause.orientation = orientation;
    }

    // Get potential matches
    let potentialMatches = await prisma.profile.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            interests: true,
            photos: {
              where: { isPrimary: true },
              take: 1,
            },
            _count: {
              select: {
                receivedLikes: true,
                photos: true,
              },
            },
          },
        },
      },
      take: limit * 3, // Get more to filter by distance/interests
    });

    // Filter by distance if location provided
    if (latitude && longitude) {
      potentialMatches = potentialMatches.filter((match: any) => {
        if (!match.latitude || !match.longitude) return false;
        const distance = this.calculateDistance(
          latitude,
          longitude,
          match.latitude,
          match.longitude
        );
        return distance <= maxDistance;
      });
    }

    // Score and sort matches
    const scoredMatches = potentialMatches
      .map((match: any) => {
        let score = 0;

        // Interest compatibility (0-100 points)
        const userInterestIds = userProfile.user.interests.map(
          (i: any) => i.id
        );
        const matchInterestIds = match.user.interests.map((i: any) => i.id);
        const commonInterests = userInterestIds.filter((id: string) =>
          matchInterestIds.includes(id)
        );
        score +=
          (commonInterests.length / Math.max(userInterestIds.length, 1)) * 100;

        // Distance bonus (0-50 points, closer = better)
        if (latitude && longitude && match.latitude && match.longitude) {
          const distance = this.calculateDistance(
            latitude,
            longitude,
            match.latitude,
            match.longitude
          );
          score += Math.max(0, 50 - distance);
        }

        // Profile completeness (0-30 points)
        if (match.bio) score += 10;
        if (match.user.photos.length > 0) score += 10;
        if (match.user.interests.length > 0) score += 10;

        // Popularity adjustment (0-20 points, but not too popular)
        const likesCount = match.user._count.receivedLikes;
        if (likesCount > 0 && likesCount < 50) score += 20;
        else if (likesCount >= 50 && likesCount < 100) score += 10;

        return { ...match, compatibilityScore: Math.round(score) };
      })
      .sort((a: any, b: any) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, limit);

    return scoredMatches;
  }

  // Handle swipe actions
  static async handleSwipe(action: SwipeAction) {
    const { swiperId, swipedId, isLike, isSuper = false } = action;

    if (!isLike) {
      // For passes, we just record that they've been shown (no DB record needed)
      return { type: "pass", message: "User passed" };
    }

    // Create like record
    const like = await prisma.like.create({
      data: {
        likerId: swiperId,
        likedId: swipedId,
        isSuper,
      },
    });

    // Check if there's a mutual like (match)
    const mutualLike = await prisma.like.findFirst({
      where: {
        likerId: swipedId,
        likedId: swiperId,
      },
    });

    if (mutualLike) {
      // Create match
      const match = await prisma.match.create({
        data: {
          initiatorId: swiperId,
          receiverId: swipedId,
          status: "ACTIVE",
        },
        include: {
          initiator: {
            select: {
              profile: {
                select: { displayName: true },
              },
            },
          },
          receiver: {
            select: {
              profile: {
                select: { displayName: true },
              },
            },
          },
        },
      });

      // Create notifications for both users
      await prisma.notification.createMany({
        data: [
          {
            userId: swiperId,
            type: "match",
            title: "New Match! 🎉",
            body: `You matched with ${match.receiver.profile?.displayName}!`,
            data: { matchId: match.id, userId: swipedId },
          },
          {
            userId: swipedId,
            type: "match",
            title: "New Match! 🎉",
            body: `You matched with ${match.initiator.profile?.displayName}!`,
            data: { matchId: match.id, userId: swiperId },
          },
        ],
      });

      return {
        type: "match",
        message: "It's a match!",
        match,
        isSuper,
      };
    }

    // Create notification for like (if not super like, keep it low-key)
    if (isSuper) {
      await prisma.notification.create({
        data: {
          userId: swipedId,
          type: "super_like",
          title: "Someone Super Liked You! ⭐",
          body: "Someone really likes your profile!",
          data: { likeId: like.id, userId: swiperId },
        },
      });
    }

    return {
      type: "like",
      message: isSuper ? "Super like sent!" : "Like sent!",
      like,
      isSuper,
    };
  }

  // Get user's matches
  static async getUserMatches(userId: string) {
    return await prisma.match.findMany({
      where: {
        OR: [{ initiatorId: userId }, { receiverId: userId }],
        status: "ACTIVE",
      },
      include: {
        initiator: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                bio: true,
              },
            },
            photos: {
              where: { isPrimary: true },
              select: { url: true },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                bio: true,
              },
            },
            photos: {
              where: { isPrimary: true },
              select: { url: true },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  // Get likes received by user
  static async getReceivedLikes(userId: string) {
    return await prisma.like.findMany({
      where: { likedId: userId },
      include: {
        liker: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                bio: true,
              },
            },
            photos: {
              where: { isPrimary: true },
              select: { url: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
