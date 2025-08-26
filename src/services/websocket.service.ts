import { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { Socket, Server as SocketIOServer } from "socket.io";
import { logger } from "../utils/logger";
import { handleServiceError } from "../utils/error";

// using shared singleton `prisma` from src/lib/prisma

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

interface PresenceInfo {
  userId: string;
  status: "online" | "away" | "offline";
  lastSeen: Date;
  deviceInfo?: {
    platform: string;
    version: string;
    deviceId: string;
  };
}

interface MessageQueue {
  userId: string;
  messages: any[];
  lastDelivered: Date;
}

export class WebSocketService {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private presence: Map<string, PresenceInfo> = new Map(); // userId -> presence
  private messageQueues: Map<string, MessageQueue> = new Map(); // userId -> queue
  private connectionRetryCount: Map<string, number> = new Map(); // socketId -> retry count

  constructor(server: HTTPServer) {
    try {
      this.io = new SocketIOServer(server, {
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
    } catch (err) {
      logger.error("Socket.IO initialization failed", { err });
      this.io = null;
      return;
    }

    this.setupAuth();
    this.setupEventHandlers();
    this.setupPresenceTracking();
    this.setupMessageQueue();
  }

  private setupAuth() {
    const io = this.io;
    if (!io) return;
    io.use(async (socket: any, next: any) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.split(" ")[1];

        if (!token) {
          throw new Error("No token provided");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const decodedUserId = decoded?.id || decoded?.userId;
        if (!decodedUserId) {
          throw new Error("Invalid token payload");
        }

        // Get user from database
        const user = await prisma.user.findUnique({
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
      } catch (error) {
        next(new Error("Authentication failed"));
      }
    });
  }

  private setupEventHandlers() {
    const io = this.io;
    if (!io) return;
    io.on("connection", (socket: any) => {
      console.log(`User ${socket.userId} connected`);

      // Store user socket mapping
      this.userSockets.set(socket.userId, socket.id);

      // Update user online status
      this.updateUserOnlineStatus(socket.userId, true);

      // Join user to their personal room for direct notifications
      socket.join(`user:${socket.userId}`);

      // Handle joining match rooms
      socket.on("join_match", (matchId: string) => {
        this.handleJoinMatch(socket, matchId);
      });

      // Handle leaving match rooms
      socket.on("leave_match", (matchId: string) => {
        socket.leave(`match:${matchId}`);
      });

      // Handle real-time messaging
      socket.on("send_message", (data: any) => {
        this.handleSendMessage(socket, data);
      });

      // Handle typing indicators
      socket.on("typing_start", (data: { matchId: string }) => {
        this.handleTypingStart(socket, data);
      });

      socket.on("typing_stop", (data: { matchId: string }) => {
        this.handleTypingStop(socket, data);
      });

      // Handle message read receipts
      socket.on("mark_read", (data: { matchId: string }) => {
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

  private async handleJoinMatch(socket: any, matchId: string) {
    try {
      // Verify user is part of the match
      const match = await prisma.match.findFirst({
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
    } catch (error) {
      socket.emit("error", { message: "Failed to join match" });
      handleServiceError(error as any);
    }
  }

  private async handleSendMessage(socket: any, data: any) {
    try {
      const { matchId, content, messageType = "text", clientNonce } = data;

      // Get match to find receiver
      const match = await prisma.match.findFirst({
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

      const receiverId =
        match.initiatorId === socket.userId
          ? match.receiverId
          : match.initiatorId;

      // Create message in database
      const message = await prisma.message.create({
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
    } catch (error) {
      // emit specific error with clientNonce so clients can mark failed
      const clientNonce = data?.clientNonce;
      socket.emit("message_error", {
        message: "Failed to send message",
        clientNonce,
      });
      handleServiceError(error as any);
    }
  }

  private handleTypingStart(socket: any, data: { matchId: string }) {
    socket.to(`match:${data.matchId}`).emit("user_typing", {
      userId: socket.userId,
      matchId: data.matchId,
    });
  }

  private handleTypingStop(socket: any, data: { matchId: string }) {
    socket.to(`match:${data.matchId}`).emit("user_stopped_typing", {
      userId: socket.userId,
      matchId: data.matchId,
    });
  }

  private async handleMarkRead(socket: any, data: { matchId: string }) {
    try {
      // Collect unread message ids first for per-message read receipts
      const unread = await prisma.message.findMany({
        where: {
          matchId: data.matchId,
          receiverId: socket.userId,
          readAt: null,
        },
        select: { id: true },
      });

      await prisma.message.updateMany({
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
    } catch (error) {
      socket.emit("error", { message: "Failed to mark messages as read" });
      handleServiceError(error as any);
    }
  }

  private async updateUserOnlineStatus(userId: string, isOnline: boolean) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          // lastSeen not in schema new Date(),
          // You could add an isOnline field to the user model if needed
        },
      });
    } catch (error) {
      console.error("Failed to update online status:", error);
      handleServiceError(error as any);
    }
  }

  // Public method to send notifications to specific users
  public sendNotificationToUser(userId: string, notification: any) {
    const io = this.io;
    if (!io) return;
    io.to(`user:${userId}`).emit("notification", notification);
  }

  // Public method to send match notification
  public sendMatchNotification(userId: string, matchData: any) {
    const io = this.io;
    if (!io) return;
    io.to(`user:${userId}`).emit("new_match", matchData);
  }

  // Send push notification (placeholder for FCM integration)
  private async sendPushNotification(userId: string, notification: any) {
    try {
      // Get user's device tokens
      const devices = await prisma.device.findMany({
        where: {
          userId,
          fcmToken: { not: null },
        },
      });

      // Here you would integrate with FCM (Firebase Cloud Messaging)
      // For now, we'll store as a notification in the database
      await prisma.notification.create({
        data: {
          userId,
          type: "message",
          title: notification.title,
          body: notification.body,
          data: notification.data,
        },
      });

      logger.info(`Push notification sent to user ${userId}:`, notification);
    } catch (error: any) {
      logger.error("Failed to send push notification:", error);
      handleServiceError(error as any);
    }
  }

  /**
   * Setup presence tracking for online/offline status
   */
  private setupPresenceTracking() {
    setInterval(() => {
      this.updatePresenceStatus();
    }, 30000); // Update every 30 seconds
  }

  /**
   * Setup message queue for offline users
   */
  private setupMessageQueue() {
    setInterval(() => {
      this.processMessageQueues();
    }, 60000); // Process queues every minute
  }

  /**
   * Update presence status for all connected users
   */
  private updatePresenceStatus() {
    this.presence.forEach(async (presence, userId) => {
      try {
        // Update user's last seen timestamp (if the field exists in your schema)
        // await prisma.user.update({
        //   where: { id: userId },
        //   data: {
        //     lastSeen: presence.lastSeen,
        //   },
        // });

        logger.debug(`User ${userId} presence: ${presence.status}`);
      } catch (error: any) {
        logger.error(`Failed to update presence for user ${userId}:`, error);
      }
    });
  }

  /**
   * Process message queues for users who came back online
   */
  private processMessageQueues() {
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
  private queueMessage(userId: string, message: any) {
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
  public sendMessageWithFallback(
    userId: string,
    event: string,
    data: any
  ): boolean {
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
  public getUserPresence(userId: string): PresenceInfo | null {
    return this.presence.get(userId) || null;
  }

  /**
   * Set user presence
   */
  public setUserPresence(
    userId: string,
    status: "online" | "away" | "offline",
    deviceInfo?: any
  ) {
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
  public getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  /**
   * Get queued messages for a user
   */
  public getQueuedMessages(userId: string): any[] {
    const queue = this.messageQueues.get(userId);
    return queue ? queue.messages : [];
  }

  /**
   * Clear queued messages for a user
   */
  public clearQueuedMessages(userId: string) {
    this.messageQueues.delete(userId);
  }

  /**
   * Broadcast to all users in a community
   */
  public broadcastToCommunity(communityId: string, event: string, data: any) {
    const io = this.io;
    if (!io) return;
    io.to(`community:${communityId}`).emit(event, data);
  }

  /**
   * Broadcast to all online users
   */
  public broadcastToAll(event: string, data: any) {
    const io = this.io;
    if (!io) return;
    io.emit(event, data);
  }

  /**
   * Close the WebSocket service
   */
  public close() {
    const io = this.io;
    if (!io) return;
    io.close();
  }

  // Get Socket.IO instance for external use
  public getIO() {
    return this.io;
  }

  // Check if user is online
  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  // Get online users count
  public getOnlineUsersCount(): number {
    return this.userSockets.size;
  }
}
