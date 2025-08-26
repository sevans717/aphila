interface CreateMessageData {
    senderId: string;
    receiverId: string;
    content: string;
    messageType?: 'text' | 'image' | 'gif' | 'emoji';
}
interface MessageFilters {
    matchId: string;
    limit?: number;
    before?: string;
}
export declare class MessagingService {
    static sendMessage(data: CreateMessageData): Promise<{
        sender: {
            id: string;
            profile: {
                displayName: string;
            } | null;
            photos: {
                url: string;
            }[];
        };
    } & {
        id: string;
        createdAt: Date;
        receiverId: string;
        matchId: string;
        senderId: string;
        content: string;
        messageType: string;
        isRead: boolean;
        readAt: Date | null;
    }>;
    static getMatchMessages(filters: MessageFilters): Promise<({
        sender: {
            id: string;
            profile: {
                displayName: string;
            } | null;
        };
    } & {
        id: string;
        createdAt: Date;
        receiverId: string;
        matchId: string;
        senderId: string;
        content: string;
        messageType: string;
        isRead: boolean;
        readAt: Date | null;
    })[]>;
    static markMessagesAsRead(matchId: string, userId: string): Promise<{
        success: boolean;
    }>;
    static getUnreadCount(userId: string): Promise<number>;
    static deleteMessage(messageId: string, userId: string): Promise<{
        success: boolean;
    }>;
    static getMatchDetails(matchId: string, userId: string): Promise<{
        otherUser: {
            id: string;
            profile: {
                displayName: string;
                bio: string | null;
            } | null;
            photos: {
                url: string;
            }[];
        };
        messages: ({
            sender: {
                id: string;
                profile: {
                    displayName: string;
                } | null;
            };
        } & {
            id: string;
            createdAt: Date;
            receiverId: string;
            matchId: string;
            senderId: string;
            content: string;
            messageType: string;
            isRead: boolean;
            readAt: Date | null;
        })[];
        initiator: {
            id: string;
            profile: {
                displayName: string;
                bio: string | null;
            } | null;
            photos: {
                url: string;
            }[];
        };
        receiver: {
            id: string;
            profile: {
                displayName: string;
                bio: string | null;
            } | null;
            photos: {
                url: string;
            }[];
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        initiatorId: string;
        receiverId: string;
        status: import(".prisma/client").$Enums.MatchStatus;
    }>;
    static reportMessage(messageId: string, reporterId: string, reason: string): Promise<{
        success: boolean;
    }>;
}
export {};
//# sourceMappingURL=messaging.service.d.ts.map