import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { handleServiceError } from '../utils/error';

export interface BatchOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  resource: string;
  data?: any;
  params?: any;
}

export interface BatchResult {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
}

export interface SyncData {
  lastSync: string;
  updates: {
    communities: any[];
    messages: any[];
    users: any[];
    friendships: any[];
  };
  deletes: {
    messageIds: string[];
    communityIds: string[];
  };
}

export class BatchService {
  /**
   * Execute multiple operations in a single transaction
   */
  static async executeBatch(operations: BatchOperation[]): Promise<BatchResult[]> {
    const results: BatchResult[] = [];

    try {
      await prisma.$transaction(async (tx) => {
        for (const op of operations) {
          try {
            let result;

            switch (op.resource) {
              case 'message':
                result = await this.handleMessageOperation(tx, op);
                break;
              case 'community':
                result = await this.handleCommunityOperation(tx, op);
                break;
              case 'user':
                result = await this.handleUserOperation(tx, op);
                break;
              case 'friendship':
                result = await this.handleFriendshipOperation(tx, op);
                break;
              default:
                throw new Error(`Unsupported resource: ${op.resource}`);
            }

            results.push({
              id: op.id,
              success: true,
              data: result,
            });
          } catch (error: any) {
            results.push({
              id: op.id,
              success: false,
              error: error.message,
            });
          }
        }
      });
    } catch (error: any) {
      logger.error('Batch operation failed:', error);
      return handleServiceError(error) as any;
    }

    return results;
  }

  /**
   * Get data changes since last sync for offline support
   */
  static async getSyncData(userId: string, lastSync: string): Promise<SyncData> {
    const lastSyncDate = new Date(lastSync);

    try {
      // Get user's communities for filtering
      const userCommunities = await prisma.communityMembership.findMany({
        where: { userId },
        select: { communityId: true },
      });

      const communityIds = userCommunities.map(cm => cm.communityId);

      // Get updates since last sync
      const [communities, messages, users, friendships] = await Promise.all([
        // Updated communities
        prisma.community.findMany({
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
        prisma.communityMessage.findMany({
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
          orderBy: { createdAt: 'desc' },
          take: 100, // Limit for mobile performance
        }),

        // Updated user profiles (friends)
        prisma.user.findMany({
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
        prisma.friendship.findMany({
          where: {
            OR: [
              { requesterId: userId },
              { addresseeId: userId },
            ],
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
    } catch (error: any) {
      logger.error('Sync data fetch failed:', error);
      return handleServiceError(error) as any;
    }
  }

  /**
   * Bulk fetch multiple resources by IDs
   */
  static async bulkFetch(requests: { resource: string; ids: string[] }[]): Promise<any> {
    const results: any = {};

    try {
      for (const request of requests) {
        switch (request.resource) {
          case 'users':
            results.users = await prisma.user.findMany({
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

          case 'communities':
            results.communities = await prisma.community.findMany({
              where: { id: { in: request.ids } },
              include: {
                _count: {
                  select: { memberships: true, messages: true },
                },
              },
            });
            break;

          case 'messages':
            results.messages = await prisma.communityMessage.findMany({
              where: { id: { in: request.ids } },
              include: {
                sender: {
                  select: { id: true, profile: { select: { displayName: true } } },
                },
              },
              orderBy: { createdAt: 'desc' },
            });
            break;
        }
      }

      return results;
    } catch (error: any) {
      logger.error('Bulk fetch failed:', error);
      return handleServiceError(error);
    }
  }

  // Helper methods for batch operations
  private static async handleMessageOperation(tx: any, op: BatchOperation): Promise<any> {
    switch (op.operation) {
      case 'create':
        return await tx.communityMessage.create({
          data: op.data,
          include: {
            sender: {
              select: { id: true, profile: { select: { displayName: true } } },
            },
          },
        });
      case 'update':
        return await tx.communityMessage.update({
          where: { id: op.params.id },
          data: op.data,
        });
      case 'delete':
        return await tx.communityMessage.delete({
          where: { id: op.params.id },
        });
      default:
        throw new Error(`Unsupported operation: ${op.operation}`);
    }
  }

  private static async handleCommunityOperation(tx: any, op: BatchOperation): Promise<any> {
    switch (op.operation) {
      case 'create':
        return await tx.community.create({
          data: op.data,
        });
      case 'update':
        return await tx.community.update({
          where: { id: op.params.id },
          data: op.data,
        });
      case 'delete':
        return await tx.community.delete({
          where: { id: op.params.id },
        });
      default:
        throw new Error(`Unsupported operation: ${op.operation}`);
    }
  }

  private static async handleUserOperation(tx: any, op: BatchOperation): Promise<any> {
    switch (op.operation) {
      case 'update':
        return await tx.user.update({
          where: { id: op.params.id },
          data: op.data,
        });
      default:
        throw new Error(`Unsupported operation: ${op.operation}`);
    }
  }

  private static async handleFriendshipOperation(tx: any, op: BatchOperation): Promise<any> {
    switch (op.operation) {
      case 'create':
        return await tx.friendship.create({
          data: op.data,
        });
      case 'update':
        return await tx.friendship.update({
          where: { id: op.params.id },
          data: op.data,
        });
      case 'delete':
        return await tx.friendship.delete({
          where: { id: op.params.id },
        });
      default:
        throw new Error(`Unsupported operation: ${op.operation}`);
    }
  }

  /**
   * Populate cache with frequently accessed data
   */
  static async populateCache(userId: string): Promise<void> {
    try {
      // This method would implement caching logic
      // For now, it's a placeholder for future caching implementation
      logger.info('Cache population requested for user:', userId);
    } catch (error: any) {
      logger.error('Cache population failed:', error);
      return handleServiceError(error) as any;
    }
  }
}
