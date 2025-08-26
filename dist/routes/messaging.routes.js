"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const messaging_service_1 = require("../services/messaging.service");
const router = (0, express_1.Router)();
// Validation schemas
const sendMessageSchema = zod_1.z.object({
    receiverId: zod_1.z.string(),
    content: zod_1.z.string().min(1),
    messageType: zod_1.z.enum(['text', 'image', 'gif', 'emoji']).optional(),
});
const messageQuerySchema = zod_1.z.object({
    limit: zod_1.z.string().transform(Number).optional(),
    before: zod_1.z.string().optional(),
});
const matchParamsSchema = zod_1.z.object({
    matchId: zod_1.z.string(),
});
const messageParamsSchema = zod_1.z.object({
    messageId: zod_1.z.string(),
});
const reportMessageSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1),
});
// POST /send - Send a message
router.post('/send', auth_1.requireAuth, (0, validate_1.validateRequest)({ body: sendMessageSchema }), async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId, content, messageType } = req.body;
        const message = await messaging_service_1.MessagingService.sendMessage({
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
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// GET /match/:matchId - Get messages for a match
router.get('/match/:matchId', auth_1.requireAuth, (0, validate_1.validateRequest)({ params: matchParamsSchema, query: messageQuerySchema }), async (req, res) => {
    try {
        const { matchId } = req.params;
        const filters = {
            matchId,
            ...req.query,
        };
        const messages = await messaging_service_1.MessagingService.getMatchMessages(filters);
        res.json({
            success: true,
            data: messages.map((message) => ({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// PUT /match/:matchId/read - Mark messages as read
router.put('/match/:matchId/read', auth_1.requireAuth, (0, validate_1.validateRequest)({ params: matchParamsSchema }), async (req, res) => {
    try {
        const { matchId } = req.params;
        const userId = req.user.id;
        await messaging_service_1.MessagingService.markMessagesAsRead(matchId, userId);
        res.json({
            success: true,
            message: 'Messages marked as read',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// GET /unread-count - Get unread message count
router.get('/unread-count', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await messaging_service_1.MessagingService.getUnreadCount(userId);
        res.json({
            success: true,
            data: { unreadCount: count },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// DELETE /message/:messageId - Delete a message
router.delete('/message/:messageId', auth_1.requireAuth, (0, validate_1.validateRequest)({ params: messageParamsSchema }), async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;
        await messaging_service_1.MessagingService.deleteMessage(messageId, userId);
        res.json({
            success: true,
            message: 'Message deleted successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// GET /match/:matchId/details - Get match details with messages
router.get('/match/:matchId/details', auth_1.requireAuth, (0, validate_1.validateRequest)({ params: matchParamsSchema }), async (req, res) => {
    try {
        const { matchId } = req.params;
        const userId = req.user.id;
        const matchDetails = await messaging_service_1.MessagingService.getMatchDetails(matchId, userId);
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
                messages: matchDetails.messages.map((message) => ({
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
    }
    catch (error) {
        res.status(404).json({
            success: false,
            error: error.message,
        });
    }
});
// POST /message/:messageId/report - Report a message
router.post('/message/:messageId/report', auth_1.requireAuth, (0, validate_1.validateRequest)({ params: messageParamsSchema, body: reportMessageSchema }), async (req, res) => {
    try {
        const { messageId } = req.params;
        const { reason } = req.body;
        const reporterId = req.user.id;
        await messaging_service_1.MessagingService.reportMessage(messageId, reporterId, reason);
        res.json({
            success: true,
            message: 'Message reported successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=messaging.routes.js.map