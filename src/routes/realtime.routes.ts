import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { noCache } from '../middleware/cache';
import { validateRequest } from '../middleware/validate';
import { logger } from '../utils/logger';
import { ResponseHelper } from '../utils/response';

const router = Router();

// Get global WebSocket service instance
const getWebSocketService = () => (global as any).webSocketService;

// Schemas
const sendMessageSchema = z.object({
  recipientId: z.string().uuid(),
  content: z.string().min(1).max(1000),
  type: z.enum(['text', 'image', 'file']).optional().default('text'),
  metadata: z.any().optional(),
});

const broadcastSchema = z.object({
  communityId: z.string().uuid(),
  event: z.string().min(1),
  data: z.any(),
});

const presenceSchema = z.object({
  status: z.enum(['online', 'away', 'offline']),
  deviceInfo: z.object({
    platform: z.string(),
    version: z.string(),
    deviceId: z.string(),
  }).optional(),
});

/**
 * POST /realtime/send-message - Send message via HTTP fallback
 */
router.post('/send-message',
  requireAuth,
  noCache,
  validateRequest({
    body: sendMessageSchema,
  }),
  async (req, res) => {
    try {
      const { recipientId, content, type, metadata } = req.body;
      const senderId = (req as any).user.id;
      const wsService = getWebSocketService();

      if (!wsService) {
        return ResponseHelper.serverError(res, 'WebSocket service not available');
      }

      // Try to send via WebSocket first
      const delivered = wsService.sendMessageWithFallback(recipientId, 'message', {
        id: `msg_${Date.now()}`,
        senderId,
        recipientId,
        content,
        type,
        metadata,
        timestamp: new Date().toISOString(),
      });

      logger.info('Message sent via HTTP fallback:', {
        senderId,
        recipientId,
        delivered,
        requestId: res.locals.requestId,
      });

      return ResponseHelper.success(res, {
        delivered,
        method: delivered ? 'websocket' : 'queued',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Failed to send message via HTTP fallback:', error);
      return ResponseHelper.serverError(res, 'Failed to send message');
    }
  }
);

/**
 * POST /realtime/broadcast - Broadcast to community via HTTP fallback
 */
router.post('/broadcast',
  requireAuth,
  noCache,
  validateRequest({
    body: broadcastSchema,
  }),
  async (req, res) => {
    try {
      const { communityId, event, data } = req.body;
      const userId = (req as any).user.id;
      const wsService = getWebSocketService();

      if (!wsService) {
        return ResponseHelper.serverError(res, 'WebSocket service not available');
      }

      // Verify user is member of the community
      // (You'd implement this check based on your community membership logic)

      wsService.broadcastToCommunity(communityId, event, {
        ...data,
        senderId: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info('Community broadcast sent:', {
        userId,
        communityId,
        event,
        requestId: res.locals.requestId,
      });

      return ResponseHelper.success(res, {
        broadcast: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Failed to broadcast to community:', error);
      return ResponseHelper.serverError(res, 'Failed to broadcast');
    }
  }
);

/**
 * POST /realtime/presence - Update user presence via HTTP
 */
router.post('/presence',
  requireAuth,
  noCache,
  validateRequest({
    body: presenceSchema,
  }),
  async (req, res) => {
    try {
      const { status, deviceInfo } = req.body;
      const userId = (req as any).user.id;
      const wsService = getWebSocketService();

      if (!wsService) {
        return ResponseHelper.serverError(res, 'WebSocket service not available');
      }

      wsService.setUserPresence(userId, status, deviceInfo);

      logger.info('User presence updated via HTTP:', {
        userId,
        status,
        deviceInfo,
        requestId: res.locals.requestId,
      });

      return ResponseHelper.success(res, {
        presence: status,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Failed to update presence:', error);
      return ResponseHelper.serverError(res, 'Failed to update presence');
    }
  }
);

/**
 * GET /realtime/presence/:userId - Get user presence
 */
router.get('/presence/:userId',
  requireAuth,
  noCache,
  validateRequest({
    params: z.object({
      userId: z.string().uuid(),
    }),
  }),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const wsService = getWebSocketService();

      if (!wsService) {
        return ResponseHelper.serverError(res, 'WebSocket service not available');
      }

      const presence = wsService.getUserPresence(userId);
      const isOnline = wsService.isUserOnline(userId);

      return ResponseHelper.success(res, {
        userId,
        presence,
        isOnline,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Failed to get user presence:', error);
      return ResponseHelper.serverError(res, 'Failed to get presence');
    }
  }
);

/**
 * GET /realtime/queued-messages - Get queued messages for user
 */
router.get('/queued-messages',
  requireAuth,
  noCache,
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const wsService = getWebSocketService();

      if (!wsService) {
        return ResponseHelper.serverError(res, 'WebSocket service not available');
      }

      const queuedMessages = wsService.getQueuedMessages(userId);

      logger.info('Queued messages retrieved:', {
        userId,
        messageCount: queuedMessages.length,
        requestId: res.locals.requestId,
      });

      return ResponseHelper.success(res, {
        messages: queuedMessages,
        count: queuedMessages.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Failed to get queued messages:', error);
      return ResponseHelper.serverError(res, 'Failed to get queued messages');
    }
  }
);

/**
 * DELETE /realtime/queued-messages - Clear queued messages for user
 */
router.delete('/queued-messages',
  requireAuth,
  noCache,
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const wsService = getWebSocketService();

      if (!wsService) {
        return ResponseHelper.serverError(res, 'WebSocket service not available');
      }

      wsService.clearQueuedMessages(userId);

      logger.info('Queued messages cleared:', {
        userId,
        requestId: res.locals.requestId,
      });

      return ResponseHelper.success(res, {
        cleared: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Failed to clear queued messages:', error);
      return ResponseHelper.serverError(res, 'Failed to clear queued messages');
    }
  }
);

/**
 * GET /realtime/status - Get real-time service status
 */
router.get('/status',
  requireAuth,
  noCache,
  async (req, res) => {
    try {
      const wsService = getWebSocketService();

      if (!wsService) {
        return ResponseHelper.serverError(res, 'WebSocket service not available');
      }

      const onlineUsersCount = wsService.getOnlineUsersCount();
      const onlineUsers = wsService.getOnlineUsers();

      return ResponseHelper.success(res, {
        status: 'healthy',
        onlineUsersCount,
        userOnline: onlineUsers.includes((req as any).user.id),
        timestamp: new Date().toISOString(),
        capabilities: [
          'websocket',
          'http_fallback',
          'message_queue',
          'presence_tracking',
          'community_broadcast',
        ],
      });
    } catch (error: any) {
      logger.error('Failed to get real-time status:', error);
      return ResponseHelper.serverError(res, 'Failed to get status');
    }
  }
);

export default router;
