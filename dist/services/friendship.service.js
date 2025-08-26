"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendshipService = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
const error_1 = require("../utils/error");
class FriendshipService {
    static async sendFriendRequest(requesterId, addresseeId) {
        // Check if friendship already exists
        const existing = await prisma_1.prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId, addresseeId },
                    { requesterId: addresseeId, addresseeId: requesterId },
                ],
            },
        });
        if (existing) {
            const err = new Error("Friendship already exists or pending");
            logger_1.logger.warn("sendFriendRequest duplicate", { requesterId, addresseeId });
            return (0, error_1.handleServiceError)(err);
        }
        return await prisma_1.prisma.friendship.create({
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
    static async respondToFriendRequest(friendshipId, userId, accept) {
        const friendship = await prisma_1.prisma.friendship.findUnique({
            where: { id: friendshipId },
        });
        if (!friendship || friendship.addresseeId !== userId) {
            const err = new Error("Invalid friendship request");
            logger_1.logger.warn("respondToFriendRequest invalid", { friendshipId, userId });
            return (0, error_1.handleServiceError)(err);
        }
        return await prisma_1.prisma.friendship.update({
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
    static async getFriends(userId) {
        return await prisma_1.prisma.friendship.findMany({
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
    static async getPendingRequests(userId) {
        return await prisma_1.prisma.friendship.findMany({
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
exports.FriendshipService = FriendshipService;
//# sourceMappingURL=friendship.service.js.map