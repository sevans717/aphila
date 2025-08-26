import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { auth } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { AnalyticsService } from '../services/analytics.service';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const trackEventSchema = z.object({
  body: z.object({
    event: z.string().min(1),
    properties: z.record(z.string(), z.any()).optional(),
    platform: z.string().optional(),
    appVersion: z.string().optional(),
    deviceInfo: z.record(z.string(), z.any()).optional(),
  }),
});

const sessionSchema = z.object({
  body: z.object({
    platform: z.string().min(1),
    appVersion: z.string().optional(),
    sessionDuration: z.number().optional(),
  }),
});

/**
 * Track user event
 * POST /api/v1/analytics/event
 */
router.post('/event',
  auth,
  validateRequest({ body: trackEventSchema.shape.body }),
  async (req, res) => {
    try {
      const { event, properties, platform, appVersion, deviceInfo } = req.body;
      const userId = req.user!.userId;

      await AnalyticsService.trackEvent({
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
    } catch (error: any) {
      logger.error('Failed to track event:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Failed to track event',
      });
    }
  }
);

/**
 * Track session start
 * POST /api/v1/analytics/session/start
 */
router.post('/session/start',
  auth,
  validateRequest({ body: sessionSchema.shape.body }),
  async (req, res) => {
    try {
      const { platform, appVersion } = req.body;
      const userId = req.user!.userId;

      await AnalyticsService.trackSessionStart(userId, platform, appVersion);

      res.json({
        success: true,
        message: 'Session start tracked',
      });
    } catch (error: any) {
      logger.error('Failed to track session start:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Failed to track session start',
      });
    }
  }
);

/**
 * Track session end
 * POST /api/v1/analytics/session/end
 */
router.post('/session/end',
  auth,
  validateRequest({ body: z.object({
      platform: z.string().min(1),
      sessionDuration: z.number().min(0),
      appVersion: z.string().optional(),
    }) }),
  async (req, res) => {
    try {
      const { platform, sessionDuration, appVersion } = req.body;
      const userId = req.user!.userId;

      await AnalyticsService.trackSessionEnd(userId, platform, sessionDuration, appVersion);

      res.json({
        success: true,
        message: 'Session end tracked',
      });
    } catch (error: any) {
      logger.error('Failed to track session end:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Failed to track session end',
      });
    }
  }
);

/**
 * Track swipe action
 * POST /api/v1/analytics/swipe
 */
router.post('/swipe',
  auth,
  validateRequest({ body: z.object({
      targetUserId: z.string().min(1),
      action: z.enum(['like', 'pass', 'super_like']),
      platform: z.string().min(1),
    }) }),
  async (req, res) => {
    try {
      const { targetUserId, action, platform } = req.body;
      const userId = req.user!.userId;

      await AnalyticsService.trackSwipe(userId, targetUserId, action, platform);

      res.json({
        success: true,
        message: 'Swipe action tracked',
      });
    } catch (error: any) {
      logger.error('Failed to track swipe:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Failed to track swipe',
      });
    }
  }
);

/**
 * Track feature usage
 * POST /api/v1/analytics/feature
 */
router.post('/feature',
  auth,
  validateRequest({ body: z.object({
      feature: z.string().min(1),
      action: z.string().min(1),
      platform: z.string().min(1),
      metadata: z.record(z.string(), z.any()).optional(),
    }) }),
  async (req, res) => {
    try {
      const { feature, action, platform, metadata } = req.body;
      const userId = req.user!.userId;

      await AnalyticsService.trackFeatureUsage(userId, feature, action, platform, metadata);

      res.json({
        success: true,
        message: 'Feature usage tracked',
      });
    } catch (error: any) {
      logger.error('Failed to track feature usage:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Failed to track feature usage',
      });
    }
  }
);

/**
 * Get user metrics (admin only)
 * GET /api/v1/analytics/metrics/users
 */
router.get('/metrics/users',
  auth,
  async (req, res) => {
    try {
      const userId = req.user!.userId;
      
      // Check if user is admin
      const user = await prisma.user.findUnique({
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
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const metrics = await AnalyticsService.getUserMetrics(start, end);

      res.json(metrics);
    } catch (error: any) {
      logger.error('Failed to get user metrics:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Failed to get user metrics',
      });
    }
  }
);

/**
 * Get engagement metrics (admin only)
 * GET /api/v1/analytics/metrics/engagement
 */
router.get('/metrics/engagement',
  auth,
  async (req, res) => {
    try {
      const userId = req.user!.userId;
      
      // Check if user is admin
      const user = await prisma.user.findUnique({
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
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const metrics = await AnalyticsService.getEngagementMetrics(start, end);

      res.json(metrics);
    } catch (error: any) {
      logger.error('Failed to get engagement metrics:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Failed to get engagement metrics',
      });
    }
  }
);

/**
 * Get platform distribution (admin only)
 * GET /api/v1/analytics/metrics/platforms
 */
router.get('/metrics/platforms',
  auth,
  async (req, res) => {
    try {
      const userId = req.user!.userId;
      
      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      if (!user?.isAdmin) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Admin access required',
        });
      }

      const distribution = await AnalyticsService.getPlatformDistribution();

      res.json(distribution);
    } catch (error: any) {
      logger.error('Failed to get platform distribution:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Failed to get platform distribution',
      });
    }
  }
);

/**
 * Get conversion funnel (admin only)
 * GET /api/v1/analytics/funnel
 */
router.get('/funnel',
  auth,
  async (req, res) => {
    try {
      const userId = req.user!.userId;
      
      // Check if user is admin
      const user = await prisma.user.findUnique({
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
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const funnel = await AnalyticsService.getConversionFunnel(start, end);

      res.json(funnel);
    } catch (error: any) {
      logger.error('Failed to get conversion funnel:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Failed to get conversion funnel',
      });
    }
  }
);

export default router;
