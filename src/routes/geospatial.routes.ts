import { Router } from "express";
import { z } from "zod";
import { auth } from "../middleware/auth";
import { validateRequest, commonValidation } from "../middleware/validate";
import { AnalyticsService } from "../services/analytics.service";
import { GeospatialService } from "../services/geospatial.service";
import { logger } from "../utils/logger";

const router = Router();

// Validation schemas
const updateLocationSchema = {
  body: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
};

const nearbyQuerySchema = {
  query: z.object({
    latitude: z.string().transform((val) => parseFloat(val)),
    longitude: z.string().transform((val) => parseFloat(val)),
    radius: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : 10)),
    type: z.enum(["users", "communities", "all"]).optional().default("all"),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 50)),
  }),
};

const discoveryQuerySchema = {
  query: z.object({
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 20)),
  }),
};

/**
 * Update user's current location
 * POST /api/v1/geospatial/location
 */
router.post(
  "/location",
  auth,
  validateRequest(updateLocationSchema),
  async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      const userId = req.user!.userId;

      await GeospatialService.updateUserLocation({
        userId,
        latitude,
        longitude,
      });

      // Track analytics
      await AnalyticsService.trackEvent({
        userId,
        event: "location_updated",
        platform: req.headers["user-agent"]?.includes("Mobile")
          ? "mobile"
          : "web",
        properties: {
          latitude,
          longitude,
        },
      });

      res.json({
        success: true,
        message: "Location updated successfully",
      });
    } catch (error: any) {
      logger.error("Failed to update location:", error);
      res.status(500).json({
        error: "InternalServerError",
        message: "Failed to update location",
      });
    }
  }
);

/**
 * Get user's current location
 * GET /api/v1/geospatial/location
 */
router.get("/location", auth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const location = await GeospatialService.getUserLocation(userId);

    if (!location) {
      return res.status(404).json({
        error: "NotFound",
        message: "Location not available",
      });
    }

    res.json(location);
  } catch (error: any) {
    logger.error("Failed to get location:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to get location",
    });
  }
});

/**
 * Find nearby users and communities
 * GET /api/v1/geospatial/nearby
 */
router.get(
  "/nearby",
  auth,
  validateRequest(nearbyQuerySchema),
  async (req, res) => {
    try {
      const { latitude, longitude, radius, type, limit } = req.query;
      const userId = req.user!.userId;

      const results = await GeospatialService.findNearby({
        latitude: Number(latitude),
        longitude: Number(longitude),
        radius: Number(radius),
        userId,
        type: type as any,
        limit: Number(limit),
      });

      // Track analytics
      await AnalyticsService.trackEvent({
        userId,
        event: "nearby_search",
        platform: req.headers["user-agent"]?.includes("Mobile")
          ? "mobile"
          : "web",
        properties: {
          radius,
          type,
          resultsCount: results.users.length + results.communities.length,
        },
      });

      res.json(results);
    } catch (error: any) {
      logger.error("Failed to find nearby entities:", error);
      res.status(500).json({
        error: "InternalServerError",
        message: "Failed to find nearby entities",
      });
    }
  }
);

/**
 * Get discovery feed based on location and preferences
 * GET /api/v1/geospatial/discovery
 */
router.get(
  "/discovery",
  auth,
  validateRequest(discoveryQuerySchema),
  async (req, res) => {
    try {
      const { limit } = req.query;
      const userId = req.user!.userId;

      const discoveryFeed = await GeospatialService.getDiscoveryFeed(
        userId,
        Number(limit)
      );

      // Track analytics
      await AnalyticsService.trackEvent({
        userId,
        event: "discovery_feed_viewed",
        platform: req.headers["user-agent"]?.includes("Mobile")
          ? "mobile"
          : "web",
        properties: {
          feedSize: discoveryFeed.length,
        },
      });

      res.json({
        users: discoveryFeed,
        hasMore: discoveryFeed.length === Number(limit),
      });
    } catch (error: any) {
      logger.error("Failed to get discovery feed:", error);
      res.status(500).json({
        error: "InternalServerError",
        message: "Failed to get discovery feed",
      });
    }
  }
);

/**
 * Update location and get nearby users in one call (optimized for mobile)
 * POST /api/v1/geospatial/update-and-discover
 */
router.post(
  "/update-and-discover",
  auth,
  validateRequest({
    body: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      radius: z.number().optional().default(50),
    }),
  }),
  async (req, res) => {
    try {
      const { latitude, longitude, radius } = req.body;
      const userId = req.user!.userId;

      const results = await GeospatialService.updateLocationAndGetNearby(
        userId,
        latitude,
        longitude,
        radius
      );

      // Track analytics
      await AnalyticsService.trackEvent({
        userId,
        event: "location_updated_and_discovered",
        platform: req.headers["user-agent"]?.includes("Mobile")
          ? "mobile"
          : "web",
        properties: {
          latitude,
          longitude,
          radius,
          nearbyUsersCount: results.users.length,
          nearbyCommunitiesCount: results.communities.length,
        },
      });

      res.json(results);
    } catch (error: any) {
      logger.error("Failed to update location and discover:", error);
      res.status(500).json({
        error: "InternalServerError",
        message: "Failed to update location and discover",
      });
    }
  }
);

/**
 * Check if two users are within range
 * GET /api/v1/geospatial/in-range/:userId
 */
router.get("/in-range/:userId", auth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const targetUserId = req.params.userId;

    const inRange = await GeospatialService.areUsersInRange(
      userId,
      targetUserId
    );

    res.json({ inRange });
  } catch (error: any) {
    logger.error("Failed to check user range:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to check user range",
    });
  }
});

export default router;
