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
interface MediaProcessingOptions {
    compress?: boolean;
    generateThumbnail?: boolean;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
}
interface BatchMediaUpload {
    files: any[];
    messageId: string;
    options?: MediaProcessingOptions;
}
export declare class MessagingService {
    private static messageCache;
    private static readonly CACHE_TTL;
    private static readonly MAX_CACHED_MESSAGES;
    private static userMessageCounts;
    private static readonly MAX_MESSAGES_PER_MINUTE;
    private static typingTimeouts;
    private static _mediaProcessingQueue;
    private static _isProcessingMedia;
    private static mediaCache;
    private static readonly MEDIA_CACHE_TTL;
    private static readonly MAX_CACHED_MEDIA;
    private static getCachedMessages;
    private static setCachedMessages;
    private static getCachedMedia;
    private static setCachedMedia;
    private static checkRateLimit;
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
        reactions: {
            id: string;
            userId: string;
            createdAt: Date;
            messageId: string;
            reaction: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.MessageStatus;
        receiverId: string;
        matchId: string;
        senderId: string;
        content: string;
        messageType: string;
        isRead: boolean;
        readAt: Date | null;
        parentId: string | null;
        clientNonce: string | null;
    }>;
    static getMatchMessages(filters: MessageFilters): Promise<any[]>;
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
            reactions: ({
                user: {
                    id: string;
                    profile: {
                        displayName: string;
                    } | null;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                messageId: string;
                reaction: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.MessageStatus;
            receiverId: string;
            matchId: string;
            senderId: string;
            content: string;
            messageType: string;
            isRead: boolean;
            readAt: Date | null;
            parentId: string | null;
            clientNonce: string | null;
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
        status: import("@prisma/client").$Enums.MatchStatus;
        initiatorId: string;
        receiverId: string;
    }>;
    static reportMessage(messageId: string, reporterId: string, reason: string): Promise<{
        success: boolean;
    }>;
    static addReaction(messageId: string, userId: string, reaction: string): Promise<{
        user: {
            id: string;
            profile: {
                displayName: string;
            } | null;
        };
    } & {
        id: string;
        userId: string;
        createdAt: Date;
        messageId: string;
        reaction: string;
    }>;
    static removeReaction(messageId: string, userId: string, reaction: string): Promise<{
        success: boolean;
    }>;
    static getMessageReactions(messageId: string): Promise<{
        messageId: string;
        reactions: {
            [key: string]: {
                count: number;
                users: any[];
            };
        };
        totalCount: number;
    }>;
    static uploadMessageMedia(file: any, // multer file object
    messageId: string, _options?: MediaProcessingOptions): Promise<any>;
    static uploadBatchMedia(batchData: BatchMediaUpload): Promise<any[]>;
    private static compressImage;
    private static processVideo;
    private static generateImageThumbnail;
    private static generateVideoThumbnail;
    static getMediaWithRange(mediaId: string, range?: string): Promise<{
        data: Buffer;
        mimeType: string;
        range?: {
            start: number;
            end: number;
            total: number;
        };
    }>;
    static cleanupOldMedia(daysOld?: number): Promise<void>;
    static handleTyping(data: {
        matchId: string;
        userId: string;
        isTyping: boolean;
    }): Promise<void>;
    static cleanup(): void;
}
export {};
//# sourceMappingURL=messaging.service.d.ts.map