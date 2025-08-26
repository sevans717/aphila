export declare class CommunityService {
    static getAllCommunities(categoryId?: string): Promise<({
        _count: {
            messages: number;
            memberships: number;
        };
        category: {
            name: string;
            slug: string;
        } | null;
        owner: {
            id: string;
            profile: {
                displayName: string;
            } | null;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        categoryId: string | null;
        ownerId: string;
        visibility: import(".prisma/client").$Enums.CommunityVisibility;
    })[]>;
    static getCommunityById(id: string): Promise<({
        category: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            type: import(".prisma/client").$Enums.CategoryType | null;
            slug: string;
        } | null;
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
            senderId: string;
            content: string;
            messageType: string;
            communityId: string;
            editedAt: Date | null;
        })[];
        memberships: ({
            user: {
                id: string;
                profile: {
                    displayName: string;
                } | null;
            };
        } & {
            id: string;
            userId: string;
            role: import(".prisma/client").$Enums.MembershipRole;
            joinedAt: Date;
            communityId: string;
        })[];
        owner: {
            id: string;
            profile: {
                displayName: string;
            } | null;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        categoryId: string | null;
        ownerId: string;
        visibility: import(".prisma/client").$Enums.CommunityVisibility;
    }) | null>;
    static createCommunity(data: {
        name: string;
        description?: string;
        visibility: "PUBLIC" | "PRIVATE" | "SECRET";
        ownerId: string;
        categoryId?: string;
    }): Promise<{
        category: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            type: import(".prisma/client").$Enums.CategoryType | null;
            slug: string;
        } | null;
        owner: {
            profile: {
                displayName: string;
            } | null;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        categoryId: string | null;
        ownerId: string;
        visibility: import(".prisma/client").$Enums.CommunityVisibility;
    }>;
    static joinCommunity(userId: string, communityId: string): Promise<{
        id: string;
        userId: string;
        role: import(".prisma/client").$Enums.MembershipRole;
        joinedAt: Date;
        communityId: string;
    }>;
    static leaveCommunity(userId: string, communityId: string): Promise<{
        id: string;
        userId: string;
        role: import(".prisma/client").$Enums.MembershipRole;
        joinedAt: Date;
        communityId: string;
    }>;
    static sendMessage(data: {
        communityId: string;
        senderId: string;
        content: string;
        messageType?: string;
    }): Promise<{
        sender: {
            id: string;
            profile: {
                displayName: string;
            } | null;
        };
    } & {
        id: string;
        createdAt: Date;
        senderId: string;
        content: string;
        messageType: string;
        communityId: string;
        editedAt: Date | null;
    }>;
}
//# sourceMappingURL=community.service.d.ts.map