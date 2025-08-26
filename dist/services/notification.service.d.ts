export interface CreateNotificationInput {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, any>;
}
export declare class NotificationService {
    static create(input: CreateNotificationInput): Promise<any>;
    static bulkCreate(notifications: CreateNotificationInput[]): Promise<any>;
    static list(userId: string, options?: {
        limit?: number;
        cursor?: string;
    }): Promise<{
        items: any;
        nextCursor: string | undefined;
    }>;
    static markRead(userId: string, ids: string[]): Promise<{
        success: boolean;
    }>;
    static markAllRead(userId: string): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=notification.service.d.ts.map