import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import { ResponseHelper } from "../utils/response";
import { MediaService } from "../services/media.service";
import { AnalyticsService } from "../services/analytics.service";
import { logger } from "../utils/logger";

const router = Router();

// Simple test endpoint first
router.get("/test", (_req, res) => {
  res.json({ message: "Media routes working" });
});

// Get user's media assets
const getMediaQuerySchema = z.object({
  type: z.enum(["image", "video", "other"]).optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

router.get(
  "/",
  requireAuth,
  validateRequest({ query: getMediaQuerySchema }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { type, limit = "20", offset = "0" } = req.validatedQuery;

      const whereClause: any = { userId };
      if (type) {
        whereClause.type = type.toUpperCase();
      }

      const mediaAssets = await prisma.mediaAsset.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      });

      const total = await prisma.mediaAsset.count({
        where: whereClause,
      });

      return ResponseHelper.success(res, {
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
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore:
            parseInt(offset as string) + parseInt(limit as string) < total,
        },
      });
    } catch (error: any) {
      logger.error("Failed to get media assets:", error);
      return ResponseHelper.serverError(res, "Failed to get media assets");
    }
  }
);

// Get media asset by ID
const getMediaByIdParamsSchema = z.object({
  mediaId: z.string(),
});

router.get(
  "/:mediaId",
  requireAuth,
  validateRequest({ params: getMediaByIdParamsSchema }),
  async (req, res) => {
    try {
      const { mediaId } = req.params;
      const userId = req.user!.id;

      const mediaAsset = await prisma.mediaAsset.findFirst({
        where: {
          id: mediaId,
          userId, // Ensure user owns the media
        },
      });

      if (!mediaAsset) {
        return ResponseHelper.notFound(res, "Media asset not found");
      }

      return ResponseHelper.success(res, {
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
    } catch (error: any) {
      logger.error("Failed to get media asset:", error);
      return ResponseHelper.serverError(res, "Failed to get media asset");
    }
  }
);

// Delete media asset
const deleteMediaParamsSchema = z.object({
  mediaId: z.string(),
});

router.delete(
  "/:mediaId",
  requireAuth,
  validateRequest({ params: deleteMediaParamsSchema }),
  async (req, res) => {
    try {
      const { mediaId } = req.params;
      const userId = req.user!.id;

      const mediaAsset = await prisma.mediaAsset.findFirst({
        where: {
          id: mediaId,
          userId, // Ensure user owns the media
        },
      });

      if (!mediaAsset) {
        return ResponseHelper.notFound(res, "Media asset not found");
      }

      // Delete from storage
      await MediaService.deleteFile(mediaAsset.url);

      // Delete from database
      await prisma.mediaAsset.delete({
        where: {
          id: mediaId,
        },
      });

      // Track analytics
      await AnalyticsService.trackEvent({
        userId,
        event: "media_deleted",
        properties: {
          mediaType: mediaAsset.type,
          platform: req.headers["user-agent"]?.includes("Mobile")
            ? "mobile"
            : "web",
        },
      }).catch((err) => {
        logger.warn("Failed to track analytics:", err);
      });

      return ResponseHelper.success(res, {
        message: "Media asset deleted successfully",
      });
    } catch (error: any) {
      logger.error("Failed to delete media asset:", error);
      return ResponseHelper.serverError(res, "Failed to delete media asset");
    }
  }
);

// Toggle favorite status
const toggleFavoriteParamsSchema = z.object({
  mediaId: z.string(),
});

const toggleFavoriteBodySchema = z.object({
  isFavorite: z.boolean().optional(),
});

router.patch(
  "/:mediaId/favorite",
  requireAuth,
  validateRequest({
    params: toggleFavoriteParamsSchema,
    body: toggleFavoriteBodySchema,
  }),
  async (req, res) => {
    try {
      const { mediaId } = req.params;
      const userId = req.user!.id;
      const { isFavorite } = req.body;

      const mediaAsset = await prisma.mediaAsset.updateMany({
        where: {
          id: mediaId,
          userId,
        },
        data: {
          isFavorite: isFavorite ?? true,
        },
      });

      if (mediaAsset.count === 0) {
        return ResponseHelper.notFound(res, "Media asset not found");
      }

      // Track analytics
      await AnalyticsService.trackEvent({
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
        logger.warn("Failed to track analytics:", err);
      });

      logger.info("Media favorite updated:", {
        mediaId,
        userId,
        isFavorite: isFavorite ?? true,
      });

      return ResponseHelper.success(res, {
        success: true,
        message: `Media ${isFavorite ? "added to" : "removed from"} favorites`,
      });
    } catch (error: any) {
      logger.error("Failed to update media favorite status:", error);
      return ResponseHelper.serverError(
        res,
        "Failed to update media favorite status"
      );
    }
  }
);

// Get media stats
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    const stats = await prisma.mediaAsset.groupBy({
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

    const totalCount = await prisma.mediaAsset.count({
      where: { userId },
    });

    const favoritesCount = await prisma.mediaAsset.count({
      where: {
        userId,
        isFavorite: true,
      },
    });

    return ResponseHelper.success(res, {
      stats: stats.map((stat) => ({
        type: stat.type,
        count: stat._count.id,
        totalWidth: stat._sum.width || 0,
        totalHeight: stat._sum.height || 0,
      })),
      totalCount,
      favoritesCount,
    });
  } catch (error: any) {
    logger.error("Failed to get media stats:", error);
    return ResponseHelper.serverError(res, "Failed to get media stats");
  }
});

export default router;
