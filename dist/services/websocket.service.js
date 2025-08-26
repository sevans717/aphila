"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
const prisma_1 = require("../lib/prisma");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const socket_io_1 = require("socket.io");
const logger_1 = require("../utils/logger");
const error_1 = require("../utils/error");
class WebSocketService {
    io = null;
    userSockets = new Map(); // userId -> socketId
    presence = new Map(); // userId -> presence
    messageQueues = new Map(); // userId -> queue
    connectionRetryCount = new Map(); // socketId -> retry count
    constructor(server) {
        try {
            this.io = new socket_io_1.Server(server, {
                cors: {
                    origin: process.env.FRONTEND_URL || "*",
                    methods: ["GET", "POST"],
                    credentials: true,
                },
                // Enhanced configuration for mobile
                pingTimeout: 60000, // 60 seconds
                pingInterval: 25000, // 25 seconds
                connectTimeout: 45000, // 45 seconds
                transports: ["websocket", "polling"], // Fallback support
            });
        }
        catch (err) {
            logger_1.logger.error("Socket.IO initialization failed", { err });
            this.io = null;
            return;
        }
        this.setupAuth();
        this.setupEventHandlers();
        this.setupPresenceTracking();
        this.setupMessageQueue();
    }
    setupAuth() {
        const io = this.io;
        if (!io)
            return;
        io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token ||
                    socket.handshake.headers.authorization?.split(" ")[1];
                if (!token) {
                    throw new Error("No token provided");
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const decodedUserId = decoded?.id || decoded?.userId;
                if (!decodedUserId) {
                    throw new Error("Invalid token payload");
                }
                // Get user from database
                const user = await prisma_1.prisma.user.findUnique({
                    where: { id: decodedUserId },
                    include: {
                        profile: {
                            select: { displayName: true },
                        },
                    },
                });
                if (!user || !user.isActive) {
                    throw new Error("User not found or inactive");
                }
                socket.userId = user.id;
                socket.user = user;
                next();
            }
            catch (error) {
                next(new Error("Authentication failed"));
            }
        });
    }
    setupEventHandlers() {
        const io = this.io;
        if (!io)
            return;
        io.on("connection", (socket) => {
            console.log(`User ${socket.userId} connected`);
            // Store user socket mapping
            this.userSockets.set(socket.userId, socket.id);
            // Update user online status
            this.updateUserOnlineStatus(socket.userId, true);
            // Join user to their personal room for direct notifications
            socket.join(`user:${socket.userId}`);
            // Handle joining match rooms
            socket.on("join_match", (matchId) => {
                this.handleJoinMatch(socket, matchId);
            });
            // Handle leaving match rooms
            socket.on("leave_match", (matchId) => {
                socket.leave(`match:${matchId}`);
            });
            // Handle real-time messaging
            socket.on("send_message", (data) => {
                this.handleSendMessage(socket, data);
            });
            // Handle typing indicators
            socket.on("typing_start", (data) => {
                this.handleTypingStart(socket, data);
            });
            socket.on("typing_stop", (data) => {
                this.handleTypingStop(socket, data);
            });
            // Handle message read receipts
            socket.on("mark_read", (data) => {
                this.handleMarkRead(socket, data);
            });
            // Handle disconnect
            socket.on("disconnect", () => {
                console.log(`User ${socket.userId} disconnected`);
                this.userSockets.delete(socket.userId);
                this.updateUserOnlineStatus(socket.userId, false);
            });
        });
    }
    async handleJoinMatch(socket, matchId) {
        try {
            // Verify user is part of the match
            const match = await prisma_1.prisma.match.findFirst({
                where: {
                    id: matchId,
                    OR: [{ initiatorId: socket.userId }, { receiverId: socket.userId }],
                    status: "ACTIVE",
                },
            });
            if (!match) {
                socket.emit("error", { message: "Match not found or access denied" });
                return;
            }
            socket.join(`match:${matchId}`);
            socket.emit("joined_match", { matchId });
        }
        catch (error) {
            socket.emit("error", { message: "Failed to join match" });
            (0, error_1.handleServiceError)(error);
        }
    }
    async handleSendMessage(socket, data) {
        try {
            const { matchId, content, messageType = "text", clientNonce } = data;
            // Get match to find receiver
            const match = await prisma_1.prisma.match.findFirst({
                where: {
                    id: matchId,
                    OR: [{ initiatorId: socket.userId }, { receiverId: socket.userId }],
                    status: "ACTIVE",
                },
            });
            if (!match) {
                // emit specific error with clientNonce so clients can mark failed
                socket.emit("message_error", {
                    message: "Match not found",
                    clientNonce,
                });
                return;
            }
            const receiverId = match.initiatorId === socket.userId
                ? match.receiverId
                : match.initiatorId;
            // Create message in database
            const message = await prisma_1.prisma.message.create({
                data: {
                    senderId: socket.userId,
                    receiverId,
                    matchId,
                    content,
                    messageType,
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            profile: {
                                select: { displayName: true },
                            },
                        },
                    },
                },
            });
            // Broadcast message to match room
            const io = this.io;
            if (io)
                io.to(`match:${matchId}`).emit("new_message", {
                    id: message.id,
                    senderId: message.senderId,
                    receiverId: message.receiverId,
                    content: message.content,
                    messageType: message.messageType,
                    createdAt: message.createdAt,
                    sender: message.sender,
                    clientNonce,
                });
            // Emit delivery ack back to sender with clientNonce for reconciliation
            socket.emit("message_ack", {
                messageId: message.id,
                clientNonce,
                deliveredAt: new Date(),
            });
            // Send push notification if receiver is offline
            const receiverSocketId = this.userSockets.get(receiverId);
            if (!receiverSocketId) {
                await this.sendPushNotification(receiverId, {
                    title: `New message from ${message.sender.profile?.displayName}`,
                    body: messageType === "text" ? content : `Sent a ${messageType}`,
                    data: { matchId, messageId: message.id },
                });
            }
        }
        catch (error) {
            // emit specific error with clientNonce so clients can mark failed
            const clientNonce = data?.clientNonce;
            socket.emit("message_error", {
                message: "Failed to send message",
                clientNonce,
            });
            (0, error_1.handleServiceError)(error);
        }
    }
    handleTypingStart(socket, data) {
        socket.to(`match:${data.matchId}`).emit("user_typing", {
            userId: socket.userId,
            matchId: data.matchId,
        });
    }
    handleTypingStop(socket, data) {
        socket.to(`match:${data.matchId}`).emit("user_stopped_typing", {
            userId: socket.userId,
            matchId: data.matchId,
        });
    }
    async handleMarkRead(socket, data) {
        try {
            // Collect unread message ids first for per-message read receipts
            const unread = await prisma_1.prisma.message.findMany({
                where: {
                    matchId: data.matchId,
                    receiverId: socket.userId,
                    readAt: null,
                },
                select: { id: true },
            });
            await prisma_1.prisma.message.updateMany({
                where: {
                    matchId: data.matchId,
                    receiverId: socket.userId,
                    readAt: null,
                },
                data: {
                    readAt: new Date(),
                },
            });
            // Notify sender about read receipt
            socket.to(`match:${data.matchId}`).emit("messages_read", {
                matchId: data.matchId,
                readBy: socket.userId,
                readAt: new Date(),
                messageIds: unread.map((m) => m.id),
            });
        }
        catch (error) {
            socket.emit("error", { message: "Failed to mark messages as read" });
            (0, error_1.handleServiceError)(error);
        }
    }
    async updateUserOnlineStatus(userId, isOnline) {
        try {
            await prisma_1.prisma.user.update({
                where: { id: userId },
                data: {
                // lastSeen not in schema new Date(),
                // You could add an isOnline field to the user model if needed
                },
            });
        }
        catch (error) {
            console.error("Failed to update online status:", error);
            (0, error_1.handleServiceError)(error);
        }
    }
    // Public method to send notifications to specific users
    sendNotificationToUser(userId, notification) {
        const io = this.io;
        if (!io)
            return;
        io.to(`user:${userId}`).emit("notification", notification);
    }
    // Public method to send match notification
    sendMatchNotification(userId, matchData) {
        const io = this.io;
        if (!io)
            return;
        io.to(`user:${userId}`).emit("new_match", matchData);
    }
    // Send push notification (placeholder for FCM integration)
    async sendPushNotification(userId, notification) {
        try {
            // Get user's device tokens
            const devices = await prisma_1.prisma.device.findMany({
                where: {
                    userId,
                    fcmToken: { not: null },
                },
            });
            // Here you would integrate with FCM (Firebase Cloud Messaging)
            // For now, we'll store as a notification in the database
            await prisma_1.prisma.notification.create({
                data: {
                    userId,
                    type: "message",
                    title: notification.title,
                    body: notification.body,
                    data: notification.data,
                },
            });
            logger_1.logger.info(`Push notification sent to user ${userId}:`, notification);
        }
        catch (error) {
            logger_1.logger.error("Failed to send push notification:", error);
            (0, error_1.handleServiceError)(error);
        }
    }
    /**
     * Setup presence tracking for online/offline status
     */
    setupPresenceTracking() {
        setInterval(() => {
            this.updatePresenceStatus();
        }, 30000); // Update every 30 seconds
    }
    /**
     * Setup message queue for offline users
     */
    setupMessageQueue() {
        setInterval(() => {
            this.processMessageQueues();
        }, 60000); // Process queues every minute
    }
    /**
     * Update presence status for all connected users
     */
    updatePresenceStatus() {
        this.presence.forEach(async (presence, userId) => {
            try {
                // Update user's last seen timestamp (if the field exists in your schema)
                // await prisma.user.update({
                //   where: { id: userId },
                //   data: {
                //     lastSeen: presence.lastSeen,
                //   },
                // });
                logger_1.logger.debug(`User ${userId} presence: ${presence.status}`);
            }
            catch (error) {
                logger_1.logger.error(`Failed to update presence for user ${userId}:`, error);
            }
        });
    }
    /**
     * Process message queues for users who came back online
     */
    processMessageQueues() {
        this.messageQueues.forEach((queue, userId) => {
            if (this.isUserOnline(userId) && queue.messages.length > 0) {
                const socketId = this.userSockets.get(userId);
                if (socketId) {
                    const io = this.io;
                    const socket = io?.sockets.sockets.get(socketId);
                    if (socket) {
                        // Send queued messages
                        queue.messages.forEach((message) => {
                            socket.emit("message", message);
                        });
                        // Clear the queue
                        queue.messages = [];
                        queue.lastDelivered = new Date();
                    }
                }
            }
        });
    }
    /**
     * Queue message for offline user
     */
    queueMessage(userId, message) {
        let queue = this.messageQueues.get(userId);
        if (!queue) {
            queue = {
                userId,
                messages: [],
                lastDelivered: new Date(),
            };
            this.messageQueues.set(userId, queue);
        }
        queue.messages.push(message);
        // Limit queue size
        if (queue.messages.length > 100) {
            queue.messages = queue.messages.slice(-100);
        }
    }
    /**
     * Enhanced message sending with fallback and queue support
     */
    sendMessageWithFallback(userId, event, data) {
        const socketId = this.userSockets.get(userId);
        if (socketId) {
            const io = this.io;
            const socket = io?.sockets.sockets.get(socketId);
            if (socket && socket.connected) {
                socket.emit(event, data);
                return true;
            }
        }
        // User is offline, queue the message
        this.queueMessage(userId, { event, data, timestamp: new Date() });
        return false;
    }
    /**
     * Get user presence information
     */
    getUserPresence(userId) {
        return this.presence.get(userId) || null;
    }
    /**
     * Set user presence
     */
    setUserPresence(userId, status, deviceInfo) {
        this.presence.set(userId, {
            userId,
            status,
            lastSeen: new Date(),
            deviceInfo,
        });
    }
    /**
     * Get all online users
     */
    getOnlineUsers() {
        return Array.from(this.userSockets.keys());
    }
    /**
     * Get queued messages for a user
     */
    getQueuedMessages(userId) {
        const queue = this.messageQueues.get(userId);
        return queue ? queue.messages : [];
    }
    /**
     * Clear queued messages for a user
     */
    clearQueuedMessages(userId) {
        this.messageQueues.delete(userId);
    }
    /**
     * Broadcast to all users in a community
     */
    broadcastToCommunity(communityId, event, data) {
        const io = this.io;
        if (!io)
            return;
        io.to(`community:${communityId}`).emit(event, data);
    }
    /**
     * Broadcast to all online users
     */
    broadcastToAll(event, data) {
        const io = this.io;
        if (!io)
            return;
        io.emit(event, data);
    }
    /**
     * Close the WebSocket service
     */
    close() {
        const io = this.io;
        if (!io)
            return;
        io.close();
    }
    // Get Socket.IO instance for external use
    getIO() {
        return this.io;
    }
    // Check if user is online
    isUserOnline(userId) {
        return this.userSockets.has(userId);
    }
    // Get online users count
    getOnlineUsersCount() {
        return this.userSockets.size;
    }
}
exports.WebSocketService = WebSocketService;
//# sourceMappingURL=websocket.service.js.map