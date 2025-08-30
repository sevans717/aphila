import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import { GeospatialService } from "../services/geospatial.service";
import { AnalyticsService } from "../services/analytics.service";
import { ResponseHelper } from "../utils/response";
import { logger } from "../utils/logger";

const router = Router();

// Validation schemas
const locationUpdateSchema = z.object({
  body: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
});

const discoveryQuerySchema = z.object({
  query: z.object({
    limit: z.number().optional().default(20),
  }),
});

const nearbyQuerySchema = z.object({
  query: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radius: z.number().optional().default(50),
    type: z.enum(["users", "communities", "both"]).optional().default("both"),
    limit: z.number().optional().default(20),
  }),
});

const inRangeParamsSchema = z.object({
  params: z.object({
    userId: z.string().min(1),
  }),
});

const updateAndDiscoverSchema = z.object({
  body: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radius: z.number().optional().default(50),
  }),
});

// POST /api/v1/geospatial/location - Update user location
router.post(
  "/location",
  requireAuth,
  validateRequest({ body: locationUpdateSchema }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { latitude, longitude } = req.body;

      // Update user location
      await GeospatialService.updateUserLocation({
        userId,
        latitude,
        longitude,
      });

      // Track analytics
      await AnalyticsService.trackEvent({
        userId,
        event: "location_updated",
        properties: {
          latitude,
          longitude,
          platform: req.headers["user-agent"]?.includes("Mobile")
            ? "mobile"
            : "web",
        },
      }).catch((err) => {
        logger.warn("Failed to track location update analytics:", err);
      });

      logger.info("Location updated:", { userId, latitude, longitude });
      return ResponseHelper.success(res, {
        message: "Location updated successfully",
      });
    } catch (error: any) {
      logger.error("Failed to update location:", error);
      return ResponseHelper.serverError(res, "Failed to update location");
    }
  }
);

// GET /api/v1/geospatial/location - Get user's current location
router.get("/location", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const location = await GeospatialService.getUserLocation(userId);

    if (!location) {
      return ResponseHelper.notFound(res, "Location not available");
    }

    return ResponseHelper.success(res, location);
  } catch (error: any) {
    logger.error("Failed to get location:", error);
    return ResponseHelper.serverError(res, "Failed to get location");
  }
});

// GET /api/v1/geospatial/discovery - Get discovery feed based on location
router.get(
  "/discovery",
  requireAuth,
  validateRequest({ query: discoveryQuerySchema }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { limit } = req.validatedQuery;

      const discoveryFeed = await GeospatialService.getDiscoveryFeed(
        userId,
        limit
      );

      // Track analytics
      await AnalyticsService.trackEvent({
        userId,
        event: "discovery_feed_viewed",
        properties: {
          feedSize: discoveryFeed.length,
          platform: req.headers["user-agent"]?.includes("Mobile")
            ? "mobile"
            : "web",
        },
      }).catch((err) => {
        logger.warn("Failed to track discovery feed analytics:", err);
      });

      logger.info("Discovery feed viewed:", {
        userId,
        feedSize: discoveryFeed.length,
      });
      return ResponseHelper.success(res, {
        users: discoveryFeed,
        hasMore: discoveryFeed.length === Number(limit),
      });
    } catch (error: any) {
      logger.error("Failed to get discovery feed:", error);
      return ResponseHelper.serverError(res, "Failed to get discovery feed");
    }
  }
);

// POST /api/v1/geospatial/update-and-discover - Update location and get nearby
router.post(
  "/update-and-discover",
  requireAuth,
  validateRequest({ body: updateAndDiscoverSchema }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { latitude, longitude, radius } = req.body;

      // Update location and get nearby results
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
        properties: {
          latitude,
          longitude,
          radius,
          nearbyUsersCount: results.users.length,
          nearbyCommunitiesCount: results.communities.length,
          platform: req.headers["user-agent"]?.includes("Mobile")
            ? "mobile"
            : "web",
        },
      }).catch((err) => {
        logger.warn("Failed to track update and discover analytics:", err);
      });

      logger.info("Location updated and discovery completed:", {
        userId,
        resultsCount: results.users.length + results.communities.length,
      });
      return ResponseHelper.success(res, results);
    } catch (error: any) {
      logger.error("Failed to update location and discover:", error);
      return ResponseHelper.serverError(
        res,
        "Failed to update location and discover"
      );
    }
  }
);

// GET /api/v1/geospatial/nearby - Find nearby users and communities
router.get(
  "/nearby",
  requireAuth,
  validateRequest({ query: nearbyQuerySchema }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { latitude, longitude, radius, type, limit } = req.validatedQuery;

      const results = await GeospatialService.findNearby({
        latitude,
        longitude,
        radius,
        userId,
        type: type as any,
        limit,
      });

      // Track analytics
      await AnalyticsService.trackEvent({
        userId,
        event: "nearby_search",
        properties: {
          latitude,
          longitude,
          radius,
          type,
          resultsCount: results.users.length + results.communities.length,
          platform: req.headers["user-agent"]?.includes("Mobile")
            ? "mobile"
            : "web",
        },
      }).catch((err) => {
        logger.warn("Failed to track nearby search analytics:", err);
      });

      logger.info("Nearby search:", {
        userId,
        resultsCount: results.users.length + results.communities.length,
      });
      return ResponseHelper.success(res, results);
    } catch (error: any) {
      logger.error("Failed to find nearby entities:", error);
      return ResponseHelper.serverError(res, "Failed to find nearby entities");
    }
  }
);

// GET /api/v1/geospatial/in-range/:userId - Check if user is in range
router.get(
  "/in-range/:userId",
  requireAuth,
  validateRequest({ params: inRangeParamsSchema }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { userId: targetUserId } = req.params;

      // Use areUsersInRange method instead
      const inRange = await GeospatialService.areUsersInRange(
        userId,
        targetUserId
      );

      return ResponseHelper.success(res, { inRange });
    } catch (error: any) {
      logger.error("Failed to check user range:", error);
      return ResponseHelper.serverError(res, "Failed to check user range");
    }
  }
);

// GET /api/v1/geospatial/stats - Get geospatial statistics
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const _userId = req.user!.id;

    // Log analytics for geospatial stats access
    await AnalyticsService.trackEvent({
      userId: _userId,
      event: "geospatial_stats_accessed",
      properties: {
        timestamp: new Date().toISOString(),
        endpoint: "/api/v1/geospatial/stats",
      },
    }).catch((err) => {
      logger.warn("Failed to track geospatial stats analytics:", err);
    });

    // Return basic stats for now
    const stats = {
      totalNearbyUsers: 0,
      totalNearbyCommunities: 0,
      lastLocationUpdate: new Date().toISOString(),
    };

    return ResponseHelper.success(res, stats);
  } catch (error: any) {
    logger.error("Failed to get geospatial stats:", error);
    return ResponseHelper.serverError(res, "Failed to get geospatial stats");
  }
});

export default router;
