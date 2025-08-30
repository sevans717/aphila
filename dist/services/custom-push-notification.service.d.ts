interface PushMessage {
    title: string;
    body: string;
    data?: Record<string, any>;
    icon?: string;
    badge?: string;
    sound?: string;
    clickAction?: string;
}
interface DeviceToken {
    id: string;
    userId: string;
    deviceId: string;
    token: string;
    platform: "IOS" | "ANDROID" | "WEB";
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
interface NotificationResult {
    success: boolean;
    messageId?: string;
    error?: string;
    deviceToken?: string;
}
export declare class CustomPushNotificationService {
    private static vapidKeys;
    static initialize(): Promise<void>;
    static registerDeviceToken(userId: string, token: string, platform: "IOS" | "ANDROID" | "WEB", deviceId: string): Promise<DeviceToken>;
    static sendToDevice(deviceToken: string, message: PushMessage): Promise<NotificationResult>;
    static sendToUser(userId: string, message: PushMessage): Promise<NotificationResult[]>;
    static getVapidPublicKey(): string;
    private static sendWebPush;
    private static sendIOSPush;
    private static sendAndroidPush;
    static getNotificationPreferences(userId: string): Promise<any>;
    static updateNotificationPreferences(userId: string, preferences: {
        pushNotifications?: boolean;
        matchNotifications?: boolean;
        messageNotifications?: boolean;
        likeNotifications?: boolean;
        promotionalNotifications?: boolean;
    }): Promise<void>;
}
export {};
//# sourceMappingURL=custom-push-notification.service.d.ts.map