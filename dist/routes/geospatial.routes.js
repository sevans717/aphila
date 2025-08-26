"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const analytics_service_1 = require("../services/analytics.service");
const geospatial_service_1 = require("../services/geospatial.service");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Validation schemas
const updateLocationSchema = zod_1.z.object({
    body: zod_1.z.object({
        latitude: zod_1.z.number().min(-90).max(90),
        longitude: zod_1.z.number().min(-180).max(180),
    }),
});
const nearbyQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        latitude: zod_1.z.string().transform(val => parseFloat(val)),
        longitude: zod_1.z.string().transform(val => parseFloat(val)),
        radius: zod_1.z.string().optional().transform(val => val ? parseFloat(val) : 10),
        type: zod_1.z.enum(['users', 'communities', 'all']).optional().default('all'),
        limit: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 50),
    }),
});
const discoveryQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        limit: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 20),
    }),
});
/**
 * Update user's current location
 * POST /api/v1/geospatial/location
 */
router.post('/location', auth_1.auth, (0, validate_1.validate)(updateLocationSchema), async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const userId = req.user.userId;
        await geospatial_service_1.GeospatialService.updateUserLocation({
            userId,
            latitude,
            longitude,
        });
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: 'location_updated',
            platform: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web',
            properties: {
                latitude,
                longitude,
            },
        });
        res.json({
            success: true,
            message: 'Location updated successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update location:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to update location',
        });
    }
});
/**
 * Get user's current location
 * GET /api/v1/geospatial/location
 */
router.get('/location', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const location = await geospatial_service_1.GeospatialService.getUserLocation(userId);
        if (!location) {
            return res.status(404).json({
                error: 'NotFound',
                message: 'Location not available',
            });
        }
        res.json(location);
    }
    catch (error) {
        logger_1.logger.error('Failed to get location:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to get location',
        });
    }
});
/**
 * Find nearby users and communities
 * GET /api/v1/geospatial/nearby
 */
router.get('/nearby', auth_1.auth, (0, validate_1.validate)(nearbyQuerySchema), async (req, res) => {
    try {
        const { latitude, longitude, radius, type, limit } = req.query;
        const userId = req.user.userId;
        const results = await geospatial_service_1.GeospatialService.findNearby({
            latitude: Number(latitude),
            longitude: Number(longitude),
            radius: Number(radius),
            userId,
            type: type,
            limit: Number(limit),
        });
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: 'nearby_search',
            platform: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web',
            properties: {
                radius,
                type,
                resultsCount: results.users.length + results.communities.length,
            },
        });
        res.json(results);
    }
    catch (error) {
        logger_1.logger.error('Failed to find nearby entities:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to find nearby entities',
        });
    }
});
/**
 * Get discovery feed based on location and preferences
 * GET /api/v1/geospatial/discovery
 */
router.get('/discovery', auth_1.auth, (0, validate_1.validate)(discoveryQuerySchema), async (req, res) => {
    try {
        const { limit } = req.query;
        const userId = req.user.userId;
        const discoveryFeed = await geospatial_service_1.GeospatialService.getDiscoveryFeed(userId, Number(limit));
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: 'discovery_feed_viewed',
            platform: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web',
            properties: {
                feedSize: discoveryFeed.length,
            },
        });
        res.json({
            users: discoveryFeed,
            hasMore: discoveryFeed.length === Number(limit),
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get discovery feed:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to get discovery feed',
        });
    }
});
/**
 * Update location and get nearby users in one call (optimized for mobile)
 * POST /api/v1/geospatial/update-and-discover
 */
router.post('/update-and-discover', auth_1.auth, (0, validate_1.validate)(zod_1.z.object({
    body: zod_1.z.object({
        latitude: zod_1.z.number().min(-90).max(90),
        longitude: zod_1.z.number().min(-180).max(180),
        radius: zod_1.z.number().optional().default(50),
    }),
})), async (req, res) => {
    try {
        const { latitude, longitude, radius } = req.body;
        const userId = req.user.userId;
        const results = await geospatial_service_1.GeospatialService.updateLocationAndGetNearby(userId, latitude, longitude, radius);
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: 'location_updated_and_discovered',
            platform: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web',
            properties: {
                latitude,
                longitude,
                radius,
                nearbyUsersCount: results.users.length,
                nearbyCommunitiesCount: results.communities.length,
            },
        });
        res.json(results);
    }
    catch (error) {
        logger_1.logger.error('Failed to update location and discover:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to update location and discover',
        });
    }
});
/**
 * Check if two users are within range
 * GET /api/v1/geospatial/in-range/:userId
 */
router.get('/in-range/:userId', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const targetUserId = req.params.userId;
        const inRange = await geospatial_service_1.GeospatialService.areUsersInRange(userId, targetUserId);
        res.json({ inRange });
    }
    catch (error) {
        logger_1.logger.error('Failed to check user range:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to check user range',
        });
    }
});
exports.default = router;
//# sourceMappingURL=geospatial.routes.js.map