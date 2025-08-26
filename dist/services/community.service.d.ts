export declare class CommunityService {
    static getAllCommunities(categoryId?: string): Promise<any>;
    static getCommunityById(id: string): Promise<any>;
    static createCommunity(data: {
        name: string;
        description?: string;
        visibility: "PUBLIC" | "PRIVATE" | "SECRET";
        ownerId: string;
        categoryId?: string;
    }): Promise<any>;
    static joinCommunity(userId: string, communityId: string): Promise<any>;
    static leaveCommunity(userId: string, communityId: string): Promise<any>;
    static sendMessage(data: {
        communityId: string;
        senderId: string;
        content: string;
        messageType?: string;
    }): Promise<any>;
}
//# sourceMappingURL=community.service.d.ts.map