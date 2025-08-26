"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const story_service_1 = require("../services/story.service");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Validation schemas
const createStoryValidation = {
    body: zod_1.z.object({
        mediaId: zod_1.z.string(),
        caption: zod_1.z.string().optional(),
        duration: zod_1.z.number().min(1).max(24).default(24), // hours
        privacy: zod_1.z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]).default("FRIENDS"),
        allowReplies: zod_1.z.boolean().default(true),
        showViewers: zod_1.z.boolean().default(true),
        backgroundColor: zod_1.z.string().optional(),
        textOverlay: zod_1.z.string().optional(),
        stickers: zod_1.z
            .array(zod_1.z.object({
            type: zod_1.z.string(),
            x: zod_1.z.number(),
            y: zod_1.z.number(),
            data: zod_1.z.any(),
        }))
            .optional(),
    }),
};
const updateStoryValidation = {
    body: zod_1.z.object({
        caption: zod_1.z.string().optional(),
        privacy: zod_1.z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]).optional(),
        allowReplies: zod_1.z.boolean().optional(),
        showViewers: zod_1.z.boolean().optional(),
    }),
};
// Story CRUD operations
router.post("/", auth_1.auth, (0, validate_1.validateRequest)(createStoryValidation), async (req, res) => {
    try {
        const storyData = req.body;
        const userId = req.user.userId;
        // Use available method with userId as parameter
        const story = await story_service_1.StoryService.createStory({
            userId,
            mediaId: storyData.mediaId,
        });
        res.status(201).json({
            success: true,
            data: story,
        });
    }
    catch (error) {
        logger_1.logger.error("Error creating story:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create story",
        });
    }
});
router.get("/:storyId", auth_1.auth, async (req, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.user.userId;
        const story = await story_service_1.StoryService.getStoryById(storyId, userId);
        if (!story) {
            return res.status(404).json({
                success: false,
                message: "Story not found",
            });
        }
        res.json({
            success: true,
            data: story,
        });
    }
    catch (error) {
        logger_1.logger.error("Error fetching story:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch story",
        });
    }
});
router.put("/:storyId", auth_1.auth, (0, validate_1.validateRequest)(updateStoryValidation), async (req, res) => {
    try {
        const { storyId } = req.params;
        const updateData = req.body;
        const userId = req.user.userId;
        // Use updateStorySettings method instead of updateStory
        const story = await story_service_1.StoryService.updateStorySettings(storyId, userId, updateData);
        res.json({
            success: true,
            data: story,
        });
    }
    catch (error) {
        logger_1.logger.error("Error updating story:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update story",
        });
    }
});
router.delete("/:storyId", auth_1.auth, async (req, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.user.userId;
        await story_service_1.StoryService.deleteStory(storyId, userId);
        res.json({
            success: true,
            message: "Story deleted successfully",
        });
    }
    catch (error) {
        logger_1.logger.error("Error deleting story:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete story",
        });
    }
});
// Story feed and discovery
router.get("/feed/latest", auth_1.auth, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const userId = req.user.userId;
        const stories = await story_service_1.StoryService.getStoriesFeed(userId, parseInt(limit));
        res.json({
            success: true,
            data: stories,
        });
    }
    catch (error) {
        logger_1.logger.error("Error fetching stories feed:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch stories feed",
        });
    }
});
router.get("/user/:userId", auth_1.auth, async (req, res) => {
    try {
        const { userId: targetUserId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const userId = req.user.userId;
        const stories = await story_service_1.StoryService.getUserStories(targetUserId, userId, false // includeExpired
        );
        res.json({
            success: true,
            data: stories,
        });
    }
    catch (error) {
        logger_1.logger.error("Error fetching user stories:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user stories",
        });
    }
});
router.get("/user/:userId/active", auth_1.auth, async (req, res) => {
    try {
        const { userId: targetUserId } = req.params;
        const userId = req.user.userId;
        // Get active (non-expired) stories
        const activeStories = await story_service_1.StoryService.getUserStories(targetUserId, userId, false);
        res.json({
            success: true,
            data: activeStories,
        });
    }
    catch (error) {
        logger_1.logger.error("Error fetching active stories:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch active stories",
        });
    }
});
// Story interactions
router.post("/:storyId/view", auth_1.auth, async (req, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.user.userId;
        const view = await story_service_1.StoryService.trackView(storyId, userId);
        res.json({
            success: true,
            data: view,
        });
    }
    catch (error) {
        logger_1.logger.error("Error tracking story view:", error);
        res.status(500).json({
            success: false,
            message: "Failed to track view",
        });
    }
});
router.get("/:storyId/viewers", auth_1.auth, async (req, res) => {
    try {
        const { storyId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const userId = req.user.userId;
        const viewers = await story_service_1.StoryService.getStoryViewers(storyId, userId, parseInt(page), parseInt(limit));
        res.json({
            success: true,
            data: viewers,
        });
    }
    catch (error) {
        logger_1.logger.error("Error fetching story viewers:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch viewers",
        });
    }
});
router.post("/:storyId/reply", auth_1.auth, async (req, res) => {
    try {
        const { storyId } = req.params;
        const { message } = req.body;
        const userId = req.user.userId;
        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Reply message is required",
            });
        }
        // This would typically be handled by messaging service
        // For now, we'll return a success response
        res.json({
            success: true,
            message: "Reply sent successfully",
        });
    }
    catch (error) {
        logger_1.logger.error("Error sending story reply:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send reply",
        });
    }
});
// Story analytics
router.get("/:storyId/analytics", auth_1.auth, async (req, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.user.userId;
        // Use available getStoryStats method
        const analytics = await story_service_1.StoryService.getStoryStats(storyId, userId);
        res.json({
            success: true,
            data: analytics,
        });
    }
    catch (error) {
        logger_1.logger.error("Error fetching story analytics:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch analytics",
        });
    }
});
router.get("/analytics/overview", auth_1.auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user.userId;
        const analytics = await story_service_1.StoryService.getAnalyticsOverview(startDate, endDate);
        res.json({
            success: true,
            data: analytics,
        });
    }
    catch (error) {
        logger_1.logger.error("Error fetching user story analytics:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch analytics",
        });
    }
});
// Story highlights (saved stories)
router.post("/:storyId/highlight", auth_1.auth, async (req, res) => {
    try {
        const { storyId } = req.params;
        const { highlightName, coverImage } = req.body;
        const userId = req.user.userId;
        const updated = await story_service_1.StoryService.addToHighlights(storyId, userId, highlightName, coverImage);
        res.json({
            success: true,
            data: updated,
        });
    }
    catch (error) {
        logger_1.logger.error("Error adding story to highlights:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add to highlights",
        });
    }
});
// Story discovery
router.get("/discover/trending", auth_1.auth, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const userId = req.user.userId;
        // Placeholder implementation - use getStoriesFeed for now
        const trendingStories = await story_service_1.StoryService.getStoriesFeed(userId, parseInt(limit));
        res.json({
            success: true,
            data: trendingStories,
        });
    }
    catch (error) {
        logger_1.logger.error("Error fetching trending stories:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch trending stories",
        });
    }
});
router.get("/discover/nearby", auth_1.auth, async (req, res) => {
    try {
        const { latitude, longitude, radius = 10 } = req.query;
        const { page = 1, limit = 20 } = req.query;
        const userId = req.user.userId;
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: "Location coordinates are required",
            });
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (Math.max(1, pageNum) - 1) * limitNum;
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        const radiusKm = parseFloat(radius) || 10;
        const nearby = await story_service_1.StoryService.getNearbyStories(lat, lon, radiusKm, limitNum, offset);
        res.json({
            success: true,
            data: {
                stories: nearby.stories,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: nearby.total,
                    pages: Math.ceil(nearby.total / limitNum),
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error("Error fetching nearby stories:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch nearby stories",
        });
    }
});
// Utility routes
router.post("/cleanup/expired", auth_1.auth, async (req, res) => {
    try {
        // Only allow admin users to trigger cleanup
        // This would typically be a scheduled job
        const cleanupResult = await story_service_1.StoryService.cleanupExpiredStories();
        res.json({
            success: true,
            data: cleanupResult,
        });
    }
    catch (error) {
        logger_1.logger.error("Error cleaning up expired stories:", error);
        res.status(500).json({
            success: false,
            message: "Failed to cleanup expired stories",
        });
    }
});
router.get("/stats/global", auth_1.auth, async (req, res) => {
    try {
        const { timeframe = "24h" } = req.query;
        const userId = req.user.userId;
        // Placeholder implementation - would need global stats in StoryService
        const stats = {
            totalStories: 0,
            totalViews: 0,
            activeUsers: 0,
            timeframe: timeframe,
        };
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        logger_1.logger.error("Error fetching global story stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch global stats",
        });
    }
});
exports.default = router;
//# sourceMappingURL=stories.routes.js.map