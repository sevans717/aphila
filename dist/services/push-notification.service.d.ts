export interface PushNotificationPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
    imageUrl?: string;
}
export interface SendNotificationOptions {
    userId: string;
    payload: PushNotificationPayload;
    priority?: 'high' | 'normal';
    timeToLive?: number;
}
export declare class PushNotificationService {
    private isInitialized;
    initialize(): Promise<void>;
    static registerDevice(deviceData: {
        userId: string;
        fcmToken: string;
        platform: string;
        deviceId: string;
    }): Promise<any>;
    registerDevice(userId: string, fcmToken: string, platform: string, deviceId: string): Promise<void>;
    static unregisterDevice(userId: string, deviceToken: string): Promise<void>;
    unregisterDevice(deviceId: string): Promise<void>;
    static getNotificationPreferences(userId: string): Promise<any>;
    static updateNotificationPreferences(userId: string, preferences: any): Promise<void>;
    static sendToUser(userId: string, payload: PushNotificationPayload): Promise<void>;
    sendToUser(options: SendNotificationOptions): Promise<boolean>;
    sendToTopic(topic: string, payload: PushNotificationPayload): Promise<boolean>;
    subscribeToTopic(fcmToken: string, topic: string): Promise<void>;
    unsubscribeFromTopic(fcmToken: string, topic: string): Promise<void>;
    private removeInvalidTokens;
    sendMatchNotification(userId: string, matchUserName: string): Promise<void>;
    sendMessageNotification(userId: string, senderName: string, message: string): Promise<void>;
    sendLikeNotification(userId: string, likerName: string): Promise<void>;
}
//# sourceMappingURL=push-notification.service.d.ts.map