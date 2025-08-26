import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { auth } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import { AnalyticsService } from "../services/analytics.service";
import { NotificationService } from "../services/notification.service";
import { PushNotificationService } from "../services/push-notification.service";
import { logger } from "../utils/logger";

const router = Router();

// Validation schemas (match ValidationOptions shape)
const registerDeviceSchema = {
  body: z.object({
    fcmToken: z.string().min(1),
    platform: z.enum(["ios", "android", "web"]),
    deviceId: z.string().min(1),
  }),
};
const unregisterDeviceSchema = {
  body: z.object({ deviceId: z.string().min(1) }),
};
const testNotificationSchema = {
  body: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    data: z.record(z.string(), z.string()).optional(),
    imageUrl: z.string().url().optional(),
  }),
};

/**
 * Register device for push notifications
 * POST /api/v1/notifications/register-device
 */
router.post(
  "/register-device",
  auth,
  validateRequest(registerDeviceSchema),
  async (req, res) => {
    try {
      const { fcmToken, platform, deviceId } = req.body;
      const userId = req.user!.userId;

      const pushService = (global as any)
        .pushNotificationService as PushNotificationService;
      await pushService.registerDevice(userId, fcmToken, platform, deviceId);

      // Track analytics
      await AnalyticsService.trackEvent({
        userId,
        event: "device_registered",
        platform,
        properties: {
          deviceId,
          platform,
        },
      });

      res.json({
        success: true,
        message: "Device registered for push notifications",
      });
    } catch (error: any) {
      logger.error("Failed to register device:", error);
      res.status(500).json({
        error: "InternalServerError",
        message: "Failed to register device",
      });
    }
  }
);

/**
 * Unregister device from push notifications
 * POST /api/v1/notifications/unregister-device
 */
router.post(
  "/unregister-device",
  auth,
  validateRequest(unregisterDeviceSchema),
  async (req, res) => {
    try {
      const { deviceId } = req.body;
      const userId = req.user!.userId;

      const pushService = (global as any)
        .pushNotificationService as PushNotificationService;
      await pushService.unregisterDevice(deviceId);

      // Track analytics
      await AnalyticsService.trackEvent({
        userId,
        event: "device_unregistered",
        platform: req.headers["user-agent"]?.includes("Mobile")
          ? "mobile"
          : "web",
        properties: {
          deviceId,
        },
      });

      res.json({
        success: true,
        message: "Device unregistered from push notifications",
      });
    } catch (error: any) {
      logger.error("Failed to unregister device:", error);
      res.status(500).json({
        error: "InternalServerError",
        message: "Failed to unregister device",
      });
    }
  }
);

/**
 * Send test notification (for testing purposes)
 * POST /api/v1/notifications/test
 */
router.post(
  "/test",
  auth,
  validateRequest(testNotificationSchema),
  async (req, res) => {
    try {
      const { title, body, data, imageUrl } = req.body;
      const userId = req.user!.userId;

      const pushService = (global as any)
        .pushNotificationService as PushNotificationService;
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
      await AnalyticsService.trackEvent({
        userId,
        event: "test_notification_sent",
        platform: req.headers["user-agent"]?.includes("Mobile")
          ? "mobile"
          : "web",
        properties: {
          title,
          success,
        },
      });

      res.json({
        success,
        message: success
          ? "Test notification sent"
          : "Failed to send test notification",
      });
    } catch (error: any) {
      logger.error("Failed to send test notification:", error);
      res.status(500).json({
        error: "InternalServerError",
        message: "Failed to send test notification",
      });
    }
  }
);

/**
 * Get notification settings
 * GET /api/v1/notifications/settings
 */
router.get("/settings", auth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    // Get user's notification preferences from settings
    const settings = await prisma.userSetting.findUnique({
      where: { userId },
      select: {
        enableSounds: true,
      },
    });

    res.json({
      enableSounds: settings?.enableSounds ?? true,
      // Add more notification settings as needed
    });
  } catch (error: any) {
    logger.error("Failed to get notification settings:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to get notification settings",
    });
  }
});

/**
 * Update notification settings
 * PUT /api/v1/notifications/settings
 */
