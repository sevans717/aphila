import admin from 'firebase-admin';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { handleServiceError } from '../utils/error';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface SendNotificationOptions {
  userId: string;
  payload: PushNotificationPayload;
  priority?: 'high' | 'normal';
  timeToLive?: number;
}

export class PushNotificationService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (!env.enablePushNotifications) {
      logger.info('Push notifications disabled');
      return;
    }

    if (!env.firebaseProjectId || !env.firebasePrivateKey || !env.firebaseClientEmail) {
      logger.warn('Firebase configuration missing, push notifications disabled');
      return;
    }

    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: env.firebaseProjectId,
            privateKey: env.firebasePrivateKey,
            clientEmail: env.firebaseClientEmail,
          }),
        });
      }
      
      this.isInitialized = true;
      logger.info('Push notification service initialized');
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin SDK:', error);
      return handleServiceError(error) as any;
    }
  }

  static async registerDevice(deviceData: {
    userId: string;
    fcmToken: string;
    platform: string;
    deviceId: string;
  }): Promise<any> {
    try {
      const device = await prisma.device.upsert({
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

      logger.info(`Device registered: ${deviceData.deviceId} for user ${deviceData.userId}`);
      return device;
    } catch (error) {
      logger.error('Failed to register device:', error);
      return handleServiceError(error) as any;
    }
  }

  async registerDevice(userId: string, fcmToken: string, platform: string, deviceId: string): Promise<void> {
    try {
      await prisma.device.upsert({
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

      logger.info(`Device registered: ${deviceId} for user ${userId}`);
    } catch (error) {
      logger.error('Failed to register device:', error);
      return handleServiceError(error) as any;
    }
  }

  static async unregisterDevice(userId: string, deviceToken: string): Promise<void> {
    try {
      await prisma.device.updateMany({
        where: {
          userId,
          fcmToken: deviceToken,
        },
        data: { isActive: false },
      });

      logger.info(`Device unregistered for user ${userId}`);
    } catch (error) {
      logger.error('Failed to unregister device:', error);
      return handleServiceError(error) as any;
    }
  }

  async unregisterDevice(deviceId: string): Promise<void> {
    try {
      await prisma.device.update({
        where: { deviceId },
        data: { isActive: false },
      });

      logger.info(`Device unregistered: ${deviceId}`);
    } catch (error) {
      logger.error('Failed to unregister device:', error);
      return handleServiceError(error) as any;
    }
  }

  static async getNotificationPreferences(userId: string): Promise<any> {
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
    } catch (error) {
      logger.error('Failed to get notification preferences:', error);
      return handleServiceError(error) as any;
    }
  }

  static async updateNotificationPreferences(userId: string, preferences: any): Promise<void> {
    try {
      // For now, just log the update since we don't have a notification preferences table
      // In production, you could create a separate NotificationPreferences model
      logger.info(`Updated notification preferences for user ${userId}`);
    } catch (error) {
      logger.error('Failed to update notification preferences:', error);
      return handleServiceError(error) as any;
    }
  }

  static async sendToUser(userId: string, payload: PushNotificationPayload): Promise<void> {
    const instance = new PushNotificationService();
    await instance.initialize();
    await instance.sendToUser({
      userId,
      payload,
    });
  }

  async sendToUser(options: SendNotificationOptions): Promise<boolean> {
    if (!this.isInitialized) {
      logger.warn('Push notification service not initialized');
      return false;
    }

    try {
      const devices = await prisma.device.findMany({
        where: {
          userId: options.userId,
          isActive: true,
          fcmToken: { not: null },
        },
      });

      if (devices.length === 0) {
        logger.info(`No active devices found for user ${options.userId}`);
        return false;
      }

      const tokens = devices.map(device => device.fcmToken).filter(Boolean) as string[];
      
      const message: admin.messaging.MulticastMessage = {
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

      const response = await admin.messaging().sendMulticast(message);
      
      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            logger.warn(`Failed to send notification to token ${tokens[idx]}:`, resp.error);
          }
        });

        // Remove invalid tokens
        await this.removeInvalidTokens(failedTokens);
      }

      logger.info(`Sent notifications to user ${options.userId}: ${response.successCount}/${tokens.length} successful`);
      return response.successCount > 0;
    } catch (error) {
      logger.error('Failed to send push notification:', error);
      return handleServiceError(error) as any ?? false;
    }
  }

  async sendToTopic(topic: string, payload: PushNotificationPayload): Promise<boolean> {
    if (!this.isInitialized) {
      logger.warn('Push notification service not initialized');
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        data: payload.data || {},
      };

      await admin.messaging().send(message);
      logger.info(`Sent notification to topic: ${topic}`);
      return true;
    } catch (error) {
      logger.error('Failed to send topic notification:', error);
      return handleServiceError(error) as any ?? false;
    }
  }

  async subscribeToTopic(fcmToken: string, topic: string): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await admin.messaging().subscribeToTopic([fcmToken], topic);
      logger.info(`Subscribed token to topic: ${topic}`);
    } catch (error) {
      logger.error('Failed to subscribe to topic:', error);
      return handleServiceError(error) as any;
    }
  }

  async unsubscribeFromTopic(fcmToken: string, topic: string): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await admin.messaging().unsubscribeFromTopic([fcmToken], topic);
      logger.info(`Unsubscribed token from topic: ${topic}`);
    } catch (error) {
      logger.error('Failed to unsubscribe from topic:', error);
      return handleServiceError(error) as any;
    }
  }

  private async removeInvalidTokens(tokens: string[]): Promise<void> {
    try {
      await prisma.device.updateMany({
        where: {
          fcmToken: { in: tokens },
        },
        data: {
          isActive: false,
        },
      });

      logger.info(`Removed ${tokens.length} invalid FCM tokens`);
    } catch (error) {
      logger.error('Failed to remove invalid tokens:', error);
      return handleServiceError(error) as any;
    }
  }

  async sendMatchNotification(userId: string, matchUserName: string): Promise<void> {
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

  async sendMessageNotification(userId: string, senderName: string, message: string): Promise<void> {
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

  async sendLikeNotification(userId: string, likerName: string): Promise<void> {
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
