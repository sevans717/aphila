import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import { MessagingService } from "../services/messaging.service";
import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/temp/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    logger.debug(
      `File upload attempt: ${file.originalname} (${file.mimetype}) from ${_req.ip}`
    );
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// Validation schemas
const sendMessageSchema = z.object({
  receiverId: z.string(),
  content: z.string().min(1),
  messageType: z.enum(["text", "image", "gif", "emoji"]).optional(),
});

const messageQuerySchema = z.object({
  limit: z.string().transform(Number).optional(),
  before: z.string().optional(),
});

const matchParamsSchema = z.object({
  matchId: z.string(),
});

const messageParamsSchema = z.object({
  messageId: z.string(),
});

const reportMessageSchema = z.object({
  reason: z.string().min(1),
});

const addReactionSchema = z.object({
  reaction: z.string().min(1).max(50), // emoji or reaction type
});

const removeReactionSchema = z.object({
  reaction: z.string().min(1).max(50),
});

// POST /send - Send a message
router.post(
  "/send",
  requireAuth,
  validateRequest({ body: sendMessageSchema }),
  async (req: any, res: any) => {
    try {
      const senderId = req.user!.id;
      const { receiverId, content, messageType } = req.body;

      const message = await MessagingService.sendMessage({
        senderId,
        receiverId,
        content,
        messageType,
      });

      res.status(201).json({
        success: true,
        data: {
          id: message.id,
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content,
          messageType: message.messageType,
          createdAt: message.createdAt,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// GET /match/:matchId - Get messages for a match
router.get(
  "/match/:matchId",
  requireAuth,
  validateRequest({ params: matchParamsSchema, query: messageQuerySchema }),
  async (req: any, res: any) => {
    try {
      const { matchId } = req.params;
      const filters = {
        matchId,
        ...req.query,
      };

      const messages = await MessagingService.getMatchMessages(filters);

      res.json({
        success: true,
        data: messages.map((message: any) => ({
          id: message.id,
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content,
          messageType: message.messageType,

          createdAt: message.createdAt,
          readAt: message.readAt,
          isDeleted: message.isDeleted,
          reactions: message.reactions,
        })),
        pagination: {
          hasMore: messages.length === (filters.limit || 50),
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

// PUT /match/:matchId/read - Mark messages as read
router.put(
  "/match/:matchId/read",
  requireAuth,
  validateRequest({ params: matchParamsSchema }),
  async (req: any, res: any) => {
    try {
      const { matchId } = req.params;
      const userId = req.user!.id;

      await MessagingService.markMessagesAsRead(matchId, userId);

      res.json({
        success: true,
        message: "Messages marked as read",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// GET /unread-count - Get unread message count
router.get("/unread-count", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const count = await MessagingService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// DELETE /message/:messageId - Delete a message
router.delete(
  "/message/:messageId",
  requireAuth,
  validateRequest({ params: messageParamsSchema }),
  async (req: any, res: any) => {
    try {
      const { messageId } = req.params;
      const userId = req.user!.id;

      await MessagingService.deleteMessage(messageId, userId);

      res.json({
        success: true,
        message: "Message deleted successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// GET /match/:matchId/details - Get match details with messages
router.get(
  "/match/:matchId/details",
  requireAuth,
  validateRequest({ params: matchParamsSchema }),
  async (req: any, res: any) => {
    try {
      const { matchId } = req.params;
      const userId = req.user!.id;

      const matchDetails = await MessagingService.getMatchDetails(
        matchId,
        userId
      );

      res.json({
        success: true,
        data: {
          id: matchDetails.id,
          status: matchDetails.status,
          createdAt: matchDetails.createdAt,
          otherUser: {
            id: matchDetails.otherUser.id,
            displayName: matchDetails.otherUser.profile?.displayName,
            bio: matchDetails.otherUser.profile?.bio,
            photo: matchDetails.otherUser.photos[0]?.url,
          },
          messages: matchDetails.messages.map((message: any) => ({
            id: message.id,
            senderId: message.senderId,
            receiverId: message.receiverId,
            content: message.content,
            messageType: message.messageType,

            createdAt: message.createdAt,
            readAt: message.readAt,
            isDeleted: message.isDeleted,
            reactions: message.reactions,
          })),
        },
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// POST /message/:messageId/report - Report a message
router.post(
  "/message/:messageId/report",
  requireAuth,
  validateRequest({ params: messageParamsSchema, body: reportMessageSchema }),
  async (req: any, res: any) => {
    try {
      const { messageId } = req.params;
      const { reason } = req.body;
      const reporterId = req.user!.id;

      await MessagingService.reportMessage(messageId, reporterId, reason);

      res.json({
        success: true,
        message: "Message reported successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// POST /message/:messageId/reactions - Add reaction to message
router.post(
  "/message/:messageId/reactions",
  requireAuth,
  validateRequest({ params: messageParamsSchema, body: addReactionSchema }),
  async (req: any, res: any) => {
    try {
      const { messageId } = req.params;
      const { reaction } = req.body;
      const userId = req.user!.id;

      const newReaction = await MessagingService.addReaction(
        messageId,
        userId,
        reaction
      );

      res.status(201).json({
        success: true,
        data: {
          id: newReaction.id,
          messageId: newReaction.messageId,
          userId: newReaction.userId,
          reaction: newReaction.reaction,
          createdAt: newReaction.createdAt,
          user: newReaction.user,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// DELETE /message/:messageId/reactions - Remove reaction from message
router.delete(
  "/message/:messageId/reactions",
  requireAuth,
  validateRequest({ params: messageParamsSchema, body: removeReactionSchema }),
  async (req: any, res: any) => {
    try {
      const { messageId } = req.params;
      const { reaction } = req.body;
      const userId = req.user!.id;

      await MessagingService.removeReaction(messageId, userId, reaction);

      res.json({
        success: true,
        message: "Reaction removed successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// GET /message/:messageId/reactions - Get reactions for a message
router.get(
  "/message/:messageId/reactions",
  requireAuth,
  validateRequest({ params: messageParamsSchema }),
  async (req: any, res: any) => {
    try {
      const { messageId } = req.params;

      const reactions = await MessagingService.getMessageReactions(messageId);

      res.json({
        success: true,
        data: reactions,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// POST /message/:messageId/media - Upload media for message
router.post(
  "/message/:messageId/media",
  requireAuth,
  upload.single("media"),
  validateRequest({ params: messageParamsSchema }),
  async (req: any, res: any) => {
    try {
      const { messageId } = req.params;
      const userId = req.user!.id;

      // Check if user can upload to this message
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { senderId: true, matchId: true },
      });

      if (!message || message.senderId !== userId) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized to upload media for this message",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded",
        });
      }

      const media = await MessagingService.uploadMessageMedia(
        req.file,
        messageId
      );

      res.status(201).json({
        success: true,
        data: media,
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
