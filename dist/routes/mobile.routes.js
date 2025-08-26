"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const media_service_1 = require("../services/media.service");
const push_notification_service_1 = require("../services/push-notification.service");
const router = (0, express_1.Router)();
// Validation schemas
const deviceRegistrationSchema = zod_1.z.object({
    token: zod_1.z.string(),
    platform: zod_1.z.enum(['ios', 'android', 'web']),
    deviceInfo: zod_1.z.object({
        model: zod_1.z.string().optional(),
        osVersion: zod_1.z.string().optional(),
        appVersion: zod_1.z.string().optional(),
    }).optional(),
});
const notificationPreferencesSchema = zod_1.z.object({
    pushNotifications: zod_1.z.boolean().optional(),
    matchNotifications: zod_1.z.boolean().optional(),
    messageNotifications: zod_1.z.boolean().optional(),
    likeNotifications: zod_1.z.boolean().optional(),
    promotionalNotifications: zod_1.z.boolean().optional(),
});
const mediaParamsSchema = zod_1.z.object({
    mediaId: zod_1.z.string(),
});
const uploadMetadataSchema = zod_1.z.object({
    caption: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    isPublic: zod_1.z.boolean().optional(),
});
// POST /device/register - Register device for push notifications
router.post('/device/register', auth_1.requireAuth, (0, validate_1.validateRequest)({ body: deviceRegistrationSchema }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { token, platform, deviceInfo } = req.body;
        const device = await push_notification_service_1.PushNotificationService.registerDevice({
            userId,
            fcmToken: token,
            platform,
            deviceId: deviceInfo,
        });
        res.status(201).json({
            success: true,
            data: device,
            message: 'Device registered successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// DELETE /device/unregister - Unregister device
router.delete('/device/unregister', auth_1.requireAuth, (0, validate_1.validateRequest)({ body: zod_1.z.object({ token: zod_1.z.string() }) }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { token } = req.body;
        await push_notification_service_1.PushNotificationService.unregisterDevice(userId, token);
        res.json({
            success: true,
            message: 'Device unregistered successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// GET /notifications/preferences - Get notification preferences
router.get('/notifications/preferences', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = await push_notification_service_1.PushNotificationService.getNotificationPreferences(userId);
        res.json({
            success: true,
            data: preferences,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// PUT /notifications/preferences - Update notification preferences
router.put('/notifications/preferences', auth_1.requireAuth, (0, validate_1.validateRequest)({ body: notificationPreferencesSchema }), async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = req.body;
        await push_notification_service_1.PushNotificationService.updateNotificationPreferences(userId, preferences);
        res.json({
            success: true,
            message: 'Notification preferences updated',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// POST /media/upload - Upload media file (simplified for example)
router.post('/media/upload', auth_1.requireAuth, (0, validate_1.validateRequest)({ body: uploadMetadataSchema }), async (req, res) => {
    try {
        // In a real app, you'd use multer middleware for file uploads
        // This is a simplified example
        const userId = req.user.id;
        const { file, type, isPrimary } = req.body;
        if (!file || !type) {
            return res.status(400).json({
                success: false,
                error: 'File and type are required',
            });
        }
        let result;
        if (type === 'photo' && isPrimary !== undefined) {
            result = await media_service_1.MediaService.uploadProfilePhoto(file, userId, isPrimary);
        }
        else {
            result = await media_service_1.MediaService.uploadFile(file, userId, type);
        }
        res.status(201).json({
            success: true,
            data: result,
            message: 'File uploaded successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// GET /media - Get user's media
router.get('/media', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { type } = req.query;
        const media = await media_service_1.MediaService.getUserMedia(userId, type);
        res.json({
            success: true,
            data: media,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// PUT /media/:mediaId - Update media metadata
router.put('/media/:mediaId', auth_1.requireAuth, (0, validate_1.validateRequest)({ params: mediaParamsSchema, body: uploadMetadataSchema }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { mediaId } = req.params;
        const metadata = req.body;
        const result = await media_service_1.MediaService.updateMediaMetadata(mediaId, userId, metadata);
        res.json({
            success: true,
            data: result,
            message: 'Media updated successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// DELETE /media/:mediaId - Delete media
router.delete('/media/:mediaId', auth_1.requireAuth, (0, validate_1.validateRequest)({ params: mediaParamsSchema }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { mediaId } = req.params;
        await media_service_1.MediaService.deleteMedia(mediaId, userId);
        res.json({
            success: true,
            message: 'Media deleted successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// GET /media/:mediaId - Get media details
router.get('/media/:mediaId', auth_1.requireAuth, (0, validate_1.validateRequest)({ params: mediaParamsSchema }), async (req, res) => {
    try {
        const { mediaId } = req.params;
        const media = await media_service_1.MediaService.getMediaById(mediaId);
        if (!media) {
            return res.status(404).json({
                success: false,
                error: 'Media not found',
            });
        }
        res.json({
            success: true,
            data: media,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// GET /app/config - Get app configuration for mobile
router.get('/app/config', async (req, res) => {
    try {
        const config = {
            apiVersion: '1.0.0',
            minAppVersion: '1.0.0',
            features: {
                videoUploads: true,
                voiceMessages: true,
                groupChats: false,
                videoChat: false,
                gifts: false,
            },
            limits: {
                maxPhotos: 6,
                maxVideoLength: 30, // seconds
                maxFileSize: 10 * 1024 * 1024, // 10MB
            },
            subscription: {
                plans: ['basic', 'premium', 'gold'],
                features: {
                    basic: ['5 likes per day', 'Basic matching'],
                    premium: ['Unlimited likes', 'See who liked you', 'Super likes'],
                    gold: ['Everything in Premium', 'Unlimited super likes', 'Boosts'],
                },
            },
            social: {
                supportEmail: 'support@sav3.app',
                privacyPolicyUrl: 'https://sav3.app/privacy',
                termsOfServiceUrl: 'https://sav3.app/terms',
            },
        };
        res.json({
            success: true,
            data: config,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// POST /app/feedback - Submit app feedback
router.post('/app/feedback', auth_1.requireAuth, (0, validate_1.validateRequest)({ body: zod_1.z.object({
        type: zod_1.z.enum(['bug', 'feature', 'general']),
        message: zod_1.z.string().min(1),
        rating: zod_1.z.number().min(1).max(5).optional(),
        deviceInfo: zod_1.z.object({
            platform: zod_1.z.string(),
            version: zod_1.z.string(),
            model: zod_1.z.string().optional(),
        }).optional(),
    }) }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, message, rating, deviceInfo } = req.body;
        // In a real app, you'd store this in a feedback table or send to support system
        console.log('📝 App Feedback:', {
            userId,
            type,
            message,
            rating,
            deviceInfo,
            timestamp: new Date(),
        });
        // For now, just create a notification for admins
        await push_notification_service_1.PushNotificationService.sendToUser(userId, {
            title: 'Feedback Received',
            body: 'Thank you for your feedback! We\'ll review it and get back to you.',
            data: { type: 'feedback_confirmation' },
        });
        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=mobile.routes.js.map