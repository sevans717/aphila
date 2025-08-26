"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchService = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
const error_1 = require("../utils/error");
class BatchService {
    /**
     * Execute multiple operations in a single transaction
     */
    static async executeBatch(operations) {
        const results = [];
        try {
            await prisma_1.prisma.$transaction(async (tx) => {
                for (const op of operations) {
                    try {
                        let result;
                        switch (op.resource) {
                            case "message":
                                result = await this.handleMessageOperation(tx, op);
                                break;
                            case "community":
                                result = await this.handleCommunityOperation(tx, op);
                                break;
                            case "user":
                                result = await this.handleUserOperation(tx, op);
                                break;
                            case "friendship":
                                result = await this.handleFriendshipOperation(tx, op);
                                break;
                            default: {
                                const err = new Error(`Unsupported resource: ${op.resource}`);
                                logger_1.logger.warn("Unsupported batch resource", {
                                    resource: op.resource,
                                });
                                // Record the failure and continue processing other operations
                                results.push({ id: op.id, success: false, error: err.message });
                                continue;
                            }
                        }
                        results.push({
                            id: op.id,
                            success: true,
                            data: result,
                        });
                    }
                    catch (error) {
                        results.push({
                            id: op.id,
                            success: false,
                            error: error.message,
                        });
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error("Batch operation failed:", error);
            return (0, error_1.handleServiceError)(error);
        }
        return results;
    }
    /**
     * Get data changes since last sync for offline support
     */
    static async getSyncData(userId, lastSync) {
        const lastSyncDate = new Date(lastSync);
        try {
            // Get user's communities for filtering
            const userCommunities = await prisma_1.prisma.communityMembership.findMany({
                where: { userId },
                select: { communityId: true },
            });
            const communityIds = userCommunities.map((cm) => cm.communityId);
            // Get updates since last sync
            const [communities, messages, users, friendships] = await Promise.all([
                // Updated communities
                prisma_1.prisma.community.findMany({
                    where: {
                        id: { in: communityIds },
                        updatedAt: { gt: lastSyncDate },
                    },
                    include: {
                        _count: {
                            select: { memberships: true, messages: true },
                        },
                    },
                }),
                // New messages in user's communities
                prisma_1.prisma.communityMessage.findMany({
                    where: {
                        OR: [
                            {
                                communityId: { in: communityIds },
                                createdAt: { gt: lastSyncDate },
                            },
                            {
                                senderId: userId,
                                createdAt: { gt: lastSyncDate },
                            },
                        ],
                    },
                    include: {
                        sender: {
                            select: { id: true, profile: { select: { displayName: true } } },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    take: 100, // Limit for mobile performance
                }),
                // Updated user profiles (friends)
                prisma_1.prisma.user.findMany({
                    where: {
                        OR: [
                            {
                                friendshipsInitiated: {
                                    some: { addresseeId: userId },
                                },
                            },
                            {
                                friendshipsReceived: {
                                    some: { requesterId: userId },
                                },
                            },
                        ],
                        updatedAt: { gt: lastSyncDate },
                    },
                    select: {
                        id: true,
                        email: true,
                        profile: {
                            select: { displayName: true, bio: true },
                        },
                        updatedAt: true,
                    },
                }),
                // New friendship requests/updates
                prisma_1.prisma.friendship.findMany({
                    where: {
                        OR: [{ requesterId: userId }, { addresseeId: userId }],
                        createdAt: { gt: lastSyncDate },
                    },
                    include: {
                        requester: {
                            select: { id: true, profile: { select: { displayName: true } } },
                        },
                        addressee: {
                            select: { id: true, profile: { select: { displayName: true } } },
                        },
                    },
                }),
            ]);
            // Get deleted items (you'd need to implement soft deletes)
            const deletes = {
                messageIds: [], // Implement soft delete tracking
                communityIds: [], // Implement soft delete tracking
            };
            return {
                lastSync: new Date().toISOString(),
                updates: {
                    communities,
                    messages,
                    users,
                    friendships,
                },
                deletes,
            };
        }
        catch (error) {
            logger_1.logger.error("Sync data fetch failed:", error);
            return (0, error_1.handleServiceError)(error);
        }
    }
    /**
     * Bulk fetch multiple resources by IDs
     */
    static async bulkFetch(requests) {
        const results = {};
        try {
            for (const request of requests) {
                switch (request.resource) {
                    case "users":
                        results.users = await prisma_1.prisma.user.findMany({
                            where: { id: { in: request.ids } },
                            select: {
                                id: true,
                                email: true,
                                profile: {
                                    select: { displayName: true, bio: true },
                                },
                            },
                        });
                        break;
                    case "communities":
                        results.communities = await prisma_1.prisma.community.findMany({
                            where: { id: { in: request.ids } },
                            include: {
                                _count: {
                                    select: { memberships: true, messages: true },
                                },
                            },
                        });
                        break;
                    case "messages":
                        results.messages = await prisma_1.prisma.communityMessage.findMany({
                            where: { id: { in: request.ids } },
                            include: {
                                sender: {
                                    select: {
                                        id: true,
                                        profile: { select: { displayName: true } },
                                    },
                                },
                            },
                            orderBy: { createdAt: "desc" },
                        });
                        break;
                    default:
                        logger_1.logger.warn("Unsupported bulk fetch resource", {
                            resource: request.resource,
                        });
                        break;
                }
            }
            return results;
        }
        catch (error) {
            logger_1.logger.error("Bulk fetch failed:", error);
            return (0, error_1.handleServiceError)(error);
        }
    }
    // Helper methods for batch operations
    static async handleMessageOperation(tx, op) {
        switch (op.operation) {
            case "create":
                return await tx.communityMessage.create({
                    data: op.data,
                    include: {
                        sender: {
                            select: { id: true, profile: { select: { displayName: true } } },
                        },
                    },
                });
            case "update":
                return await tx.communityMessage.update({
                    where: { id: op.params.id },
                    data: op.data,
                });
            case "delete":
                return await tx.communityMessage.delete({
                    where: { id: op.params.id },
                });
            default: {
                const err = new Error(`Unsupported operation: ${op.operation}`);
                logger_1.logger.warn("Unsupported batch operation", { operation: op.operation });
                return (0, error_1.handleServiceError)(err);
            }
        }
    }
    static async handleCommunityOperation(tx, op) {
        switch (op.operation) {
            case "create":
                return await tx.community.create({
                    data: op.data,
                });
            case "update":
                return await tx.community.update({
                    where: { id: op.params.id },
                    data: op.data,
                });
            case "delete":
                return await tx.community.delete({
                    where: { id: op.params.id },
                });
            default: {
                const err = new Error(`Unsupported operation: ${op.operation}`);
                logger_1.logger.warn("Unsupported community operation", {
                    operation: op.operation,
                });
                return (0, error_1.handleServiceError)(err);
            }
        }
    }
    static async handleUserOperation(tx, op) {
        switch (op.operation) {
            case "update":
                return await tx.user.update({
                    where: { id: op.params.id },
                    data: op.data,
                });
            default: {
                const err = new Error(`Unsupported operation: ${op.operation}`);
                logger_1.logger.warn("Unsupported user operation", { operation: op.operation });
                return (0, error_1.handleServiceError)(err);
            }
        }
    }
    static async handleFriendshipOperation(tx, op) {
        switch (op.operation) {
            case "create":
                return await tx.friendship.create({
                    data: op.data,
                });
            case "update":
                return await tx.friendship.update({
                    where: { id: op.params.id },
                    data: op.data,
                });
            case "delete":
                return await tx.friendship.delete({
                    where: { id: op.params.id },
                });
            default: {
                const err = new Error(`Unsupported operation: ${op.operation}`);
                logger_1.logger.warn("Unsupported friendship operation", {
                    operation: op.operation,
                });
                return (0, error_1.handleServiceError)(err);
            }
        }
    }
    /**
     * Populate cache with frequently accessed data
     */
    static async populateCache(userId) {
        try {
            // This method would implement caching logic
            // For now, it's a placeholder for future caching implementation
            logger_1.logger.info("Cache population requested for user:", userId);
        }
        catch (error) {
            logger_1.logger.error("Cache population failed:", error);
            return (0, error_1.handleServiceError)(error);
        }
    }
}
exports.BatchService = BatchService;
//# sourceMappingURL=batch.service.js.map