interface DiscoveryFilters {
    userId: string;
    latitude?: number;
    longitude?: number;
    maxDistance?: number;
    minAge?: number;
    maxAge?: number;
    orientation?: string;
    interests?: string[];
    limit?: number;
}
interface SwipeAction {
    swiperId: string;
    swipedId: string;
    isLike: boolean;
    isSuper?: boolean;
}
export declare class DiscoveryService {
    static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
    static discoverUsers(filters: DiscoveryFilters): Promise<any[]>;
    static handleSwipe(action: SwipeAction): Promise<{
        type: string;
        message: string;
        match?: undefined;
        isSuper?: undefined;
        like?: undefined;
    } | {
        type: string;
        message: string;
        match: {
            initiator: {
                profile: {
                    displayName: string;
                } | null;
            };
            receiver: {
                profile: {
                    displayName: string;
                } | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            initiatorId: string;
            receiverId: string;
            status: import(".prisma/client").$Enums.MatchStatus;
        };
        isSuper: boolean;
        like?: undefined;
    } | {
        type: string;
        message: string;
        like: {
            id: string;
            createdAt: Date;
            likerId: string;
            likedId: string;
            isSuper: boolean;
        };
        isSuper: boolean;
        match?: undefined;
    }>;
    static getUserMatches(userId: string): Promise<({
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
        messages: {
            createdAt: Date;
            senderId: string;
            content: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        initiatorId: string;
        receiverId: string;
        status: import(".prisma/client").$Enums.MatchStatus;
    })[]>;
    static getReceivedLikes(userId: string): Promise<({
        liker: {
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
        likerId: string;
        likedId: string;
        isSuper: boolean;
    })[]>;
}
export {};
//# sourceMappingURL=discovery.service.d.ts.map