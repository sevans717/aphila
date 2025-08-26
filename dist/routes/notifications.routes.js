"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const analytics_service_1 = require("../services/analytics.service");
const notification_service_1 = require("../services/notification.service");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Validation schemas
const registerDeviceSchema = zod_1.z.object({
    body: zod_1.z.object({
        fcmToken: zod_1.z.string().min(1),
        platform: zod_1.z.enum(['ios', 'android', 'web']),
        deviceId: zod_1.z.string().min(1),
    }),
});
const unregisterDeviceSchema = zod_1.z.object({
    body: zod_1.z.object({
        deviceId: zod_1.z.string().min(1),
    }),
});
const testNotificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1),
        body: zod_1.z.string().min(1),
        data: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
        imageUrl: zod_1.z.string().url().optional(),
    }),
});
/**
 * Register device for push notifications
 * POST /api/v1/notifications/register-device
 */
router.post('/register-device', auth_1.auth, (0, validate_1.validate)(registerDeviceSchema), async (req, res) => {
    try {
        const { fcmToken, platform, deviceId } = req.body;
        const userId = req.user.userId;
        const pushService = global.pushNotificationService;
        await pushService.registerDevice(userId, fcmToken, platform, deviceId);
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: 'device_registered',
            platform,
            properties: {
                deviceId,
                platform,
            },
        });
        res.json({
            success: true,
            message: 'Device registered for push notifications',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to register device:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to register device',
        });
    }
});
/**
 * Unregister device from push notifications
 * POST /api/v1/notifications/unregister-device
 */
router.post('/unregister-device', auth_1.auth, (0, validate_1.validate)(unregisterDeviceSchema), async (req, res) => {
    try {
        const { deviceId } = req.body;
        const userId = req.user.userId;
        const pushService = global.pushNotificationService;
        await pushService.unregisterDevice(deviceId);
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: 'device_unregistered',
            platform: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web',
            properties: {
                deviceId,
            },
        });
        res.json({
            success: true,
            message: 'Device unregistered from push notifications',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to unregister device:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to unregister device',
        });
    }
});
/**
 * Send test notification (for testing purposes)
 * POST /api/v1/notifications/test
 */
router.post('/test', auth_1.auth, (0, validate_1.validate)(testNotificationSchema), async (req, res) => {
    try {
        const { title, body, data, imageUrl } = req.body;
        const userId = req.user.userId;
        const pushService = global.pushNotificationService;
        const success = await pushService.sendToUser({
            userId,
            payload: {
                title,
                body,
                data,
                imageUrl,
            },
        });
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: 'test_notification_sent',
            platform: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web',
            properties: {
                title,
                success,
            },
        });
        res.json({
            success,
            message: success ? 'Test notification sent' : 'Failed to send test notification',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to send test notification:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to send test notification',
        });
    }
});
/**
 * Get notification settings
 * GET /api/v1/notifications/settings
 */
router.get('/settings', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        // Get user's notification preferences from settings
        const settings = await prisma_1.prisma.userSetting.findUnique({
            where: { userId },
            select: {
                enableSounds: true,
            },
        });
        res.json({
            enableSounds: settings?.enableSounds ?? true,
            // Add more notification settings as needed
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get notification settings:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to get notification settings',
        });
    }
});
/**
 * Update notification settings
 * PUT /api/v1/notifications/settings
 */
router.put('/settings', auth_1.auth, (0, validate_1.validate)(zod_1.z.object({
    body: zod_1.z.object({
        enableSounds: zod_1.z.boolean().optional(),
        enableMatches: zod_1.z.boolean().optional(),
        enableMessages: zod_1.z.boolean().optional(),
        enableLikes: zod_1.z.boolean().optional(),
    }),
})), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { enableSounds } = req.body;
        await prisma_1.prisma.userSetting.upsert({
            where: { userId },
            update: {
                enableSounds,
            },
            create: {
                userId,
                enableSounds: enableSounds ?? true,
            },
        });
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: 'notification_settings_updated',
            platform: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web',
            properties: {
                enableSounds,
            },
        });
        res.json({
            success: true,
            message: 'Notification settings updated',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update notification settings:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to update notification settings',
        });
    }
});
/**
 * Subscribe to topic (for community notifications)
 * POST /api/v1/notifications/subscribe/:topic
 */
router.post('/subscribe/:topic', auth_1.auth, async (req, res) => {
    try {
        const { topic } = req.params;
        const userId = req.user.userId;
        // Get user's active FCM tokens
        const devices = await prisma_1.prisma.device.findMany({
            where: {
                userId,
                isActive: true,
                fcmToken: { not: null },
            },
            select: { fcmToken: true },
        });
        const pushService = global.pushNotificationService;
        // Subscribe all user's devices to the topic
        await Promise.all(devices.map((device) => pushService.subscribeToTopic(device.fcmToken, topic)));
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: 'topic_subscribed',
            platform: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web',
            properties: {
                topic,
                deviceCount: devices.length,
            },
        });
        res.json({
            success: true,
            message: `Subscribed to topic: ${topic}`,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to subscribe to topic:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to subscribe to topic',
        });
    }
});
/**
 * Unsubscribe from topic
 * POST /api/v1/notifications/unsubscribe/:topic
 */
router.post('/unsubscribe/:topic', auth_1.auth, async (req, res) => {
    try {
        const { topic } = req.params;
        const userId = req.user.userId;
        // Get user's active FCM tokens
        const devices = await prisma_1.prisma.device.findMany({
            where: {
                userId,
                isActive: true,
                fcmToken: { not: null },
            },
            select: { fcmToken: true },
        });
        const pushService = global.pushNotificationService;
        // Unsubscribe all user's devices from the topic
        await Promise.all(devices.map((device) => pushService.unsubscribeFromTopic(device.fcmToken, topic)));
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: 'topic_unsubscribed',
            platform: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web',
            properties: {
                topic,
                deviceCount: devices.length,
            },
        });
        res.json({
            success: true,
            message: `Unsubscribed from topic: ${topic}`,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to unsubscribe from topic:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to unsubscribe from topic',
        });
    }
});
/**
 * List notifications
 * GET /api/v1/notifications
 */
router.get('/', auth_1.auth, async (req, res) => {
    try {
        const { cursor, limit } = req.query;
        const userId = req.user.userId;
        const result = await notification_service_1.NotificationService.list(userId, { cursor, limit: limit ? parseInt(limit, 10) : undefined });
        res.json({ success: true, data: result });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to list notifications' });
    }
});
/**
 * Mark notifications as read
 * POST /api/v1/notifications/mark-read
 */
router.post('/mark-read', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const ids = req.body.ids || [];
        const result = await notification_service_1.NotificationService.markRead(userId, ids);
        res.json({ success: true, data: result });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to mark read' });
    }
});
/**
 * Mark all notifications as read
 * POST /api/v1/notifications/mark-all-read
 */
router.post('/mark-all-read', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await notification_service_1.NotificationService.markAllRead(userId);
        res.json({ success: true, data: result });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to mark all read' });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.routes.js.map