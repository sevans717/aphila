import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";
import { handleServiceError } from "../utils/error";

export class FriendshipService {
  static async sendFriendRequest(requesterId: string, addresseeId: string) {
    // Check if friendship already exists
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });

    if (existing) {
      const err = new Error("Friendship already exists or pending");
      logger.warn("sendFriendRequest duplicate", { requesterId, addresseeId });
      return handleServiceError(err);
    }

    return await prisma.friendship.create({
      data: {
        requesterId,
        addresseeId,
        status: "PENDING",
      },
      include: {
        requester: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
        addressee: {
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
  }

  static async respondToFriendRequest(
    friendshipId: string,
    userId: string,
    accept: boolean
  ) {
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship || friendship.addresseeId !== userId) {
      const err = new Error("Invalid friendship request");
      logger.warn("respondToFriendRequest invalid", { friendshipId, userId });
      return handleServiceError(err);
    }

    return await prisma.friendship.update({
      where: { id: friendshipId },
      data: {
        status: accept ? "ACCEPTED" : "REJECTED",
        respondedAt: new Date(),
      },
      include: {
        requester: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
        addressee: {
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
  }

  static async getFriends(userId: string) {
    return await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, status: "ACCEPTED" },
          { addresseeId: userId, status: "ACCEPTED" },
        ],
      },
      include: {
        requester: {
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
              select: {
                url: true,
              },
            },
          },
        },
        addressee: {
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
              select: {
                url: true,
              },
            },
          },
        },
      },
    });
  }

  static async getPendingRequests(userId: string) {
    return await prisma.friendship.findMany({
      where: {
        addresseeId: userId,
        status: "PENDING",
      },
      include: {
        requester: {
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
              select: {
                url: true,
              },
            },
          },
        },
      },
    });
  }
}
