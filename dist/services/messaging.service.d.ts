interface CreateMessageData {
    senderId: string;
    receiverId: string;
    content: string;
    messageType?: "text" | "image" | "gif" | "emoji";
}
interface MessageFilters {
    matchId: string;
    limit?: number;
    before?: string;
}
export declare class MessagingService {
    static sendMessage(data: CreateMessageData): Promise<any>;
    static getMatchMessages(filters: MessageFilters): Promise<any>;
    static markMessagesAsRead(matchId: string, userId: string): Promise<{
        success: boolean;
    }>;
    static getUnreadCount(userId: string): Promise<any>;
    static deleteMessage(messageId: string, userId: string): Promise<{
        success: boolean;
    }>;
    static getMatchDetails(matchId: string, userId: string): Promise<any>;
    static reportMessage(messageId: string, reporterId: string, reason: string): Promise<{
        success: boolean;
    }>;
}
export {};
//# sourceMappingURL=messaging.service.d.ts.map