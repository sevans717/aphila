"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const response_1 = require("../utils/response");
const media_service_1 = require("../services/media.service");
const analytics_service_1 = require("../services/analytics.service");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Simple test endpoint first
router.get("/test", (_req, res) => {
    res.json({ message: "Media routes working" });
});
// Get user's media assets
const getMediaQuerySchema = zod_1.z.object({
    type: zod_1.z.enum(["image", "video", "other"]).optional(),
    limit: zod_1.z.string().optional(),
    offset: zod_1.z.string().optional(),
});
router.get("/", auth_1.requireAuth, (0, validate_1.validateRequest)({ query: getMediaQuerySchema }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, limit = "20", offset = "0" } = req.validatedQuery;
        const whereClause = { userId };
        if (type) {
            whereClause.type = type.toUpperCase();
        }
        const mediaAssets = await prisma_1.prisma.mediaAsset.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            take: parseInt(limit),
            skip: parseInt(offset),
        });
        const total = await prisma_1.prisma.mediaAsset.count({
            where: whereClause,
        });
        return response_1.ResponseHelper.success(res, {
            mediaAssets: mediaAssets.map((asset) => ({
                id: asset.id,
                url: asset.url,
                type: asset.type,
                width: asset.width,
                height: asset.height,
                duration: asset.duration,
                createdAt: asset.createdAt,
            })),
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + parseInt(limit) < total,
            },
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to get media assets:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to get media assets");
    }
});
// Get media asset by ID
const getMediaByIdParamsSchema = zod_1.z.object({
    mediaId: zod_1.z.string(),
});
router.get("/:mediaId", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: getMediaByIdParamsSchema }), async (req, res) => {
    try {
        const { mediaId } = req.params;
        const userId = req.user.id;
        const mediaAsset = await prisma_1.prisma.mediaAsset.findFirst({
            where: {
                id: mediaId,
                userId, // Ensure user owns the media
            },
        });
        if (!mediaAsset) {
            return response_1.ResponseHelper.notFound(res, "Media asset not found");
        }
        return response_1.ResponseHelper.success(res, {
            mediaAsset: {
                id: mediaAsset.id,
                url: mediaAsset.url,
                type: mediaAsset.type,
                width: mediaAsset.width,
                height: mediaAsset.height,
                duration: mediaAsset.duration,
                createdAt: mediaAsset.createdAt,
            },
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to get media asset:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to get media asset");
    }
});
// Delete media asset
const deleteMediaParamsSchema = zod_1.z.object({
    mediaId: zod_1.z.string(),
});
router.delete("/:mediaId", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: deleteMediaParamsSchema }), async (req, res) => {
    try {
        const { mediaId } = req.params;
        const userId = req.user.id;
        const mediaAsset = await prisma_1.prisma.mediaAsset.findFirst({
            where: {
                id: mediaId,
                userId, // Ensure user owns the media
            },
        });
        if (!mediaAsset) {
            return response_1.ResponseHelper.notFound(res, "Media asset not found");
        }
        // Delete from storage
        await media_service_1.MediaService.deleteFile(mediaAsset.url);
        // Delete from database
        await prisma_1.prisma.mediaAsset.delete({
            where: {
                id: mediaId,
            },
        });
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: "media_deleted",
            properties: {
                mediaType: mediaAsset.type,
                platform: req.headers["user-agent"]?.includes("Mobile")
                    ? "mobile"
                    : "web",
            },
        }).catch((err) => {
            logger_1.logger.warn("Failed to track analytics:", err);
        });
        return response_1.ResponseHelper.success(res, {
            message: "Media asset deleted successfully",
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to delete media asset:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to delete media asset");
    }
});
// Toggle favorite status
const toggleFavoriteParamsSchema = zod_1.z.object({
    mediaId: zod_1.z.string(),
});
const toggleFavoriteBodySchema = zod_1.z.object({
    isFavorite: zod_1.z.boolean().optional(),
});
router.patch("/:mediaId/favorite", auth_1.requireAuth, (0, validate_1.validateRequest)({
    params: toggleFavoriteParamsSchema,
    body: toggleFavoriteBodySchema,
}), async (req, res) => {
    try {
        const { mediaId } = req.params;
        const userId = req.user.id;
        const { isFavorite } = req.body;
        const mediaAsset = await prisma_1.prisma.mediaAsset.updateMany({
            where: {
                id: mediaId,
                userId,
            },
            data: {
                isFavorite: isFavorite ?? true,
            },
        });
        if (mediaAsset.count === 0) {
            return response_1.ResponseHelper.notFound(res, "Media asset not found");
        }
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: "media_favorite_updated",
            properties: {
                mediaId,
                isFavorite: isFavorite ?? true,
                platform: req.headers["user-agent"]?.includes("Mobile")
                    ? "mobile"
                    : "web",
            },
        }).catch((err) => {
            logger_1.logger.warn("Failed to track analytics:", err);
        });
        logger_1.logger.info("Media favorite updated:", {
            mediaId,
            userId,
            isFavorite: isFavorite ?? true,
        });
        return response_1.ResponseHelper.success(res, {
            success: true,
            message: `Media ${isFavorite ? "added to" : "removed from"} favorites`,
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to update media favorite status:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to update media favorite status");
    }
});
// Get media stats
router.get("/stats", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await prisma_1.prisma.mediaAsset.groupBy({
            by: ["type"],
            where: { userId },
            _count: {
                id: true,
            },
            _sum: {
                width: true,
                height: true,
            },
        });
        const totalCount = await prisma_1.prisma.mediaAsset.count({
            where: { userId },
        });
        const favoritesCount = await prisma_1.prisma.mediaAsset.count({
            where: {
                userId,
                isFavorite: true,
            },
        });
        return response_1.ResponseHelper.success(res, {
            stats: stats.map((stat) => ({
                type: stat.type,
                count: stat._count.id,
                totalWidth: stat._sum.width || 0,
                totalHeight: stat._sum.height || 0,
            })),
            totalCount,
            favoritesCount,
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to get media stats:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to get media stats");
    }
});
exports.default = router;
//# sourceMappingURL=media.routes.js.map