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
    static discoverUsers(filters: DiscoveryFilters): Promise<any>;
    static handleSwipe(action: SwipeAction): Promise<{
        type: string;
        message: string;
        match?: undefined;
        isSuper?: undefined;
        like?: undefined;
    } | {
        type: string;
        message: string;
        match: any;
        isSuper: boolean;
        like?: undefined;
    } | {
        type: string;
        message: string;
        like: any;
        isSuper: boolean;
        match?: undefined;
    }>;
    static getUserMatches(userId: string): Promise<any>;
    static getReceivedLikes(userId: string): Promise<any>;
}
export {};
//# sourceMappingURL=discovery.service.d.ts.map