export interface CreateNotificationInput {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, any>;
}
export declare class NotificationService {
    static create(input: CreateNotificationInput): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        isRead: boolean;
        type: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        title: string;
        body: string;
    }>;
    static bulkCreate(notifications: CreateNotificationInput[]): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        isRead: boolean;
        type: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        title: string;
        body: string;
    }[]>;
    static list(userId: string, options?: {
        limit?: number;
        cursor?: string;
    }): Promise<{
        items: {
            id: string;
            createdAt: Date;
            userId: string;
            isRead: boolean;
            type: string;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            title: string;
            body: string;
        }[];
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