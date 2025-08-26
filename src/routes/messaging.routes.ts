import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { MessagingService } from '../services/messaging.service';

const router = Router();

// Validation schemas
const sendMessageSchema = z.object({
  receiverId: z.string(),
  content: z.string().min(1),
  messageType: z.enum(['text', 'image', 'gif', 'emoji']).optional(),
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

// POST /send - Send a message
router.post(
  '/send',
  requireAuth,
  validateBody(sendMessageSchema),
  async (req: any, res: any) => {
    try {
      const senderId = req.user.id;
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
          sender: message.sender,
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
  '/match/:matchId',
  requireAuth,
  validateParams(matchParamsSchema),
  validateQuery(messageQuerySchema),
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
          sender: message.sender,
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
  '/match/:matchId/read',
  requireAuth,
  validateParams(matchParamsSchema),
  async (req: any, res: any) => {
    try {
      const { matchId } = req.params;
      const userId = req.user.id;

      await MessagingService.markMessagesAsRead(matchId, userId);

      res.json({
        success: true,
        message: 'Messages marked as read',
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
router.get(
  '/unread-count',
  requireAuth,
  async (req: any, res: any) => {
    try {
      const userId = req.user.id;
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
  }
);

// DELETE /message/:messageId - Delete a message
router.delete(
  '/message/:messageId',
  requireAuth,
  validateParams(messageParamsSchema),
  async (req: any, res: any) => {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      await MessagingService.deleteMessage(messageId, userId);

      res.json({
        success: true,
        message: 'Message deleted successfully',
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
  '/match/:matchId/details',
  requireAuth,
  validateParams(matchParamsSchema),
  async (req: any, res: any) => {
    try {
      const { matchId } = req.params;
      const userId = req.user.id;

      const matchDetails = await MessagingService.getMatchDetails(matchId, userId);

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
            sender: message.sender,
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
  '/message/:messageId/report',
  requireAuth,
  validateParams(messageParamsSchema),
  validateBody(reportMessageSchema),
  async (req: any, res: any) => {
    try {
      const { messageId } = req.params;
      const { reason } = req.body;
      const reporterId = req.user.id;

      await MessagingService.reportMessage(messageId, reporterId, reason);

      res.json({
        success: true,
        message: 'Message reported successfully',
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
