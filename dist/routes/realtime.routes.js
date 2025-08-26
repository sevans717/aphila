"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const cache_1 = require("../middleware/cache");
const validate_1 = require("../middleware/validate");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
// Get global WebSocket service instance
const getWebSocketService = () => global.webSocketService;
// Schemas
const sendMessageSchema = zod_1.z.object({
    recipientId: zod_1.z.string().uuid(),
    content: zod_1.z.string().min(1).max(1000),
    type: zod_1.z.enum(['text', 'image', 'file']).optional().default('text'),
    metadata: zod_1.z.any().optional(),
});
const broadcastSchema = zod_1.z.object({
    communityId: zod_1.z.string().uuid(),
    event: zod_1.z.string().min(1),
    data: zod_1.z.any(),
});
const presenceSchema = zod_1.z.object({
    status: zod_1.z.enum(['online', 'away', 'offline']),
    deviceInfo: zod_1.z.object({
        platform: zod_1.z.string(),
        version: zod_1.z.string(),
        deviceId: zod_1.z.string(),
    }).optional(),
});
/**
 * POST /realtime/send-message - Send message via HTTP fallback
 */
router.post('/send-message', auth_1.requireAuth, cache_1.noCache, (0, validate_1.validateRequest)({
    body: sendMessageSchema,
}), async (req, res) => {
    try {
        const { recipientId, content, type, metadata } = req.body;
        const senderId = req.user.id;
        const wsService = getWebSocketService();
        if (!wsService) {
            return response_1.ResponseHelper.serverError(res, 'WebSocket service not available');
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
        logger_1.logger.info('Message sent via HTTP fallback:', {
            senderId,
            recipientId,
            delivered,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, {
            delivered,
            method: delivered ? 'websocket' : 'queued',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to send message via HTTP fallback:', error);
        return response_1.ResponseHelper.serverError(res, 'Failed to send message');
    }
});
/**
 * POST /realtime/broadcast - Broadcast to community via HTTP fallback
 */
router.post('/broadcast', auth_1.requireAuth, cache_1.noCache, (0, validate_1.validateRequest)({
    body: broadcastSchema,
}), async (req, res) => {
    try {
        const { communityId, event, data } = req.body;
        const userId = req.user.id;
        const wsService = getWebSocketService();
        if (!wsService) {
            return response_1.ResponseHelper.serverError(res, 'WebSocket service not available');
        }
        // Verify user is member of the community
        // (You'd implement this check based on your community membership logic)
        wsService.broadcastToCommunity(communityId, event, {
            ...data,
            senderId: userId,
            timestamp: new Date().toISOString(),
        });
        logger_1.logger.info('Community broadcast sent:', {
            userId,
            communityId,
            event,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, {
            broadcast: true,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to broadcast to community:', error);
        return response_1.ResponseHelper.serverError(res, 'Failed to broadcast');
    }
});
/**
 * POST /realtime/presence - Update user presence via HTTP
 */
router.post('/presence', auth_1.requireAuth, cache_1.noCache, (0, validate_1.validateRequest)({
    body: presenceSchema,
}), async (req, res) => {
    try {
        const { status, deviceInfo } = req.body;
        const userId = req.user.id;
        const wsService = getWebSocketService();
        if (!wsService) {
            return response_1.ResponseHelper.serverError(res, 'WebSocket service not available');
        }
        wsService.setUserPresence(userId, status, deviceInfo);
        logger_1.logger.info('User presence updated via HTTP:', {
            userId,
            status,
            deviceInfo,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, {
            presence: status,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update presence:', error);
        return response_1.ResponseHelper.serverError(res, 'Failed to update presence');
    }
});
/**
 * GET /realtime/presence/:userId - Get user presence
 */
router.get('/presence/:userId', auth_1.requireAuth, cache_1.noCache, (0, validate_1.validateRequest)({
    params: zod_1.z.object({
        userId: zod_1.z.string().uuid(),
    }),
}), async (req, res) => {
    try {
        const { userId } = req.params;
        const wsService = getWebSocketService();
        if (!wsService) {
            return response_1.ResponseHelper.serverError(res, 'WebSocket service not available');
        }
        const presence = wsService.getUserPresence(userId);
        const isOnline = wsService.isUserOnline(userId);
        return response_1.ResponseHelper.success(res, {
            userId,
            presence,
            isOnline,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get user presence:', error);
        return response_1.ResponseHelper.serverError(res, 'Failed to get presence');
    }
});
/**
 * GET /realtime/queued-messages - Get queued messages for user
 */
router.get('/queued-messages', auth_1.requireAuth, cache_1.noCache, async (req, res) => {
    try {
        const userId = req.user.id;
        const wsService = getWebSocketService();
        if (!wsService) {
            return response_1.ResponseHelper.serverError(res, 'WebSocket service not available');
        }
        const queuedMessages = wsService.getQueuedMessages(userId);
        logger_1.logger.info('Queued messages retrieved:', {
            userId,
            messageCount: queuedMessages.length,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, {
            messages: queuedMessages,
            count: queuedMessages.length,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get queued messages:', error);
        return response_1.ResponseHelper.serverError(res, 'Failed to get queued messages');
    }
});
/**
 * DELETE /realtime/queued-messages - Clear queued messages for user
 */
router.delete('/queued-messages', auth_1.requireAuth, cache_1.noCache, async (req, res) => {
    try {
        const userId = req.user.id;
        const wsService = getWebSocketService();
        if (!wsService) {
            return response_1.ResponseHelper.serverError(res, 'WebSocket service not available');
        }
        wsService.clearQueuedMessages(userId);
        logger_1.logger.info('Queued messages cleared:', {
            userId,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, {
            cleared: true,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to clear queued messages:', error);
        return response_1.ResponseHelper.serverError(res, 'Failed to clear queued messages');
    }
});
/**
 * GET /realtime/status - Get real-time service status
 */
router.get('/status', auth_1.requireAuth, cache_1.noCache, async (req, res) => {
    try {
        const wsService = getWebSocketService();
        if (!wsService) {
            return response_1.ResponseHelper.serverError(res, 'WebSocket service not available');
        }
        const onlineUsersCount = wsService.getOnlineUsersCount();
        const onlineUsers = wsService.getOnlineUsers();
        return response_1.ResponseHelper.success(res, {
            status: 'healthy',
            onlineUsersCount,
            userOnline: onlineUsers.includes(req.user.id),
            timestamp: new Date().toISOString(),
            capabilities: [
                'websocket',
                'http_fallback',
                'message_queue',
                'presence_tracking',
                'community_broadcast',
            ],
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get real-time status:', error);
        return response_1.ResponseHelper.serverError(res, 'Failed to get status');
    }
});
exports.default = router;
//# sourceMappingURL=realtime.routes.js.map