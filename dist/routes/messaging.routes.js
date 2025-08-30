"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const messaging_service_1 = require("../services/messaging.service");
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    dest: "uploads/temp/",
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (_req, file, cb) => {
        logger_1.logger.debug(`File upload attempt: ${file.originalname} (${file.mimetype}) from ${_req.ip}`);
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Invalid file type"));
        }
    },
});
// Validation schemas
const sendMessageSchema = zod_1.z.object({
    receiverId: zod_1.z.string(),
    content: zod_1.z.string().min(1),
    messageType: zod_1.z.enum(["text", "image", "gif", "emoji"]).optional(),
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
const addReactionSchema = zod_1.z.object({
    reaction: zod_1.z.string().min(1).max(50), // emoji or reaction type
});
const removeReactionSchema = zod_1.z.object({
    reaction: zod_1.z.string().min(1).max(50),
});
// POST /send - Send a message
router.post("/send", auth_1.requireAuth, (0, validate_1.validateRequest)({ body: sendMessageSchema }), async (req, res) => {
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
router.get("/match/:matchId", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: matchParamsSchema, query: messageQuerySchema }), async (req, res) => {
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
                reactions: message.reactions,
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
router.put("/match/:matchId/read", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: matchParamsSchema }), async (req, res) => {
    try {
        const { matchId } = req.params;
        const userId = req.user.id;
        await messaging_service_1.MessagingService.markMessagesAsRead(matchId, userId);
        res.json({
            success: true,
            message: "Messages marked as read",
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
router.get("/unread-count", auth_1.requireAuth, async (req, res) => {
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
router.delete("/message/:messageId", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: messageParamsSchema }), async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;
        await messaging_service_1.MessagingService.deleteMessage(messageId, userId);
        res.json({
            success: true,
            message: "Message deleted successfully",
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
router.get("/match/:matchId/details", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: matchParamsSchema }), async (req, res) => {
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
                    reactions: message.reactions,
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
router.post("/message/:messageId/report", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: messageParamsSchema, body: reportMessageSchema }), async (req, res) => {
    try {
        const { messageId } = req.params;
        const { reason } = req.body;
        const reporterId = req.user.id;
        await messaging_service_1.MessagingService.reportMessage(messageId, reporterId, reason);
        res.json({
            success: true,
            message: "Message reported successfully",
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// POST /message/:messageId/reactions - Add reaction to message
router.post("/message/:messageId/reactions", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: messageParamsSchema, body: addReactionSchema }), async (req, res) => {
    try {
        const { messageId } = req.params;
        const { reaction } = req.body;
        const userId = req.user.id;
        const newReaction = await messaging_service_1.MessagingService.addReaction(messageId, userId, reaction);
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
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// DELETE /message/:messageId/reactions - Remove reaction from message
router.delete("/message/:messageId/reactions", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: messageParamsSchema, body: removeReactionSchema }), async (req, res) => {
    try {
        const { messageId } = req.params;
        const { reaction } = req.body;
        const userId = req.user.id;
        await messaging_service_1.MessagingService.removeReaction(messageId, userId, reaction);
        res.json({
            success: true,
            message: "Reaction removed successfully",
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// GET /message/:messageId/reactions - Get reactions for a message
router.get("/message/:messageId/reactions", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: messageParamsSchema }), async (req, res) => {
    try {
        const { messageId } = req.params;
        const reactions = await messaging_service_1.MessagingService.getMessageReactions(messageId);
        res.json({
            success: true,
            data: reactions,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// POST /message/:messageId/media - Upload media for message
router.post("/message/:messageId/media", auth_1.requireAuth, upload.single("media"), (0, validate_1.validateRequest)({ params: messageParamsSchema }), async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;
        // Check if user can upload to this message
        const message = await prisma_1.prisma.message.findUnique({
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
        const media = await messaging_service_1.MessagingService.uploadMessageMedia(req.file, messageId);
        res.status(201).json({
            success: true,
            data: media,
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