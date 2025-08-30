"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const geospatial_service_1 = require("../services/geospatial.service");
const analytics_service_1 = require("../services/analytics.service");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Validation schemas
const locationUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        latitude: zod_1.z.number().min(-90).max(90),
        longitude: zod_1.z.number().min(-180).max(180),
    }),
});
const discoveryQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        limit: zod_1.z.number().optional().default(20),
    }),
});
const nearbyQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        latitude: zod_1.z.number().min(-90).max(90),
        longitude: zod_1.z.number().min(-180).max(180),
        radius: zod_1.z.number().optional().default(50),
        type: zod_1.z.enum(["users", "communities", "both"]).optional().default("both"),
        limit: zod_1.z.number().optional().default(20),
    }),
});
const inRangeParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().min(1),
    }),
});
const updateAndDiscoverSchema = zod_1.z.object({
    body: zod_1.z.object({
        latitude: zod_1.z.number().min(-90).max(90),
        longitude: zod_1.z.number().min(-180).max(180),
        radius: zod_1.z.number().optional().default(50),
    }),
});
// POST /api/v1/geospatial/location - Update user location
router.post("/location", auth_1.requireAuth, (0, validate_1.validateRequest)({ body: locationUpdateSchema }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { latitude, longitude } = req.body;
        // Update user location
        await geospatial_service_1.GeospatialService.updateUserLocation({
            userId,
            latitude,
            longitude,
        });
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
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
            logger_1.logger.warn("Failed to track location update analytics:", err);
        });
        logger_1.logger.info("Location updated:", { userId, latitude, longitude });
        return response_1.ResponseHelper.success(res, {
            message: "Location updated successfully",
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to update location:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to update location");
    }
});
// GET /api/v1/geospatial/location - Get user's current location
router.get("/location", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const location = await geospatial_service_1.GeospatialService.getUserLocation(userId);
        if (!location) {
            return response_1.ResponseHelper.notFound(res, "Location not available");
        }
        return response_1.ResponseHelper.success(res, location);
    }
    catch (error) {
        logger_1.logger.error("Failed to get location:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to get location");
    }
});
// GET /api/v1/geospatial/discovery - Get discovery feed based on location
router.get("/discovery", auth_1.requireAuth, (0, validate_1.validateRequest)({ query: discoveryQuerySchema }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit } = req.validatedQuery;
        const discoveryFeed = await geospatial_service_1.GeospatialService.getDiscoveryFeed(userId, limit);
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: "discovery_feed_viewed",
            properties: {
                feedSize: discoveryFeed.length,
                platform: req.headers["user-agent"]?.includes("Mobile")
                    ? "mobile"
                    : "web",
            },
        }).catch((err) => {
            logger_1.logger.warn("Failed to track discovery feed analytics:", err);
        });
        logger_1.logger.info("Discovery feed viewed:", {
            userId,
            feedSize: discoveryFeed.length,
        });
        return response_1.ResponseHelper.success(res, {
            users: discoveryFeed,
            hasMore: discoveryFeed.length === Number(limit),
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to get discovery feed:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to get discovery feed");
    }
});
// POST /api/v1/geospatial/update-and-discover - Update location and get nearby
router.post("/update-and-discover", auth_1.requireAuth, (0, validate_1.validateRequest)({ body: updateAndDiscoverSchema }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { latitude, longitude, radius } = req.body;
        // Update location and get nearby results
        const results = await geospatial_service_1.GeospatialService.updateLocationAndGetNearby(userId, latitude, longitude, radius);
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
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
            logger_1.logger.warn("Failed to track update and discover analytics:", err);
        });
        logger_1.logger.info("Location updated and discovery completed:", {
            userId,
            resultsCount: results.users.length + results.communities.length,
        });
        return response_1.ResponseHelper.success(res, results);
    }
    catch (error) {
        logger_1.logger.error("Failed to update location and discover:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to update location and discover");
    }
});
// GET /api/v1/geospatial/nearby - Find nearby users and communities
router.get("/nearby", auth_1.requireAuth, (0, validate_1.validateRequest)({ query: nearbyQuerySchema }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { latitude, longitude, radius, type, limit } = req.validatedQuery;
        const results = await geospatial_service_1.GeospatialService.findNearby({
            latitude,
            longitude,
            radius,
            userId,
            type: type,
            limit,
        });
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
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
            logger_1.logger.warn("Failed to track nearby search analytics:", err);
        });
        logger_1.logger.info("Nearby search:", {
            userId,
            resultsCount: results.users.length + results.communities.length,
        });
        return response_1.ResponseHelper.success(res, results);
    }
    catch (error) {
        logger_1.logger.error("Failed to find nearby entities:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to find nearby entities");
    }
});
// GET /api/v1/geospatial/in-range/:userId - Check if user is in range
router.get("/in-range/:userId", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: inRangeParamsSchema }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { userId: targetUserId } = req.params;
        // Use areUsersInRange method instead
        const inRange = await geospatial_service_1.GeospatialService.areUsersInRange(userId, targetUserId);
        return response_1.ResponseHelper.success(res, { inRange });
    }
    catch (error) {
        logger_1.logger.error("Failed to check user range:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to check user range");
    }
});
// GET /api/v1/geospatial/stats - Get geospatial statistics
router.get("/stats", auth_1.requireAuth, async (req, res) => {
    try {
        const _userId = req.user.id;
        // Log analytics for geospatial stats access
        await analytics_service_1.AnalyticsService.trackEvent({
            userId: _userId,
            event: "geospatial_stats_accessed",
            properties: {
                timestamp: new Date().toISOString(),
                endpoint: "/api/v1/geospatial/stats",
            },
        }).catch((err) => {
            logger_1.logger.warn("Failed to track geospatial stats analytics:", err);
        });
        // Return basic stats for now
        const stats = {
            totalNearbyUsers: 0,
            totalNearbyCommunities: 0,
            lastLocationUpdate: new Date().toISOString(),
        };
        return response_1.ResponseHelper.success(res, stats);
    }
    catch (error) {
        logger_1.logger.error("Failed to get geospatial stats:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to get geospatial stats");
    }
});
exports.default = router;
//# sourceMappingURL=geospatial.routes.js.map