import { prisma } from "../lib/prisma";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { Socket, Server as SocketIOServer } from "socket.io";
import { logger } from "../utils/logger";
import { handleServiceError } from "../utils/error";
import { CustomPushNotificationService } from "./custom-push-notification.service";

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
    io.use(async (socket: AuthenticatedSocket, next: any) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.split(" ")[1];

        if (!token) {
          // let auth middleware handle failure without throwing in sync
          return next(new Error("Authentication failed: no token"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const decodedUserId = decoded?.id || decoded?.userId;
        if (!decodedUserId) {
          return next(
            new Error("Authentication failed: invalid token payload")
          );
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
          return next(
            new Error("Authentication failed: user not found or inactive")
          );
        }

        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (error) {
        logger.error("Socket authentication error:", error);
        next(new Error("Authentication failed"));
      }
    });
  }

  private setupEventHandlers() {
    const io = this.io;
    if (!io) return;
    io.on("connection", (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected`);

      // Store user socket mapping
      this.userSockets.set(socket.userId!, socket.id);

      // Update user presence to online
      this.updateUserPresence(socket.userId!, "ONLINE", socket);

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
        this.userSockets.delete(socket.userId!);
        this.updateUserPresence(socket.userId!, "OFFLINE", socket);

        // Reset retry count on disconnect
        this.connectionRetryCount.delete(socket.id);
      });
    });
  }

  private async handleJoinMatch(socket: AuthenticatedSocket, matchId: string) {
    try {
      // Verify user is part of the match
      const match = await prisma.match.findFirst({
        where: {
          id: matchId,
          OR: [{ initiatorId: socket.userId! }, { receiverId: socket.userId! }],
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

  private async handleSendMessage(socket: AuthenticatedSocket, data: any) {
    try {
      const { matchId, content, messageType = "text", clientNonce } = data;

      // Get match to find receiver
      const match = await prisma.match.findFirst({
        where: {
          id: matchId,
          OR: [{ initiatorId: socket.userId! }, { receiverId: socket.userId! }],
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
        match.initiatorId === socket.userId!
          ? match.receiverId
          : match.initiatorId;

      // Create message in database
      const message = await prisma.message.create({
        data: {
          senderId: socket.userId!,
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

  private handleTypingStart(
    socket: AuthenticatedSocket,
    data: { matchId: string }
  ) {
    socket.to(`match:${data.matchId}`).emit("user_typing", {
      userId: socket.userId!,
      matchId: data.matchId,
    });
  }

  private handleTypingStop(
    socket: AuthenticatedSocket,
    data: { matchId: string }
  ) {
    socket.to(`match:${data.matchId}`).emit("user_stopped_typing", {
      userId: socket.userId!,
      matchId: data.matchId,
    });
  }

  private async handleMarkRead(
    socket: AuthenticatedSocket,
    data: { matchId: string }
  ) {
    try {
      // Collect unread message ids first for per-message read receipts
      const unread = await prisma.message.findMany({
        where: {
          matchId: data.matchId,
          receiverId: socket.userId!,
          readAt: null,
        },
        select: { id: true },
      });

      await prisma.message.updateMany({
        where: {
          matchId: data.matchId,
          receiverId: socket.userId!,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      // Notify sender about read receipt
      socket.to(`match:${data.matchId}`).emit("messages_read", {
        matchId: data.matchId,
        readBy: socket.userId!,
        readAt: new Date(),
        messageIds: unread.map((m) => m.id),
      });
    } catch (error) {
      socket.emit("error", { message: "Failed to mark messages as read" });
      handleServiceError(error as any);
    }
  }

  /**
   * Update user presence in database and emit events
   */
  private async updateUserPresence(
    userId: string,
    status: "ONLINE" | "AWAY" | "OFFLINE",
    socket?: AuthenticatedSocket
  ) {
    try {
      const deviceId = socket?.handshake?.query?.deviceId as string;

      const presence = await prisma.presence.upsert({
        where: { userId },
        update: {
          status,
          deviceId,
          lastActivity: new Date(),
          isActive: status === "ONLINE",
          updatedAt: new Date(),
        },
        create: {
          userId,
          status,
          deviceId,
          isActive: status === "ONLINE",
        },
      });

      // Emit presence update to user's friends/followers
      const io = this.io;
      if (io) {
        // Get user's friends for presence updates
        const friendships = await prisma.friendship.findMany({
          where: {
            OR: [{ requesterId: userId }, { addresseeId: userId }],
            status: "ACCEPTED",
          },
          select: {
            requesterId: true,
            addresseeId: true,
          },
        });

        const friendIds = friendships.map((f) =>
          f.requesterId === userId ? f.addresseeId : f.requesterId
        );

        // Emit to friends
        friendIds.forEach((friendId) => {
          io.to(`user:${friendId}`).emit("presence_update", {
            userId,
            status: presence.status,
            lastActivity: presence.lastActivity,
            isActive: presence.isActive,
          });
        });
      }

      logger.debug(`User ${userId} presence updated: ${status}`);
    } catch (error) {
      logger.error(`Failed to update presence for user ${userId}:`, error);
    }
  }

  // Public method to send notifications to specific users
  public sendNotificationToUser(userId: string, notification: any) {
    const io = this.io;
    if (!io) return;
    io.to(`user:${userId}`).emit("notification", notification);
  }

  /**
   * Public method to trigger a haptic/vibrate event on a specific user's clients.
   * Frontend clients should listen for the `haptic` event and run platform-specific
   * haptic/vibration APIs (Expo Haptics / React Native Vibration / navigator.vibrate).
   *
   * Payload example: { type: 'success' | 'warning' | 'error' | 'confirm', pattern?: string }
   */
  public sendHapticToUser(
    userId: string,
    payload: { type?: string; pattern?: string } = {}
  ) {
    const io = this.io;
    if (!io) return;
    io.to(`user:${userId}`).emit("haptic", payload);
  }

  // Public method to send match notification
  public sendMatchNotification(userId: string, matchData: any) {
    const io = this.io;
    if (!io) return;
    io.to(`user:${userId}`).emit("new_match", matchData);
  }

  // Send push notification using custom service
  private async sendPushNotification(userId: string, notification: any) {
    try {
      // Use custom push notification service instead of Firebase
      const results = await CustomPushNotificationService.sendToUser(userId, {
        title: notification.title,
        body: notification.body,
        data: notification.data,
      });

      // Check if any notifications were sent successfully
      const success = results.some((result) => result.success);

      if (success) {
        logger.info(`Push notification sent to user ${userId}:`, notification);
      } else {
        logger.warn(
          `Failed to send push notification to user ${userId}:`,
          notification
        );
      }

      return success;
    } catch (error: any) {
      logger.error("Failed to send push notification:", error);
      handleServiceError(error);
      return false;
    }
  }

  private setupPresenceTracking() {
    // Presence is now handled via API routes and database
    // This method can be used for periodic cleanup or stats
    setInterval(() => {
      this.cleanupInactivePresence();
      this.updatePresenceStatus(); // Update presence status periodically
    }, 300000); // Clean up every 5 minutes
  }

  /**
   * Clean up inactive presence records
   */
  private async cleanupInactivePresence() {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      // Mark users as offline if they haven't been active for 5 minutes
      await prisma.presence.updateMany({
        where: {
          lastActivity: {
            lt: fiveMinutesAgo,
          },
          status: {
            not: "OFFLINE",
          },
        },
        data: {
          status: "OFFLINE",
          isActive: false,
          updatedAt: new Date(),
        },
      });

      // End activities that have been running too long
      await prisma.userActivity.updateMany({
        where: {
          startedAt: {
            lt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes
          },
          endedAt: null,
        },
        data: {
          endedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error("Failed to cleanup inactive presence:", error);
    }
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
    // This method is now handled by the database cleanup
    // Keeping for potential future use with in-memory optimizations
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
    // Log device info for analytics
    if (deviceInfo) {
      console.log(
        `Setting presence for user ${userId} with device info: ${JSON.stringify(deviceInfo)}`
      );
    }

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
