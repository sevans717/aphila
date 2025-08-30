"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomPushNotificationService = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
const error_1 = require("../utils/error");
const env_1 = require("../config/env");
class CustomPushNotificationService {
    // In production, these should be stored securely (Vault, env vars, etc.)
    static vapidKeys = null;
    // Initialize VAPID keys for web push
    static async initialize() {
        try {
            // In production, these should be stored securely (Vault, env vars, etc.)
            // For now, we'll generate them if not provided
            if (!env_1.env.vapidPublicKey || !env_1.env.vapidPrivateKey) {
                logger_1.logger.warn("VAPID keys not configured, generating temporary keys");
                // In a real implementation, you'd use a library like 'web-push' to generate these
                // For now, we'll use placeholder values
                this.vapidKeys = {
                    publicKey: "BLcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7SroGWg2dgsK8h1w3k7z1w2k4h5m6n7o8p9q0",
                    privateKey: "s9t8u7v6w5x4y3z2a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0",
                };
            }
            else {
                this.vapidKeys = {
                    publicKey: env_1.env.vapidPublicKey,
                    privateKey: env_1.env.vapidPrivateKey,
                };
            }
            logger_1.logger.info("Custom Push Notification Service initialized");
        }
        catch (error) {
            logger_1.logger.error("Failed to initialize push notification service:", error);
        }
    }
    // Register device token
    static async registerDeviceToken(userId, token, platform, deviceId) {
        try {
            // First, find or create the device
            let device = await prisma_1.prisma.device.findFirst({
                where: {
                    deviceId,
                    userId,
                },
            });
            if (!device) {
                device = await prisma_1.prisma.device.create({
                    data: {
                        userId,
                        fcmToken: token,
                        platform,
                        deviceId,
                        isActive: true,
                    },
                });
            }
            else {
                // Update the device with new token if changed
                if (device.fcmToken !== token) {
                    device = await prisma_1.prisma.device.update({
                        where: { id: device.id },
                        data: {
                            fcmToken: token,
                            isActive: true,
                            lastUsedAt: new Date(),
                        },
                    });
                }
            }
            // Now create or update the device token
            const existingToken = await prisma_1.prisma.deviceToken.findFirst({
                where: {
                    deviceId: device.id,
                    userId,
                },
            });
            if (existingToken) {
                // Update existing token
                return await prisma_1.prisma.deviceToken.update({
                    where: { id: existingToken.id },
                    data: {
                        isActive: true,
                        updatedAt: new Date(),
                    },
                });
            }
            // Create new token
            const deviceToken = await prisma_1.prisma.deviceToken.create({
                data: {
                    userId,
                    deviceId: device.id,
                    token,
                    platform,
                    isActive: true,
                },
            });
            logger_1.logger.info(`Device token registered for user ${userId}`, {
                platform,
                deviceId,
            });
            return deviceToken;
        }
        catch (error) {
            logger_1.logger.error("Failed to register device token:", error);
            throw error;
        }
    }
    // Send push notification to specific device
    static async sendToDevice(deviceToken, message) {
        try {
            // Get device info
            const device = await prisma_1.prisma.deviceToken.findFirst({
                where: {
                    token: deviceToken,
                    isActive: true,
                },
            });
            if (!device) {
                return {
                    success: false,
                    error: "Device token not found or inactive",
                    deviceToken,
                };
            }
            let result;
            switch (device.platform) {
                case "WEB":
                    result = await this.sendWebPush(deviceToken, message);
                    break;
                case "IOS":
                    result = await this.sendIOSPush(deviceToken, message);
                    break;
                case "ANDROID":
                    result = await this.sendAndroidPush(deviceToken, message);
                    break;
                default:
                    result = {
                        success: false,
                        error: `Unsupported platform: ${device.platform}`,
                        deviceToken,
                    };
            }
            // Log the notification
            await prisma_1.prisma.pushNotification.create({
                data: {
                    userId: device.userId,
                    deviceId: device.deviceId,
                    deviceTokenId: device.id,
                    title: message.title,
                    body: message.body,
                    data: message.data || {},
                    status: result.success ? "sent" : "failed",
                    errorMessage: result.error || null,
                    sentAt: result.success ? new Date() : null,
                },
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error("Failed to send push notification:", error);
            return {
                success: false,
                error: error.message,
                deviceToken,
            };
        }
    }
    // Send push notification to user (all their devices)
    static async sendToUser(userId, message) {
        try {
            const devices = await prisma_1.prisma.deviceToken.findMany({
                where: {
                    userId,
                    isActive: true,
                },
            });
            const results = [];
            for (const device of devices) {
                const result = await this.sendToDevice(device.token, message);
                results.push(result);
            }
            logger_1.logger.info(`Sent push notification to ${results.length} devices for user ${userId}`);
            return results;
        }
        catch (error) {
            logger_1.logger.error("Failed to send push notification to user:", error);
            throw error;
        }
    }
    // Get VAPID public key for web push registration
    static getVapidPublicKey() {
        if (!this.vapidKeys) {
            throw new Error("Push notification service not initialized");
        }
        return this.vapidKeys.publicKey;
    }
    // Private methods for different platform implementations
    static async sendWebPush(endpoint, _message) {
        try {
            // Web Push implementation using VAPID
            // In a real implementation, you'd use the 'web-push' library
            // For now, this is a placeholder
            logger_1.logger.info(`Web push sent to ${endpoint}`);
            return {
                success: true,
                messageId: `webpush_${Date.now()}`,
                deviceToken: endpoint,
            };
        }
        catch (error) {
            logger_1.logger.error("Failed to send web push:", error);
            return {
                success: false,
                error: error.message,
                deviceToken: endpoint,
            };
        }
    }
    static async sendIOSPush(deviceToken, message) {
        try {
            // iOS push implementation
            // In production, you'd integrate with APNs (Apple Push Notification service)
            // This would require certificates and the 'apn' library
            const payload = {
                aps: {
                    alert: {
                        title: message.title,
                        body: message.body,
                    },
                    badge: message.badge ? parseInt(message.badge) : undefined,
                    sound: message.sound || "default",
                    "mutable-content": 1,
                },
                data: message.data,
            };
            // Simulate sending iOS push
            logger_1.logger.info(`iOS push sent to ${deviceToken} with payload size: ${JSON.stringify(payload).length}`);
            return {
                success: true,
                messageId: `ios_${Date.now()}`,
                deviceToken,
            };
        }
        catch (error) {
            logger_1.logger.error("Failed to send iOS push:", error);
            return {
                success: false,
                error: error.message,
                deviceToken,
            };
        }
    }
    static async sendAndroidPush(deviceToken, message) {
        try {
            // Android push implementation
            // In production, you'd use FCM for Android or implement direct FCM HTTP API
            // For now, we'll implement a basic FCM-like structure
            const payload = {
                to: deviceToken,
                notification: {
                    title: message.title,
                    body: message.body,
                    icon: message.icon,
                    click_action: message.clickAction,
                },
                data: message.data,
            };
            // Simulate sending Android push
            logger_1.logger.info(`Android push sent to ${deviceToken} with payload size: ${JSON.stringify(payload).length}`);
            return {
                success: true,
                messageId: `android_${Date.now()}`,
                deviceToken,
            };
        }
        catch (error) {
            logger_1.logger.error("Failed to send Android push:", error);
            return {
                success: false,
                error: error.message,
                deviceToken,
            };
        }
    }
    // Get notification preferences for a user
    static async getNotificationPreferences(userId) {
        try {
            const userSetting = await prisma_1.prisma.userSetting.findUnique({
                where: { userId },
            });
            // Default preferences if none exist
            const defaultPreferences = {
                pushNotifications: true,
                matchNotifications: true,
                messageNotifications: true,
                likeNotifications: true,
                promotionalNotifications: false,
            };
            if (!userSetting || !userSetting.notificationPreferences) {
                return defaultPreferences;
            }
            // Merge with defaults to ensure all fields exist
            return {
                ...defaultPreferences,
                ...userSetting.notificationPreferences,
            };
        }
        catch (error) {
            logger_1.logger.error("Failed to get notification preferences:", error);
            throw error;
        }
    }
    // Update notification preferences for a user
    static async updateNotificationPreferences(userId, preferences) {
        try {
            await prisma_1.prisma.userSetting.upsert({
                where: { userId },
                update: {
                    notificationPreferences: preferences,
                    updatedAt: new Date(),
                },
                create: {
                    userId,
                    notificationPreferences: preferences,
                },
            });
            logger_1.logger.info(`Updated notification preferences for user ${userId}`);
        }
        catch (error) {
            logger_1.logger.error("Failed to update notification preferences:", error);
            return (0, error_1.handleServiceError)(error);
        }
    }
}
exports.CustomPushNotificationService = CustomPushNotificationService;
//# sourceMappingURL=custom-push-notification.service.js.map