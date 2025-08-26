"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const analytics_service_1 = require("../services/analytics.service");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Validation schemas
const trackEventSchema = zod_1.z.object({
    body: zod_1.z.object({
        event: zod_1.z.string().min(1),
        properties: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
        platform: zod_1.z.string().optional(),
        appVersion: zod_1.z.string().optional(),
        deviceInfo: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    }),
});
const sessionSchema = zod_1.z.object({
    body: zod_1.z.object({
        platform: zod_1.z.string().min(1),
        appVersion: zod_1.z.string().optional(),
        sessionDuration: zod_1.z.number().optional(),
    }),
});
/**
 * Track user event
 * POST /api/v1/analytics/event
 */
router.post('/event', auth_1.auth, (0, validate_1.validate)(trackEventSchema), async (req, res) => {
    try {
        const { event, properties, platform, appVersion, deviceInfo } = req.body;
        const userId = req.user.userId;
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event,
            properties,
            platform: platform || req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web',
            appVersion,
            deviceInfo,
        });
        res.json({
            success: true,
            message: 'Event tracked successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to track event:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to track event',
        });
    }
});
/**
 * Track session start
 * POST /api/v1/analytics/session/start
 */
router.post('/session/start', auth_1.auth, (0, validate_1.validate)(sessionSchema), async (req, res) => {
    try {
        const { platform, appVersion } = req.body;
        const userId = req.user.userId;
        await analytics_service_1.AnalyticsService.trackSessionStart(userId, platform, appVersion);
        res.json({
            success: true,
            message: 'Session start tracked',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to track session start:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to track session start',
        });
    }
});
/**
 * Track session end
 * POST /api/v1/analytics/session/end
 */
router.post('/session/end', auth_1.auth, (0, validate_1.validate)(zod_1.z.object({
    body: zod_1.z.object({
        platform: zod_1.z.string().min(1),
        sessionDuration: zod_1.z.number().min(0),
        appVersion: zod_1.z.string().optional(),
    }),
})), async (req, res) => {
    try {
        const { platform, sessionDuration, appVersion } = req.body;
        const userId = req.user.userId;
        await analytics_service_1.AnalyticsService.trackSessionEnd(userId, platform, sessionDuration, appVersion);
        res.json({
            success: true,
            message: 'Session end tracked',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to track session end:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to track session end',
        });
    }
});
/**
 * Track swipe action
 * POST /api/v1/analytics/swipe
 */
router.post('/swipe', auth_1.auth, (0, validate_1.validate)(zod_1.z.object({
    body: zod_1.z.object({
        targetUserId: zod_1.z.string().min(1),
        action: zod_1.z.enum(['like', 'pass', 'super_like']),
        platform: zod_1.z.string().min(1),
    }),
})), async (req, res) => {
    try {
        const { targetUserId, action, platform } = req.body;
        const userId = req.user.userId;
        await analytics_service_1.AnalyticsService.trackSwipe(userId, targetUserId, action, platform);
        res.json({
            success: true,
            message: 'Swipe action tracked',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to track swipe:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to track swipe',
        });
    }
});
/**
 * Track feature usage
 * POST /api/v1/analytics/feature
 */
router.post('/feature', auth_1.auth, (0, validate_1.validate)(zod_1.z.object({
    body: zod_1.z.object({
        feature: zod_1.z.string().min(1),
        action: zod_1.z.string().min(1),
        platform: zod_1.z.string().min(1),
        metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    }),
})), async (req, res) => {
    try {
        const { feature, action, platform, metadata } = req.body;
        const userId = req.user.userId;
        await analytics_service_1.AnalyticsService.trackFeatureUsage(userId, feature, action, platform, metadata);
        res.json({
            success: true,
            message: 'Feature usage tracked',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to track feature usage:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to track feature usage',
        });
    }
});
/**
 * Get user metrics (admin only)
 * GET /api/v1/analytics/metrics/users
 */
router.get('/metrics/users', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        // Check if user is admin
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { isAdmin: true },
        });
        if (!user?.isAdmin) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Admin access required',
            });
        }
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const metrics = await analytics_service_1.AnalyticsService.getUserMetrics(start, end);
        res.json(metrics);
    }
    catch (error) {
        logger_1.logger.error('Failed to get user metrics:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to get user metrics',
        });
    }
});
/**
 * Get engagement metrics (admin only)
 * GET /api/v1/analytics/metrics/engagement
 */
router.get('/metrics/engagement', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        // Check if user is admin
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { isAdmin: true },
        });
        if (!user?.isAdmin) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Admin access required',
            });
        }
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const metrics = await analytics_service_1.AnalyticsService.getEngagementMetrics(start, end);
        res.json(metrics);
    }
    catch (error) {
        logger_1.logger.error('Failed to get engagement metrics:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to get engagement metrics',
        });
    }
});
/**
 * Get platform distribution (admin only)
 * GET /api/v1/analytics/metrics/platforms
 */
router.get('/metrics/platforms', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        // Check if user is admin
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { isAdmin: true },
        });
        if (!user?.isAdmin) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Admin access required',
            });
        }
        const distribution = await analytics_service_1.AnalyticsService.getPlatformDistribution();
        res.json(distribution);
    }
    catch (error) {
        logger_1.logger.error('Failed to get platform distribution:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to get platform distribution',
        });
    }
});
/**
 * Get conversion funnel (admin only)
 * GET /api/v1/analytics/funnel
 */
router.get('/funnel', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        // Check if user is admin
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { isAdmin: true },
        });
        if (!user?.isAdmin) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Admin access required',
            });
        }
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const funnel = await analytics_service_1.AnalyticsService.getConversionFunnel(start, end);
        res.json(funnel);
    }
    catch (error) {
        logger_1.logger.error('Failed to get conversion funnel:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to get conversion funnel',
        });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map