router.put(
  "/settings",
  auth,
  validateRequest({
    body: z.object({
      enableSounds: z.boolean().optional(),
      enableMatches: z.boolean().optional(),
      enableMessages: z.boolean().optional(),
      enableLikes: z.boolean().optional(),
    }),
  }),
  async (req, res) => {
    try {
      const userId = req.user!.userId;
      const { enableSounds } = req.body;

      await prisma.userSetting.upsert({
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
      await AnalyticsService.trackEvent({
        userId,
        event: "notification_settings_updated",
        platform: req.headers["user-agent"]?.includes("Mobile")
          ? "mobile"
          : "web",
        properties: {
          enableSounds,
        },
      });

      res.json({
        success: true,
        message: "Notification settings updated",
      });
    } catch (error: any) {
      logger.error("Failed to update notification settings:", error);
      res.status(500).json({
        error: "InternalServerError",
        message: "Failed to update notification settings",
      });
    }
  }
);

/**
 * Subscribe to topic (for community notifications)
 * POST /api/v1/notifications/subscribe/:topic
 */
const topicParamSchema = {
  params: z.object({ topic: z.string().min(1) }),
};

router.post(
  "/subscribe/:topic",
  auth,
  validateRequest(topicParamSchema),
  async (req, res) => {
    try {
      const { topic } = req.params;
      const userId = req.user!.userId;

      // Get user's active FCM tokens
      const devices = await prisma.device.findMany({
        where: {
          userId,
          isActive: true,
          fcmToken: { not: null },
        },
        select: { fcmToken: true },
      });

      const pushService = (global as any)
        .pushNotificationService as PushNotificationService;

      // Subscribe all user's devices to the topic
      await Promise.all(
        devices.map((device: any) =>
          pushService.subscribeToTopic(device.fcmToken!, topic)
        )
      );

      // Track analytics
      await AnalyticsService.trackEvent({
        userId,
        event: "topic_subscribed",
        platform: req.headers["user-agent"]?.includes("Mobile")
          ? "mobile"
          : "web",
        properties: {
          topic,
          deviceCount: devices.length,
        },
      });

      res.json({
        success: true,
        message: `Subscribed to topic: ${topic}`,
      });
    } catch (error: any) {
      logger.error("Failed to subscribe to topic:", error);
      res.status(500).json({
        error: "InternalServerError",
        message: "Failed to subscribe to topic",
      });
    }
  }
);

/**
 * Unsubscribe from topic
 * POST /api/v1/notifications/unsubscribe/:topic
 */
router.post(
  "/unsubscribe/:topic",
  auth,
  validateRequest(topicParamSchema),
  async (req, res) => {
    try {
      const { topic } = req.params;
      const userId = req.user!.userId;

      // Get user's active FCM tokens
      const devices = await prisma.device.findMany({
        where: {
          userId,
          isActive: true,
          fcmToken: { not: null },
        },
        select: { fcmToken: true },
      });

      const pushService = (global as any)
        .pushNotificationService as PushNotificationService;

      // Unsubscribe all user's devices from the topic
      await Promise.all(
        devices.map((device: any) =>
          pushService.unsubscribeFromTopic(device.fcmToken!, topic)
        )
      );

      // Track analytics
      await AnalyticsService.trackEvent({
        userId,
        event: "topic_unsubscribed",
        platform: req.headers["user-agent"]?.includes("Mobile")
          ? "mobile"
          : "web",
        properties: {
          topic,
          deviceCount: devices.length,
        },
      });

      res.json({
        success: true,
        message: `Unsubscribed from topic: ${topic}`,
      });
    } catch (error: any) {
      logger.error("Failed to unsubscribe from topic:", error);
      res.status(500).json({
        error: "InternalServerError",
        message: "Failed to unsubscribe from topic",
      });
    }
  }
);

/**
 * List notifications
 * GET /api/v1/notifications
 */
router.get("/", auth, async (req, res) => {
  try {
    const { cursor, limit } = req.query as any;
    const userId = (req.user as any).userId;
    const result = await NotificationService.list(userId, {
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to list notifications" });
  }
});

/**
 * Mark notifications as read
 * POST /api/v1/notifications/mark-read
 */
const markReadSchema = {
  body: z.object({ ids: z.array(z.string().uuid()).optional() }),
};

router.post(
  "/mark-read",
  auth,
  validateRequest(markReadSchema),
  async (req, res) => {
    try {
      const userId = (req.user as any).userId;
      const ids: string[] = req.body.ids || [];
      const result = await NotificationService.markRead(userId, ids);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to mark read" });
    }
  }
);

/**
 * Mark all notifications as read
 * POST /api/v1/notifications/mark-all-read
 */
router.post("/mark-all-read", auth, validateRequest({}), async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    const result = await NotificationService.markAllRead(userId);
    res.json({ success: true, data: result });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to mark all read" });
  }
});

export default router;
