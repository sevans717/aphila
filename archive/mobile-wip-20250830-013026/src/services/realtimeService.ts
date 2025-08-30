import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiConfig } from "../config/api";
import {
  RealtimeEvent,
  RealtimeMessage,
  ConnectionStatus,
  PresenceInfo,
} from "../types/realtime";
import { authService } from "./authService";

/**
 * Default real-time configuration
 */
const defaultRealtimeConfig = {
  socketURL: `${ApiConfig.baseURL.replace(/^http/, "ws")}/socket.io`,
  connectionTimeout: 10000,
  heartbeatInterval: 30000,
};

/**
 * Real-time Service
 * Manages WebSocket connections, real-time events, and presence tracking
 */
class RealtimeService {
  private socket: Socket | null = null;
  private connectionStatus: ConnectionStatus = "disconnected";
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private messageQueue: RealtimeMessage[] = [];
  private isInitialized = false;
  private userId: string | null = null;
  private presenceData: Record<string, PresenceInfo> = {};

  /**
   * Initialize real-time service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error(
        "User must be authenticated to initialize real-time service"
      );
    }

    this.userId = user.id;
    this.isInitialized = true;

    await this.connect();
  }

  /**
   * Connect to WebSocket server
   */
  public async connect(): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    try {
      const tokens = authService.getAuthTokens();
      if (!tokens?.accessToken) {
        throw new Error("No access token available");
      }

      this.setConnectionStatus("connecting");

      this.socket = io(defaultRealtimeConfig.socketURL, {
        auth: {
          token: tokens.accessToken,
        },
        transports: ["websocket"],
        timeout: defaultRealtimeConfig.connectionTimeout,
        forceNew: true,
      });

      this.setupSocketListeners();
    } catch (error) {
      console.error("Failed to connect to real-time service:", error);
      this.setConnectionStatus("error");
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.stopHeartbeat();
    this.setConnectionStatus("disconnected");
    this.reconnectAttempts = 0;
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      console.log("Real-time service connected");
      this.setConnectionStatus("connected");
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.processMessageQueue();
      this.joinUserRoom();
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Real-time service disconnected:", reason);
      this.setConnectionStatus("disconnected");
      this.stopHeartbeat();

      if (reason === "io server disconnect") {
        // Server initiated disconnect, don't reconnect
        return;
      }

      this.attemptReconnect();
    });

    this.socket.on("connect_error", (error) => {
      console.error("Real-time connection error:", error);
      this.setConnectionStatus("error");
      this.attemptReconnect();
    });

    // Authentication events
    this.socket.on("auth_error", (error) => {
      console.error("Real-time authentication error:", error);
      this.setConnectionStatus("error");
      // Clear tokens and require re-authentication
      authService.logout();
    });

    // Message events
    this.socket.on("message", (data: RealtimeMessage) => {
      this.handleIncomingMessage(data);
    });

    // Presence events
    this.socket.on(
      "user_online",
      (data: { userId: string; presenceData?: any }) => {
        this.handleUserOnline(data);
      }
    );

    this.socket.on("user_offline", (data: { userId: string }) => {
      this.handleUserOffline(data);
    });

    this.socket.on(
      "presence_update",
      (data: { userId: string; presenceData: any }) => {
        this.handlePresenceUpdate(data);
      }
    );

    // Typing events
    this.socket.on(
      "user_typing",
      (data: { userId: string; channelId: string }) => {
        this.emitEvent("user_typing", data);
      }
    );

    this.socket.on(
      "user_stopped_typing",
      (data: { userId: string; channelId: string }) => {
        this.emitEvent("user_stopped_typing", data);
      }
    );

    // Match events
    this.socket.on("new_match", (data: any) => {
      this.emitEvent("new_match", data);
    });

    this.socket.on("match_expired", (data: any) => {
      this.emitEvent("match_expired", data);
    });

    // Notification events
    this.socket.on("notification", (data: any) => {
      this.emitEvent("notification", data);
    });

    // Heartbeat
    this.socket.on("pong", () => {
      // Server responded to ping
    });
  }

  /**
   * Join user's personal room for direct messages
   */
  private joinUserRoom(): void {
    if (!this.socket || !this.userId) return;

    this.socket.emit("join_room", { room: `user_${this.userId}` });
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      this.setConnectionStatus("failed");
      return;
    }

    this.reconnectAttempts++;
    const delay =
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      if (this.connectionStatus !== "connected") {
        this.connect().catch(console.error);
      }
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit("ping");
      }
    }, defaultRealtimeConfig.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Set connection status and notify listeners
   */
  private setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.emitEvent("connection_status", { status });
  }

  /**
   * Send message through real-time connection
   */
  public sendMessage(message: Omit<RealtimeMessage, "id" | "timestamp">): void {
    const fullMessage: RealtimeMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
    };

    if (this.socket?.connected) {
      this.socket.emit("message", fullMessage);
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(fullMessage);
    }
  }

  /**
   * Join a room (channel/conversation)
   */
  public joinRoom(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit("join_room", { room: roomId });
    }
  }

  /**
   * Leave a room
   */
  public leaveRoom(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit("leave_room", { room: roomId });
    }
  }

  /**
   * Send typing indicator
   */
  public sendTyping(channelId: string, isTyping: boolean): void {
    if (!this.socket?.connected) return;

    if (isTyping) {
      this.socket.emit("typing_start", { channelId });
    } else {
      this.socket.emit("typing_stop", { channelId });
    }
  }

  /**
   * Update user presence
   */
  public updatePresence(presenceData: any): void {
    if (!this.socket?.connected) return;

    this.socket.emit("presence_update", presenceData);
  }

  /**
   * Subscribe to real-time events
   */
  public on(eventType: string, callback: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }

    this.eventListeners.get(eventType)!.add(callback);
  }

  /**
   * Unsubscribe from real-time events
   */
  public off(eventType: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.eventListeners.delete(eventType);
      }
    }
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Handle incoming messages
   */
  private handleIncomingMessage(message: RealtimeMessage): void {
    // Store message locally if needed
    this.storeMessage(message);

    // Emit to listeners
    this.emitEvent("message", message);

    // Emit specific message type events
    if (message.type) {
      this.emitEvent(`message_${message.type}`, message);
    }
  }

  /**
   * Handle user coming online
   */
  private handleUserOnline(data: { userId: string; presenceData?: any }): void {
    this.presenceData[data.userId] = {
      userId: data.userId,
      status: "online",
      lastSeen: new Date().toISOString(),
      devices: [],
      visibility: "public",
      ...data.presenceData,
    };

    this.emitEvent("user_online", data);
  }

  /**
   * Handle user going offline
   */
  private handleUserOffline(data: { userId: string }): void {
    if (this.presenceData[data.userId]) {
      this.presenceData[data.userId].status = "offline";
      this.presenceData[data.userId].lastSeen = new Date().toISOString();
    }

    this.emitEvent("user_offline", data);
  }

  /**
   * Handle presence updates
   */
  private handlePresenceUpdate(data: {
    userId: string;
    presenceData: any;
  }): void {
    this.presenceData[data.userId] = {
      ...this.presenceData[data.userId],
      ...data.presenceData,
    };

    this.emitEvent("presence_update", data);
  }

  /**
   * Process queued messages when connection is restored
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.socket?.connected) {
      const message = this.messageQueue.shift();
      if (message) {
        this.socket.emit("message", message);
      }
    }
  }

  /**
   * Store message locally (implement based on storage needs)
   */
  private async storeMessage(message: RealtimeMessage): Promise<void> {
    try {
      // Store in AsyncStorage or local database
      const key = `rt_message_${message.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(message));
    } catch (error) {
      console.error("Failed to store real-time message:", error);
    }
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connectionStatus === "connected";
  }

  /**
   * Get user presence data
   */
  public getUserPresence(userId: string): PresenceInfo | null {
    return this.presenceData[userId] || null;
  }

  /**
   * Get all presence data
   */
  public getAllPresence(): Record<string, PresenceInfo> {
    return { ...this.presenceData };
  }

  /**
   * Clear all stored data
   */
  public async clearData(): Promise<void> {
    this.eventListeners.clear();
    this.messageQueue = [];
    this.presenceData = {};

    // Clear stored messages
    try {
      const keys = await AsyncStorage.getAllKeys();
      const messageKeys = keys.filter((key) => key.startsWith("rt_message_"));
      if (messageKeys.length > 0) {
        await AsyncStorage.multiRemove(messageKeys);
      }
    } catch (error) {
      console.error("Failed to clear real-time data:", error);
    }
  }

  /**
   * Cleanup and destroy service
   */
  public destroy(): void {
    this.disconnect();
    this.clearData();
    this.isInitialized = false;
    this.userId = null;
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
export default realtimeService;
