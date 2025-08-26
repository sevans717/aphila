export interface LocationUpdate {
    userId: string;
    latitude: number;
    longitude: number;
}
export interface NearbyQuery {
    latitude: number;
    longitude: number;
    radius: number;
    userId?: string;
    limit?: number;
    type?: "users" | "communities" | "all";
}
export interface NearbyResult {
    users: Array<{
        id: string;
        profile: any;
        distance: number;
    }>;
    communities: Array<{
        id: string;
        name: string;
        description: string;
        memberCount: number;
        distance: number;
    }>;
}
export declare class GeospatialService {
    /**
     * Update user's location
     */
    static updateUserLocation(data: LocationUpdate): Promise<void>;
    /**
     * Find nearby users and communities
     */
    static findNearby(query: NearbyQuery): Promise<NearbyResult>;
    /**
     * Find nearby users using geospatial queries
     */
    private static findNearbyUsers;
    /**
     * Find nearby communities
     */
    private static findNearbyCommunities;
    /**
     * Calculate bounding box for efficient querying
     */
    private static calculateBoundingBox;
    /**
     * Get user's current location
     */
    static getUserLocation(userId: string): Promise<{
        latitude: number;
        longitude: number;
    } | null>;
    /**
     * Calculate distance between two points
     */
    static calculateDistance(point1: {
        latitude: number;
        longitude: number;
    }, point2: {
        latitude: number;
        longitude: number;
    }): number;
    /**
     * Get users within a specific distance from a user
     */
    static getUsersNearUser(userId: string, radiusKm?: number): Promise<any[]>;
    /**
     * Check if two users are within each other's preferred distance
     */
    static areUsersInRange(userId1: string, userId2: string): Promise<boolean>;
    /**
     * Get discovery feed based on location and preferences
     */
    static getDiscoveryFeed(userId: string, limit?: number): Promise<any[]>;
    /**
     * Update location and get nearby users in one call (optimized for mobile)
     */
    static updateLocationAndGetNearby(userId: string, latitude: number, longitude: number, radius?: number): Promise<NearbyResult>;
}
//# sourceMappingURL=geospatial.service.d.ts.map