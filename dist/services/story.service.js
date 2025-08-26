"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryService = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
class StoryService {
    static async createStory(data) {
        try {
            const { userId, mediaId } = data;
            // Stories expire after 24 hours
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const story = await prisma_1.prisma.story.create({
                data: {
                    userId,
                    mediaId,
                    expiresAt,
                },
                include: {
                    user: {
                        include: {
                            profile: {
                                select: {
                                    displayName: true,
                                }
                            }
                        }
                    },
                    media: {
                        select: {
                            id: true,
                            url: true,
                            type: true,
                        }
                    },
                    _count: {
                        select: {
                            views: true
                        }
                    }
                }
            });
            logger_1.logger.info('Story created', { storyId: story.id, userId, mediaId });
            return {
                id: story.id,
                createdAt: story.createdAt,
                expiresAt: story.expiresAt,
                user: {
                    id: story.user.id,
                    profile: {
                        displayName: story.user.profile.displayName,
                    }
                },
                media: story.media,
                viewsCount: story._count.views
            };
        }
        catch (error) {
            logger_1.logger.error('Error creating story', { error, data });
            throw error;
        }
    }
    static async getActiveStories(userId) {
        try {
            const now = new Date();
            const stories = await prisma_1.prisma.story.findMany({
                where: {
                    expiresAt: {
                        gt: now
                    },
                    ...(userId && { userId })
                },
                include: {
                    user: {
                        include: {
                            profile: {
                                select: {
                                    displayName: true,
                                }
                            }
                        }
                    },
                    media: {
                        select: {
                            id: true,
                            url: true,
                            type: true,
                        }
                    },
                    _count: {
                        select: {
                            views: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            return stories.map(story => ({
                id: story.id,
                createdAt: story.createdAt,
                expiresAt: story.expiresAt,
                user: {
                    id: story.user.id,
                    profile: {
                        displayName: story.user.profile.displayName,
                    }
                },
                media: story.media,
                viewsCount: story._count.views
            }));
        }
        catch (error) {
            logger_1.logger.error('Error getting active stories', { error, userId });
            throw error;
        }
    }
    static async viewStory(storyId, viewerId) {
        try {
            // Check if story exists and is active
            const story = await prisma_1.prisma.story.findUnique({
                where: { id: storyId },
                select: { expiresAt: true, userId: true }
            });
            if (!story) {
                throw new Error('Story not found');
            }
            if (story.expiresAt < new Date()) {
                throw new Error('Story has expired');
            }
            // Don't record views from the story author
            if (story.userId === viewerId) {
                return;
            }
            // Check if user already viewed this story
            const existingView = await prisma_1.prisma.storyView.findUnique({
                where: {
                    storyId_viewerId: {
                        storyId: storyId,
                        viewerId: viewerId
                    }
                }
            });
            if (!existingView) {
                await prisma_1.prisma.storyView.create({
                    data: {
                        storyId: storyId,
                        viewerId: viewerId,
                    }
                });
                logger_1.logger.info('Story viewed', { storyId, viewerId });
            }
        }
        catch (error) {
            logger_1.logger.error('Error viewing story', { error, storyId, viewerId });
            throw error;
        }
    }
    static async deleteStory(storyId, userId) {
        try {
            const story = await prisma_1.prisma.story.findUnique({
                where: { id: storyId },
                select: { userId: true }
            });
            if (!story) {
                throw new Error('Story not found');
            }
            if (story.userId !== userId) {
                throw new Error('Unauthorized to delete this story');
            }
            await prisma_1.prisma.story.delete({
                where: { id: storyId }
            });
            logger_1.logger.info('Story deleted', { storyId, userId });
        }
        catch (error) {
            logger_1.logger.error('Error deleting story', { error, storyId, userId });
            throw error;
        }
    }
    static async getStoryById(storyId, viewerId) {
        try {
            const story = await prisma_1.prisma.story.findUnique({
                where: { id: storyId },
                include: {
                    user: {
                        include: {
                            profile: {
                                select: {
                                    displayName: true,
                                }
                            }
                        }
                    },
                    media: {
                        select: {
                            id: true,
                            url: true,
                            type: true,
                        }
                    },
                    _count: {
                        select: {
                            views: true
                        }
                    }
                }
            });
            if (!story) {
                return null;
            }
            // Check if story is still active
            if (story.expiresAt < new Date()) {
                return null;
            }
            return {
                id: story.id,
                createdAt: story.createdAt,
                expiresAt: story.expiresAt,
                user: {
                    id: story.user.id,
                    profile: {
                        displayName: story.user.profile.displayName,
                    }
                },
                media: story.media,
                viewsCount: story._count.views
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting story by id', { error, storyId, viewerId });
            throw error;
        }
    }
    static async updateStorySettings(storyId, userId, data) {
        try {
            const story = await prisma_1.prisma.story.findUnique({
                where: { id: storyId },
                select: { userId: true }
            });
            if (!story) {
                throw new Error('Story not found');
            }
            if (story.userId !== userId) {
                throw new Error('Unauthorized to update this story');
            }
            const updatedStory = await prisma_1.prisma.story.update({
                where: { id: storyId },
                data: data,
                include: {
                    user: {
                        include: {
                            profile: {
                                select: {
                                    displayName: true,
                                }
                            }
                        }
                    },
                    media: {
                        select: {
                            id: true,
                            url: true,
                            type: true,
                        }
                    },
                    _count: {
                        select: {
                            views: true
                        }
                    }
                }
            });
            return {
                id: updatedStory.id,
                createdAt: updatedStory.createdAt,
                expiresAt: updatedStory.expiresAt,
                user: {
                    id: updatedStory.user.id,
                    profile: {
                        displayName: updatedStory.user.profile.displayName,
                    }
                },
                media: updatedStory.media,
                viewsCount: updatedStory._count.views
            };
        }
        catch (error) {
            logger_1.logger.error('Error updating story settings', { error, storyId, userId });
            throw error;
        }
    }
    static async getStoriesFeed(userId, limit = 20, offset = 0) {
        try {
            const now = new Date();
            const [stories, total] = await Promise.all([
                prisma_1.prisma.story.findMany({
                    where: {
                        expiresAt: {
                            gt: now
                        }
                    },
                    include: {
                        user: {
                            include: {
                                profile: {
                                    select: {
                                        displayName: true,
                                    }
                                }
                            }
                        },
                        media: {
                            select: {
                                id: true,
                                url: true,
                                type: true,
                            }
                        },
                        _count: {
                            select: {
                                views: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: offset,
                    take: limit
                }),
                prisma_1.prisma.story.count({
                    where: {
                        expiresAt: {
                            gt: now
                        }
                    }
                })
            ]);
            return {
                stories: stories.map(story => ({
                    id: story.id,
                    createdAt: story.createdAt,
                    expiresAt: story.expiresAt,
                    user: {
                        id: story.user.id,
                        profile: {
                            displayName: story.user.profile.displayName,
                        }
                    },
                    media: story.media,
                    viewsCount: story._count.views
                })),
                total
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting stories feed', { error, userId });
            throw error;
        }
    }
    static async getUserStories(targetUserId, viewerId, includeExpired = false) {
        try {
            const where = {
                userId: targetUserId
            };
            if (!includeExpired) {
                where.expiresAt = {
                    gt: new Date()
                };
            }
            const [stories, total] = await Promise.all([
                prisma_1.prisma.story.findMany({
                    where,
                    include: {
                        user: {
                            include: {
                                profile: {
                                    select: {
                                        displayName: true,
                                    }
                                }
                            }
                        },
                        media: {
                            select: {
                                id: true,
                                url: true,
                                type: true,
                            }
                        },
                        _count: {
                            select: {
                                views: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }),
                prisma_1.prisma.story.count({
                    where
                })
            ]);
            return {
                stories: stories.map(story => ({
                    id: story.id,
                    createdAt: story.createdAt,
                    expiresAt: story.expiresAt,
                    user: {
                        id: story.user.id,
                        profile: {
                            displayName: story.user.profile.displayName,
                        }
                    },
                    media: story.media,
                    viewsCount: story._count.views
                })),
                total
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting user stories', { error, targetUserId, viewerId });
            throw error;
        }
    }
    static async trackView(storyId, viewerId) {
        try {
            await this.viewStory(storyId, viewerId);
        }
        catch (error) {
            logger_1.logger.error('Error tracking story view', { error, storyId, viewerId });
            throw error;
        }
    }
    static async getStoryViewers(storyId, ownerId, limit = 50, offset = 0) {
        try {
            // Verify story ownership
            const story = await prisma_1.prisma.story.findUnique({
                where: { id: storyId },
                select: { userId: true }
            });
            if (!story) {
                throw new Error('Story not found');
            }
            if (story.userId !== ownerId) {
                throw new Error('Unauthorized to view story viewers');
            }
            const [viewers, total] = await Promise.all([
                prisma_1.prisma.storyView.findMany({
                    where: { storyId },
                    include: {
                        viewer: {
                            include: {
                                profile: {
                                    select: {
                                        displayName: true,
                                    }
                                },
                                photos: {
                                    where: { isPrimary: true },
                                    select: {
                                        url: true,
                                        isPrimary: true,
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { viewedAt: 'desc' },
                    skip: offset,
                    take: limit
                }),
                prisma_1.prisma.storyView.count({
                    where: { storyId }
                })
            ]);
            return {
                viewers: viewers.map(view => ({
                    id: view.id,
                    user: {
                        id: view.viewer.id,
                        profile: {
                            displayName: view.viewer.profile.displayName,
                        },
                        photos: view.viewer.photos,
                    },
                    viewedAt: view.viewedAt,
                })),
                total
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting story viewers', { error, storyId, ownerId });
            throw error;
        }
    }
    static async getStoryStats(storyId, userId) {
        try {
            // Verify story ownership
            const story = await prisma_1.prisma.story.findUnique({
                where: { id: storyId },
                select: { userId: true }
            });
            if (!story) {
                throw new Error('Story not found');
            }
            if (story.userId !== userId) {
                throw new Error('Unauthorized to view story stats');
            }
            const [viewsCount, topViewers] = await Promise.all([
                prisma_1.prisma.storyView.count({
                    where: { storyId }
                }),
                prisma_1.prisma.storyView.findMany({
                    where: { storyId },
                    include: {
                        viewer: {
                            include: {
                                profile: {
                                    select: {
                                        displayName: true,
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { viewedAt: 'asc' },
                    take: 10
                })
            ]);
            return {
                viewsCount,
                reachCount: viewsCount, // For now, reach = views
                engagementRate: 0, // Would need to calculate based on interactions
                topViewers: topViewers.map(view => ({
                    user: {
                        id: view.viewer.id,
                        profile: {
                            displayName: view.viewer.profile.displayName,
                        }
                    },
                    viewedAt: view.viewedAt,
                }))
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting story stats', { error, storyId, userId });
            throw error;
        }
    }
    static async cleanupExpiredStories() {
        try {
            const now = new Date();
            const result = await prisma_1.prisma.story.deleteMany({
                where: {
                    expiresAt: {
                        lt: now
                    }
                }
            });
            logger_1.logger.info('Expired stories cleaned up', { deletedCount: result.count });
            return { deletedCount: result.count };
        }
        catch (error) {
            logger_1.logger.error('Error cleaning up expired stories', { error });
            throw error;
        }
    }
}
exports.StoryService = StoryService;
//# sourceMappingURL=story.service.js.map