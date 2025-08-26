import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import { MediaService } from "../services/media.service";
import { PushNotificationService } from "../services/push-notification.service";

const router = Router();

// Validation schemas
const deviceRegistrationSchema = z.object({
  token: z.string(),
  platform: z.enum(["ios", "android", "web"]),
  deviceInfo: z
    .object({
      model: z.string().optional(),
      osVersion: z.string().optional(),
      appVersion: z.string().optional(),
    })
    .optional(),
});

const notificationPreferencesSchema = z.object({
  pushNotifications: z.boolean().optional(),
  matchNotifications: z.boolean().optional(),
  messageNotifications: z.boolean().optional(),
  likeNotifications: z.boolean().optional(),
  promotionalNotifications: z.boolean().optional(),
});

const mediaParamsSchema = z.object({
  mediaId: z.string(),
});

const uploadMetadataSchema = z.object({
  caption: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

// POST /device/register - Register device for push notifications
router.post(
  "/device/register",
  requireAuth,
  validateRequest({ body: deviceRegistrationSchema }),
  async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const { token, platform, deviceInfo } = req.body;

      const device = await PushNotificationService.registerDevice({
        userId,
        fcmToken: token,
        platform,
        deviceId: deviceInfo,
      });

      res.status(201).json({
        success: true,
        data: device,
        message: "Device registered successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// DELETE /device/unregister - Unregister device
router.delete(
  "/device/unregister",
  requireAuth,
  validateRequest({ body: z.object({ token: z.string() }) }),
  async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const { token } = req.body;

      await PushNotificationService.unregisterDevice(userId, token);

      res.json({
        success: true,
        message: "Device unregistered successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// GET /notifications/preferences - Get notification preferences
router.get(
  "/notifications/preferences",
  requireAuth,
  async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const preferences =
        await PushNotificationService.getNotificationPreferences(userId);

      res.json({
        success: true,
        data: preferences,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// PUT /notifications/preferences - Update notification preferences
router.put(
  "/notifications/preferences",
  requireAuth,
  validateRequest({ body: notificationPreferencesSchema }),
  async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const preferences = req.body;

      await PushNotificationService.updateNotificationPreferences(
        userId,
        preferences
      );

      res.json({
        success: true,
        message: "Notification preferences updated",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// POST /media/upload - Upload media file (simplified for example)
router.post(
  "/media/upload",
  requireAuth,
  validateRequest({ body: uploadMetadataSchema }),
  async (req: any, res: any) => {
    try {
      // In a real app, you'd use multer middleware for file uploads
      // This is a simplified example
      const userId = req.user.id;
      const { file, type, isPrimary } = req.body;

      if (!file || !type) {
        return res.status(400).json({
          success: false,
          error: "File and type are required",
        });
      }

      let result;
      if (type === "photo" && isPrimary !== undefined) {
        result = await MediaService.uploadProfilePhoto(file, userId, isPrimary);
      } else {
        result = await MediaService.uploadFile(file, userId, type);
      }

      res.status(201).json({
        success: true,
        data: result,
        message: "File uploaded successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// GET /media - Get user's media
router.get("/media", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    const media = await MediaService.getUserMedia(userId, type);

    res.json({
      success: true,
      data: media,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// PUT /media/:mediaId - Update media metadata
router.put(
  "/media/:mediaId",
  requireAuth,
  validateRequest({ params: mediaParamsSchema, body: uploadMetadataSchema }),
  async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const { mediaId } = req.params;
      const metadata = req.body;

      const result = await MediaService.updateMediaMetadata(
        mediaId,
        userId,
        metadata
      );

      res.json({
        success: true,
        data: result,
        message: "Media updated successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// DELETE /media/:mediaId - Delete media
router.delete(
  "/media/:mediaId",
  requireAuth,
  validateRequest({ params: mediaParamsSchema }),
  async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const { mediaId } = req.params;

      await MediaService.deleteMedia(mediaId, userId);

      res.json({
        success: true,
        message: "Media deleted successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// GET /media/:mediaId - Get media details
router.get(
  "/media/:mediaId",
  requireAuth,
  validateRequest({ params: mediaParamsSchema }),
  async (req: any, res: any) => {
    try {
      const { mediaId } = req.params;
      const media = await MediaService.getMediaById(mediaId);

      if (!media) {
        return res.status(404).json({
          success: false,
          error: "Media not found",
        });
      }

      res.json({
        success: true,
        data: media,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// GET /app/config - Get app configuration for mobile
router.get("/app/config", async (req: any, res: any) => {
  try {
    const config = {
      apiVersion: "1.0.0",
      minAppVersion: "1.0.0",
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
        plans: ["basic", "premium", "gold"],
        features: {
          basic: ["5 likes per day", "Basic matching"],
          premium: ["Unlimited likes", "See who liked you", "Super likes"],
          gold: ["Everything in Premium", "Unlimited super likes", "Boosts"],
        },
      },
      social: {
        supportEmail: "support@sav3.app",
        privacyPolicyUrl: "https://sav3.app/privacy",
        termsOfServiceUrl: "https://sav3.app/terms",
      },
    };

    res.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /app/feedback - Submit app feedback
router.post(
  "/app/feedback",
  requireAuth,
  validateRequest({
    body: z.object({
      type: z.enum(["bug", "feature", "general"]),
      message: z.string().min(1),
      rating: z.number().min(1).max(5).optional(),
      deviceInfo: z
        .object({
          platform: z.string(),
          version: z.string(),
          model: z.string().optional(),
        })
        .optional(),
    }),
  }),
  async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const { type, message, rating, deviceInfo } = req.body;

      // In a real app, you'd store this in a feedback table or send to support system
      console.log("📝 App Feedback:", {
        userId,
        type,
        message,
        rating,
        deviceInfo,
        timestamp: new Date(),
      });

      // For now, just create a notification for admins
      await PushNotificationService.sendToUser(userId, {
        title: "Feedback Received",
        body: "Thank you for your feedback! We'll review it and get back to you.",
        data: { type: "feedback_confirmation" },
      });

      res.status(201).json({
        success: true,
        message: "Feedback submitted successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

export default router;
