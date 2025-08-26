"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushNotificationService = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const env_1 = require("../config/env");
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
class PushNotificationService {
    isInitialized = false;
    async initialize() {
        if (!env_1.env.enablePushNotifications) {
            logger_1.logger.info('Push notifications disabled');
            return;
        }
        if (!env_1.env.firebaseProjectId || !env_1.env.firebasePrivateKey || !env_1.env.firebaseClientEmail) {
            logger_1.logger.warn('Firebase configuration missing, push notifications disabled');
            return;
        }
        try {
            if (!firebase_admin_1.default.apps.length) {
                firebase_admin_1.default.initializeApp({
                    credential: firebase_admin_1.default.credential.cert({
                        projectId: env_1.env.firebaseProjectId,
                        privateKey: env_1.env.firebasePrivateKey,
                        clientEmail: env_1.env.firebaseClientEmail,
                    }),
                });
            }
            this.isInitialized = true;
            logger_1.logger.info('Push notification service initialized');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Firebase Admin SDK:', error);
            throw error;
        }
    }
    static async registerDevice(deviceData) {
        try {
            const device = await prisma_1.prisma.device.upsert({
                where: { deviceId: deviceData.deviceId },
                update: {
                    fcmToken: deviceData.fcmToken,
                    platform: deviceData.platform,
                    isActive: true,
                    lastUsedAt: new Date(),
                },
                create: {
                    userId: deviceData.userId,
                    fcmToken: deviceData.fcmToken,
                    platform: deviceData.platform,
                    deviceId: deviceData.deviceId,
                    isActive: true,
                },
            });
            logger_1.logger.info(`Device registered: ${deviceData.deviceId} for user ${deviceData.userId}`);
            return device;
        }
        catch (error) {
            logger_1.logger.error('Failed to register device:', error);
            throw error;
        }
    }
    async registerDevice(userId, fcmToken, platform, deviceId) {
        try {
            await prisma_1.prisma.device.upsert({
                where: { deviceId },
                update: {
                    fcmToken,
                    platform,
                    isActive: true,
                    lastUsedAt: new Date(),
                },
                create: {
                    userId,
                    fcmToken,
                    platform,
                    deviceId,
                    isActive: true,
                },
            });
            logger_1.logger.info(`Device registered: ${deviceId} for user ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to register device:', error);
            throw error;
        }
    }
    static async unregisterDevice(userId, deviceToken) {
        try {
            await prisma_1.prisma.device.updateMany({
                where: {
                    userId,
                    fcmToken: deviceToken,
                },
                data: { isActive: false },
            });
            logger_1.logger.info(`Device unregistered for user ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to unregister device:', error);
            throw error;
        }
    }
    async unregisterDevice(deviceId) {
        try {
            await prisma_1.prisma.device.update({
                where: { deviceId },
                data: { isActive: false },
            });
            logger_1.logger.info(`Device unregistered: ${deviceId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to unregister device:', error);
            throw error;
        }
    }
    static async getNotificationPreferences(userId) {
        try {
            // For now, return default preferences since we don't have a notification preferences table
            // In production, you could create a separate NotificationPreferences model
            return {
                pushEnabled: true,
                emailEnabled: true,
                matches: true,
                messages: true,
                likes: true,
                superLikes: true,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get notification preferences:', error);
            throw error;
        }
    }
    static async updateNotificationPreferences(userId, preferences) {
        try {
            // For now, just log the update since we don't have a notification preferences table
            // In production, you could create a separate NotificationPreferences model
            logger_1.logger.info(`Updated notification preferences for user ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to update notification preferences:', error);
            throw error;
        }
    }
    static async sendToUser(userId, payload) {
        const instance = new PushNotificationService();
        await instance.initialize();
        await instance.sendToUser({
            userId,
            payload,
        });
    }
    async sendToUser(options) {
        if (!this.isInitialized) {
            logger_1.logger.warn('Push notification service not initialized');
            return false;
        }
        try {
            const devices = await prisma_1.prisma.device.findMany({
                where: {
                    userId: options.userId,
                    isActive: true,
                    fcmToken: { not: null },
                },
            });
            if (devices.length === 0) {
                logger_1.logger.info(`No active devices found for user ${options.userId}`);
                return false;
            }
            const tokens = devices.map(device => device.fcmToken).filter(Boolean);
            const message = {
                tokens,
                notification: {
                    title: options.payload.title,
                    body: options.payload.body,
                    ...(options.payload.imageUrl && { imageUrl: options.payload.imageUrl }),
                },
                data: options.payload.data || {},
                android: {
                    priority: options.priority || 'high',
                    ttl: options.timeToLive || 24 * 60 * 60 * 1000, // 24 hours
                    notification: {
                        sound: 'default',
                        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                        },
                    },
                },
            };
            const response = await firebase_admin_1.default.messaging().sendMulticast(message);
            // Handle failed tokens
            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx]);
                        logger_1.logger.warn(`Failed to send notification to token ${tokens[idx]}:`, resp.error);
                    }
                });
                // Remove invalid tokens
                await this.removeInvalidTokens(failedTokens);
            }
            logger_1.logger.info(`Sent notifications to user ${options.userId}: ${response.successCount}/${tokens.length} successful`);
            return response.successCount > 0;
        }
        catch (error) {
            logger_1.logger.error('Failed to send push notification:', error);
            return false;
        }
    }
    async sendToTopic(topic, payload) {
        if (!this.isInitialized) {
            logger_1.logger.warn('Push notification service not initialized');
            return false;
        }
        try {
            const message = {
                topic,
                notification: {
                    title: payload.title,
                    body: payload.body,
                    ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
                },
                data: payload.data || {},
            };
            await firebase_admin_1.default.messaging().send(message);
            logger_1.logger.info(`Sent notification to topic: ${topic}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to send topic notification:', error);
            return false;
        }
    }
    async subscribeToTopic(fcmToken, topic) {
        if (!this.isInitialized)
            return;
        try {
            await firebase_admin_1.default.messaging().subscribeToTopic([fcmToken], topic);
            logger_1.logger.info(`Subscribed token to topic: ${topic}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to subscribe to topic:', error);
        }
    }
    async unsubscribeFromTopic(fcmToken, topic) {
        if (!this.isInitialized)
            return;
        try {
            await firebase_admin_1.default.messaging().unsubscribeFromTopic([fcmToken], topic);
            logger_1.logger.info(`Unsubscribed token from topic: ${topic}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to unsubscribe from topic:', error);
        }
    }
    async removeInvalidTokens(tokens) {
        try {
            await prisma_1.prisma.device.updateMany({
                where: {
                    fcmToken: { in: tokens },
                },
                data: {
                    isActive: false,
                },
            });
            logger_1.logger.info(`Removed ${tokens.length} invalid FCM tokens`);
        }
        catch (error) {
            logger_1.logger.error('Failed to remove invalid tokens:', error);
        }
    }
    async sendMatchNotification(userId, matchUserName) {
        await this.sendToUser({
            userId,
            payload: {
                title: '🎉 New Match!',
                body: `You matched with ${matchUserName}`,
                data: {
                    type: 'match',
                    action: 'open_chat',
                },
            },
        });
    }
    async sendMessageNotification(userId, senderName, message) {
        await this.sendToUser({
            userId,
            payload: {
                title: senderName,
                body: message.length > 50 ? message.substring(0, 50) + '...' : message,
                data: {
                    type: 'message',
                    action: 'open_chat',
                },
            },
        });
    }
    async sendLikeNotification(userId, likerName) {
        await this.sendToUser({
            userId,
            payload: {
                title: 'Someone likes you! 💖',
                body: `${likerName} liked your profile`,
                data: {
                    type: 'like',
                    action: 'open_discovery',
                },
            },
        });
    }
}
exports.PushNotificationService = PushNotificationService;
//# sourceMappingURL=push-notification.service.js.map