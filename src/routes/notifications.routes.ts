import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import { NotificationService } from "../services/notification.service";
import { prisma } from "../lib/prisma";

const router = Router();

// Validation schemas
const listNotificationsSchema = z.object({
  limit: z.string().transform(Number).optional(),
  cursor: z.string().optional(),
});

const markReadSchema = z.object({
  ids: z.array(z.string()),
});

// GET / - Get user's notifications
router.get(
  "/",
  requireAuth,
  validateRequest({ query: listNotificationsSchema }),
  async (req: any, res: any) => {
    try {
      const userId = (req as any).user.id;
      const { limit, cursor } = req.query;

      const result = await NotificationService.list(userId, { limit, cursor });

      res.json({
        success: true,
        data: result.items,
        pagination: {
          hasMore: !!result.nextCursor,
          nextCursor: result.nextCursor,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// PUT /read - Mark notifications as read
router.put(
  "/read",
  requireAuth,
  validateRequest({ body: markReadSchema }),
  async (req: any, res: any) => {
    try {
      const userId = (req as any).user.id;
      const { ids } = req.body;

      await NotificationService.markRead(userId, ids);

      res.json({
        success: true,
        message: "Notifications marked as read",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// PUT /read-all - Mark all notifications as read
router.put("/read-all", requireAuth, async (req: any, res: any) => {
  try {
    const userId = (req as any).user.id;

    await NotificationService.markAllRead(userId);

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /unread-count - Get unread notification count
router.get("/unread-count", requireAuth, async (req: any, res: any) => {
  try {
    const userId = (req as any).user.id;

    // Get total count and unread count
    const [total, unread] = await Promise.all([
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    res.json({
      success: true,
      data: { total, unread },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
