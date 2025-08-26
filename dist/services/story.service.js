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
                                },
                            },
                        },
                    },
                    media: {
                        select: {
                            id: true,
                            url: true,
                            type: true,
                        },
                    },
                    _count: {
                        select: {
                            views: true,
                        },
                    },
                },
            });
            logger_1.logger.info("Story created", { storyId: story.id, userId, mediaId });
            return {
                id: story.id,
                createdAt: story.createdAt,
                expiresAt: story.expiresAt,
                user: {
                    id: story.user.id,
                    profile: {
                        displayName: story.user.profile.displayName,
                    },
                },
                media: story.media,
                viewsCount: story._count.views,
            };
        }
        catch (error) {
            logger_1.logger.error("Error creating story", { error, data });
            throw error;
        }
    }
    static async getActiveStories(userId) {
        try {
            const now = new Date();
            const stories = await prisma_1.prisma.story.findMany({
                where: {
                    expiresAt: {
                        gt: now,
                    },
                    ...(userId && { userId }),
                },
                include: {
                    user: {
                        include: {
                            profile: {
                                select: {
                                    displayName: true,
                                },
                            },
                        },
                    },
                    media: {
                        select: {
                            id: true,
                            url: true,
                            type: true,
                        },
                    },
                    _count: {
                        select: {
                            views: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            });
            return stories.map((story) => ({
                id: story.id,
                createdAt: story.createdAt,
                expiresAt: story.expiresAt,
                user: {
                    id: story.user.id,
                    profile: {
                        displayName: story.user.profile.displayName,
                    },
                },
                media: story.media,
                viewsCount: story._count.views,
            }));
        }
        catch (error) {
            logger_1.logger.error("Error getting active stories", { error, userId });
            throw error;
        }
    }
    static async viewStory(storyId, viewerId) {
        try {
            // Check if story exists and is active
            const story = await prisma_1.prisma.story.findUnique({
                where: { id: storyId },
                select: { expiresAt: true, userId: true },
            });
            if (!story) {
                throw new Error("Story not found");
            }
            if (story.expiresAt < new Date()) {
                throw new Error("Story has expired");
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
                        viewerId: viewerId,
                    },
                },
            });
            if (!existingView) {
                await prisma_1.prisma.storyView.create({
                    data: {
                        storyId: storyId,
                        viewerId: viewerId,
                    },
                });
                logger_1.logger.info("Story viewed", { storyId, viewerId });
            }
        }
        catch (error) {
            logger_1.logger.error("Error viewing story", { error, storyId, viewerId });
            throw error;
        }
    }
    static async deleteStory(storyId, userId) {
        try {
            const story = await prisma_1.prisma.story.findUnique({
                where: { id: storyId },
                select: { userId: true },
            });
            if (!story) {
                throw new Error("Story not found");
            }
            if (story.userId !== userId) {
                throw new Error("Unauthorized to delete this story");
            }
            await prisma_1.prisma.story.delete({
                where: { id: storyId },
            });
            logger_1.logger.info("Story deleted", { storyId, userId });
        }
        catch (error) {
            logger_1.logger.error("Error deleting story", { error, storyId, userId });
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
                                },
                            },
                        },
                    },
                    media: {
                        select: {
                            id: true,
                            url: true,
                            type: true,
                        },
                    },
                    _count: {
                        select: {
                            views: true,
                        },
                    },
                },
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
                    },
                },
                media: story.media,
                viewsCount: story._count.views,
            };
        }
        catch (error) {
            logger_1.logger.error("Error getting story by id", { error, storyId, viewerId });
            throw error;
        }
    }
    static async updateStorySettings(storyId, userId, data) {
        try {
            const story = await prisma_1.prisma.story.findUnique({
                where: { id: storyId },
                select: { userId: true },
            });
            if (!story) {
                throw new Error("Story not found");
            }
            if (story.userId !== userId) {
                throw new Error("Unauthorized to update this story");
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
                                },
                            },
                        },
                    },
                    media: {
                        select: {
                            id: true,
                            url: true,
                            type: true,
                        },
                    },
                    _count: {
                        select: {
                            views: true,
                        },
                    },
                },
            });
            return {
                id: updatedStory.id,
                createdAt: updatedStory.createdAt,
                expiresAt: updatedStory.expiresAt,
                user: {
                    id: updatedStory.user.id,
                    profile: {
                        displayName: updatedStory.user.profile.displayName,
                    },
                },
                media: updatedStory.media,
                viewsCount: updatedStory._count.views,
            };
        }
        catch (error) {
            logger_1.logger.error("Error updating story settings", { error, storyId, userId });
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
                            gt: now,
                        },
                    },
                    include: {
                        user: {
                            include: {
                                profile: {
                                    select: {
                                        displayName: true,
                                    },
                                },
                            },
                        },
                        media: {
                            select: {
                                id: true,
                                url: true,
                                type: true,
                            },
                        },
                        _count: {
                            select: {
                                views: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    skip: offset,
                    take: limit,
                }),
                prisma_1.prisma.story.count({
                    where: {
                        expiresAt: {
                            gt: now,
                        },
                    },
                }),
            ]);
            return {
                stories: stories.map((story) => ({
                    id: story.id,
                    createdAt: story.createdAt,
                    expiresAt: story.expiresAt,
                    user: {
                        id: story.user.id,
                        profile: {
                            displayName: story.user.profile.displayName,
                        },
                    },
                    media: story.media,
                    viewsCount: story._count?.views ?? 0,
                })),
                total,
            };
        }
        catch (error) {
            logger_1.logger.error("Error getting stories feed", { error, userId });
            throw error;
        }
    }
    static async getUserStories(targetUserId, viewerId, includeExpired = false) {
        try {
            const where = {
                userId: targetUserId,
            };
            if (!includeExpired) {
                where.expiresAt = {
                    gt: new Date(),
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
                                    },
                                },
                            },
                        },
                        media: {
                            select: {
                                id: true,
                                url: true,
                                type: true,
                            },
                        },
                        _count: {
                            select: {
                                views: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                }),
                prisma_1.prisma.story.count({
                    where,
                }),
            ]);
            return {
                stories: stories.map((story) => ({
                    id: story.id,
                    createdAt: story.createdAt,
                    expiresAt: story.expiresAt,
                    user: {
                        id: story.user.id,
                        profile: {
                            displayName: story.user.profile.displayName,
                        },
                    },
                    media: story.media,
                    viewsCount: story._count?.views ?? 0,
                })),
                total,
            };
        }
        catch (error) {
            logger_1.logger.error("Error getting user stories", {
                error,
                targetUserId,
                viewerId,
            });
            throw error;
        }
    }
    static async trackView(storyId, viewerId) {
        try {
            await this.viewStory(storyId, viewerId);
        }
        catch (error) {
            logger_1.logger.error("Error tracking story view", { error, storyId, viewerId });
            throw error;
        }
    }
    static async getStoryViewers(storyId, ownerId, limit = 50, offset = 0) {
        try {
            // Verify story ownership
            const story = await prisma_1.prisma.story.findUnique({
                where: { id: storyId },
                select: { userId: true },
            });
            if (!story) {
                throw new Error("Story not found");
            }
            if (story.userId !== ownerId) {
                throw new Error("Unauthorized to view story viewers");
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
                    orderBy: { viewedAt: "desc" },
                    skip: offset,
                    take: limit,
                }),
                prisma_1.prisma.storyView.count({
                    where: { storyId },
                }),
            ]);
            return {
                viewers: viewers.map((view) => ({
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
                total,
            };
        }
        catch (error) {
            logger_1.logger.error("Error getting story viewers", { error, storyId, ownerId });
            throw error;
        }
    }
    static async getStoryStats(storyId, userId) {
        try {
            // Verify story ownership
            const story = await prisma_1.prisma.story.findUnique({
                where: { id: storyId },
                select: { userId: true },
            });
            if (!story) {
                throw new Error("Story not found");
            }
            if (story.userId !== userId) {
                throw new Error("Unauthorized to view story stats");
            }
            const [viewsCount, topViewers] = await Promise.all([
                prisma_1.prisma.storyView.count({
                    where: { storyId },
                }),
                prisma_1.prisma.storyView.findMany({
                    where: { storyId },
                    include: {
                        viewer: {
                            include: {
                                profile: {
                                    select: {
                                        displayName: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { viewedAt: "asc" },
                    take: 10,
                }),
            ]);
            return {
                viewsCount,
                reachCount: viewsCount, // For now, reach = views
                engagementRate: 0, // Would need to calculate based on interactions
                topViewers: topViewers.map((view) => ({
                    user: {
                        id: view.viewer.id,
                        profile: {
                            displayName: view.viewer.profile.displayName,
                        },
                    },
                    viewedAt: view.viewedAt,
                })),
            };
        }
        catch (error) {
            logger_1.logger.error("Error getting story stats", { error, storyId, userId });
            throw error;
        }
    }
    // New: Get aggregated analytics overview for a timeframe
    static async getAnalyticsOverview(startDate, endDate) {
        try {
            const end = endDate ? new Date(endDate) : new Date();
            const start = startDate
                ? new Date(startDate)
                : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const [totalStories, totalViews, avgViewDurationRes, topStories] = await Promise.all([
                prisma_1.prisma.story.count({
                    where: { createdAt: { gte: start, lte: end } },
                }),
                prisma_1.prisma.storyView.count({
                    where: { viewedAt: { gte: start, lte: end } },
                }),
                prisma_1.prisma.contentView.aggregate({
                    _avg: { duration: true },
                    where: {
                        storyId: { not: null },
                        viewedAt: { gte: start, lte: end },
                    },
                }),
                prisma_1.prisma.story.findMany({
                    where: { createdAt: { gte: start, lte: end } },
                    include: {
                        user: {
                            include: {
                                profile: {
                                    select: {
                                        displayName: true,
                                        latitude: true,
                                        longitude: true,
                                    },
                                },
                            },
                        },
                        media: { select: { id: true, url: true, type: true } },
                        _count: { select: { views: true } },
                    },
                }),
            ]);
            const avgViewDuration = avgViewDurationRes._avg.duration ?? 0;
            // Sort topStories by views count (safely using _count) in JS and take top 10
            const topSorted = topStories
                .map((s) => ({
                id: s.id,
                media: s.media,
                user: { id: s.user.id, displayName: s.user.profile?.displayName },
                views: s._count?.views ?? 0,
            }))
                .sort((a, b) => b.views - a.views)
                .slice(0, 10);
            return {
                timeframe: { start: start.toISOString(), end: end.toISOString() },
                totalStories,
                totalViews,
                totalReplies: 0,
                avgViewDuration,
                topStories: topSorted,
            };
        }
        catch (error) {
            logger_1.logger.error("Error computing analytics overview", {
                error,
                startDate,
                endDate,
            });
            throw error;
        }
    }
    // New: Mark a story as highlight (DB-backed flag)
    static async addToHighlights(storyId, userId, highlightName, coverImage) {
        try {
            const story = await prisma_1.prisma.story.findUnique({ where: { id: storyId } });
            if (!story)
                throw new Error("Story not found");
            if (story.userId !== userId)
                throw new Error("Unauthorized to highlight this story");
            const updated = await prisma_1.prisma.story.update({
                where: { id: storyId },
                data: { isHighlight: true },
            });
            await prisma_1.prisma.notification
                .create({
                data: {
                    userId,
                    type: "story_highlight",
                    title: "Story added to highlights",
                    body: highlightName
                        ? `Added to highlight: ${highlightName}`
                        : "Added to highlights",
                    data: { storyId, highlightName, coverImage },
                },
            })
                .catch((err) => logger_1.logger.warn("Failed to create highlight notification", err));
            return updated;
        }
        catch (error) {
            logger_1.logger.error("Error adding story to highlights", {
                error,
                storyId,
                userId,
            });
            throw error;
        }
    }
    // New: Discover nearby stories based on latitude/longitude and radius (km)
    static async getNearbyStories(latitude, longitude, radiusKm = 10, limit = 20, offset = 0) {
        try {
            const latDelta = radiusKm / 111;
            const lonDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180) || 1);
            const minLat = latitude - latDelta;
            const maxLat = latitude + latDelta;
            const minLon = longitude - lonDelta;
            const maxLon = longitude + lonDelta;
            const now = new Date();
            const stories = await prisma_1.prisma.story.findMany({
                where: {
                    expiresAt: { gt: now },
                    user: {
                        profile: {
                            latitude: { gte: minLat, lte: maxLat },
                            longitude: { gte: minLon, lte: maxLon },
                        },
                    },
                },
                include: {
                    user: {
                        include: {
                            profile: {
                                select: { displayName: true, latitude: true, longitude: true },
                            },
                        },
                    },
                    media: { select: { id: true, url: true, type: true } },
                    _count: { select: { views: true } },
                },
                orderBy: { createdAt: "desc" },
                skip: offset,
                take: limit,
            });
            const haversine = (lat1, lon1, lat2, lon2) => {
                const R = 6371;
                const dLat = ((lat2 - lat1) * Math.PI) / 180;
                const dLon = ((lon2 - lon1) * Math.PI) / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos((lat1 * Math.PI) / 180) *
                        Math.cos((lat2 * Math.PI) / 180) *
                        Math.sin(dLon / 2) *
                        Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            };
            const filtered = stories
                .map((s) => {
                const lat = s.user.profile?.latitude ?? 0;
                const lon = s.user.profile?.longitude ?? 0;
                const distance = haversine(latitude, longitude, lat, lon);
                return { story: s, distance };
            })
                .filter((x) => x.distance <= radiusKm)
                .sort((a, b) => a.distance - b.distance);
            return {
                stories: filtered.map((f) => ({
                    id: f.story.id,
                    createdAt: f.story.createdAt,
                    expiresAt: f.story.expiresAt,
                    distanceKm: Number(f.distance.toFixed(2)),
                    user: {
                        id: f.story.userId,
                        displayName: f.story.user.profile?.displayName,
                    },
                    media: f.story.media,
                    views: f.story._count.views,
                })),
                total: filtered.length,
            };
        }
        catch (error) {
            logger_1.logger.error("Error fetching nearby stories", {
                error,
                latitude,
                longitude,
                radiusKm,
            });
            throw error;
        }
    }
    static async cleanupExpiredStories() {
        try {
            const now = new Date();
            const result = await prisma_1.prisma.story.deleteMany({
                where: {
                    expiresAt: {
                        lt: now,
                    },
                },
            });
            logger_1.logger.info("Expired stories cleaned up", { deletedCount: result.count });
            return { deletedCount: result.count };
        }
        catch (error) {
            logger_1.logger.error("Error cleaning up expired stories", { error });
            throw error;
        }
    }
}
exports.StoryService = StoryService;
//# sourceMappingURL=story.service.js.map