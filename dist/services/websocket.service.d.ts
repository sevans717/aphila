import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
interface PresenceInfo {
    userId: string;
    status: 'online' | 'away' | 'offline';
    lastSeen: Date;
    deviceInfo?: {
        platform: string;
        version: string;
        deviceId: string;
    };
}
export declare class WebSocketService {
    private io;
    private userSockets;
    private presence;
    private messageQueues;
    private connectionRetryCount;
    constructor(server: HTTPServer);
    private setupAuth;
    private setupEventHandlers;
    private handleJoinMatch;
    private handleSendMessage;
    private handleTypingStart;
    private handleTypingStop;
    private handleMarkRead;
    private updateUserOnlineStatus;
    sendNotificationToUser(userId: string, notification: any): void;
    sendMatchNotification(userId: string, matchData: any): void;
    private sendPushNotification;
    /**
     * Setup presence tracking for online/offline status
     */
    private setupPresenceTracking;
    /**
     * Setup message queue for offline users
     */
    private setupMessageQueue;
    /**
     * Update presence status for all connected users
     */
    private updatePresenceStatus;
    /**
     * Process message queues for users who came back online
     */
    private processMessageQueues;
    /**
     * Queue message for offline user
     */
    private queueMessage;
    /**
     * Enhanced message sending with fallback and queue support
     */
    sendMessageWithFallback(userId: string, event: string, data: any): boolean;
    /**
     * Get user presence information
     */
    getUserPresence(userId: string): PresenceInfo | null;
    /**
     * Set user presence
     */
    setUserPresence(userId: string, status: 'online' | 'away' | 'offline', deviceInfo?: any): void;
    /**
     * Get all online users
     */
    getOnlineUsers(): string[];
    /**
     * Get queued messages for a user
     */
    getQueuedMessages(userId: string): any[];
    /**
     * Clear queued messages for a user
     */
    clearQueuedMessages(userId: string): void;
    /**
     * Broadcast to all users in a community
     */
    broadcastToCommunity(communityId: string, event: string, data: any): void;
    /**
     * Broadcast to all online users
     */
    broadcastToAll(event: string, data: any): void;
    /**
     * Close the WebSocket service
     */
    close(): void;
    getIO(): SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any> | undefined;
    isUserOnline(userId: string): boolean;
    getOnlineUsersCount(): number;
}
export {};
//# sourceMappingURL=websocket.service.d.ts.map