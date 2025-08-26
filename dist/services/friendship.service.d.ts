export declare class FriendshipService {
    static sendFriendRequest(requesterId: string, addresseeId: string): Promise<{
        requester: {
            id: string;
            profile: {
                displayName: string;
            } | null;
        };
        addressee: {
            id: string;
            profile: {
                displayName: string;
            } | null;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.FriendshipStatus;
        requesterId: string;
        addresseeId: string;
        respondedAt: Date | null;
    }>;
    static respondToFriendRequest(friendshipId: string, userId: string, accept: boolean): Promise<{
        requester: {
            id: string;
            profile: {
                displayName: string;
            } | null;
        };
        addressee: {
            id: string;
            profile: {
                displayName: string;
            } | null;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.FriendshipStatus;
        requesterId: string;
        addresseeId: string;
        respondedAt: Date | null;
    }>;
    static getFriends(userId: string): Promise<({
        requester: {
            id: string;
            profile: {
                displayName: string;
                bio: string | null;
            } | null;
            photos: {
                url: string;
            }[];
        };
        addressee: {
            id: string;
            profile: {
                displayName: string;
                bio: string | null;
            } | null;
            photos: {
                url: string;
            }[];
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.FriendshipStatus;
        requesterId: string;
        addresseeId: string;
        respondedAt: Date | null;
    })[]>;
    static getPendingRequests(userId: string): Promise<({
        requester: {
            id: string;
            profile: {
                displayName: string;
                bio: string | null;
            } | null;
            photos: {
                url: string;
            }[];
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.FriendshipStatus;
        requesterId: string;
        addresseeId: string;
        respondedAt: Date | null;
    })[]>;
}
//# sourceMappingURL=friendship.service.d.ts.map