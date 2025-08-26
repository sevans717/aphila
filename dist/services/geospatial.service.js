"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeospatialService = void 0;
const geolib_1 = require("geolib");
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
const error_1 = require("../utils/error");
class GeospatialService {
    /**
     * Update user's location
     */
    static async updateUserLocation(data) {
        try {
            await prisma_1.prisma.profile.update({
                where: { userId: data.userId },
                data: {
                    latitude: data.latitude,
                    longitude: data.longitude,
                },
            });
            logger_1.logger.info(`Updated location for user ${data.userId}`);
        }
        catch (error) {
            logger_1.logger.error("Failed to update user location:", error);
            return (0, error_1.handleServiceError)(error);
        }
    }
    /**
     * Find nearby users and communities
     */
    static async findNearby(query) {
        const result = {
            users: [],
            communities: [],
        };
        try {
            // Find nearby users
            if (query.type === "users" || query.type === "all") {
                result.users = await this.findNearbyUsers(query);
            }
            // Find nearby communities
            if (query.type === "communities" || query.type === "all") {
                result.communities = await this.findNearbyCommunities(query);
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error("Failed to find nearby entities:", error);
            return (0, error_1.handleServiceError)(error);
        }
    }
    /**
     * Find nearby users using geospatial queries
     */
    static async findNearbyUsers(query) {
        // Use PostGIS if available, otherwise fall back to bounding box + distance calculation
        const boundingBox = this.calculateBoundingBox(query.latitude, query.longitude, query.radius);
        const users = await prisma_1.prisma.user.findMany({
            where: {
                id: query.userId ? { not: query.userId } : undefined,
                isActive: true,
                profile: {
                    isVisible: true,
                    latitude: {
                        gte: boundingBox.minLat,
                        lte: boundingBox.maxLat,
                    },
                    longitude: {
                        gte: boundingBox.minLng,
                        lte: boundingBox.maxLng,
                    },
                },
            },
            include: {
                profile: {
                    select: {
                        displayName: true,
                        bio: true,
                        gender: true,
                        latitude: true,
                        longitude: true,
                        isVerified: true,
                    },
                },
                photos: {
                    where: { isPrimary: true },
                    select: { url: true },
                },
            },
            take: query.limit || 50,
        });
        // Calculate exact distances and filter
        const usersWithDistance = users
            .map((user) => {
            if (!user.profile?.latitude || !user.profile?.longitude)
                return null;
            const distance = (0, geolib_1.getDistance)({ latitude: query.latitude, longitude: query.longitude }, {
                latitude: user.profile.latitude,
                longitude: user.profile.longitude,
            }) / 1000; // Convert to km
            return distance <= query.radius
                ? {
                    id: user.id,
                    profile: {
                        ...user.profile,
                        primaryPhoto: user.photos[0]?.url,
                    },
                    distance: Math.round(distance * 10) / 10, // Round to 1 decimal
                }
                : null;
        })
            .filter(Boolean)
            .sort((a, b) => a.distance - b.distance);
        return usersWithDistance;
    }
    /**
     * Find nearby communities
     */
    static async findNearbyCommunities(query) {
        // For communities, we'll use the owner's location or a community-specific location
        const boundingBox = this.calculateBoundingBox(query.latitude, query.longitude, query.radius);
        const communities = await prisma_1.prisma.community.findMany({
            where: {
                visibility: "PUBLIC",
                owner: {
                    profile: {
                        latitude: {
                            gte: boundingBox.minLat,
                            lte: boundingBox.maxLat,
                        },
                        longitude: {
                            gte: boundingBox.minLng,
                            lte: boundingBox.maxLng,
                        },
                    },
                },
            },
            include: {
                owner: {
                    include: {
                        profile: {
                            select: {
                                latitude: true,
                                longitude: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        memberships: true,
                    },
                },
            },
            take: query.limit || 20,
        });
        const communitiesWithDistance = communities
            .map((community) => {
            if (!community.owner.profile?.latitude ||
                !community.owner.profile?.longitude)
                return null;
            const distance = (0, geolib_1.getDistance)({ latitude: query.latitude, longitude: query.longitude }, {
                latitude: community.owner.profile.latitude,
                longitude: community.owner.profile.longitude,
            }) / 1000; // Convert to km
            return distance <= query.radius
                ? {
                    id: community.id,
                    name: community.name,
                    description: community.description,
                    memberCount: community._count.memberships,
                    distance: Math.round(distance * 10) / 10,
                }
                : null;
        })
            .filter(Boolean)
            .sort((a, b) => a.distance - b.distance);
        return communitiesWithDistance;
    }
    /**
     * Calculate bounding box for efficient querying
     */
    static calculateBoundingBox(lat, lng, radiusKm) {
        const earthRadiusKm = 6371;
        const latRadian = (lat * Math.PI) / 180;
        const deltaLat = (radiusKm / earthRadiusKm) * (180 / Math.PI);
        const deltaLng = ((radiusKm / earthRadiusKm) * (180 / Math.PI)) / Math.cos(latRadian);
        return {
            minLat: lat - deltaLat,
            maxLat: lat + deltaLat,
            minLng: lng - deltaLng,
            maxLng: lng + deltaLng,
        };
    }
    /**
     * Get user's current location
     */
    static async getUserLocation(userId) {
        try {
            const profile = await prisma_1.prisma.profile.findUnique({
                where: { userId },
                select: { latitude: true, longitude: true },
            });
            if (!profile?.latitude || !profile?.longitude) {
                return null;
            }
            return {
                latitude: profile.latitude,
                longitude: profile.longitude,
            };
        }
        catch (error) {
            logger_1.logger.error("Failed to get user location:", error);
            return (0, error_1.handleServiceError)(error);
        }
    }
    /**
     * Calculate distance between two points
     */
    static calculateDistance(point1, point2) {
        return (0, geolib_1.getDistance)(point1, point2) / 1000; // Convert to km
    }
    /**
     * Get users within a specific distance from a user
     */
    static async getUsersNearUser(userId, radiusKm = 50) {
        const userLocation = await this.getUserLocation(userId);
        if (!userLocation) {
            const err = new Error("User location not available");
            logger_1.logger.warn("getUsersNearUser called but user location missing", {
                userId,
            });
            return (0, error_1.handleServiceError)(err);
        }
        return this.findNearbyUsers({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            radius: radiusKm,
            userId, // Exclude the requesting user
            limit: 100,
        });
    }
    /**
     * Check if two users are within each other's preferred distance
     */
    static async areUsersInRange(userId1, userId2) {
        try {
            const [user1, user2] = await Promise.all([
                prisma_1.prisma.profile.findUnique({
                    where: { userId: userId1 },
                    select: { latitude: true, longitude: true, maxDistance: true },
                }),
                prisma_1.prisma.profile.findUnique({
                    where: { userId: userId2 },
                    select: { latitude: true, longitude: true, maxDistance: true },
                }),
            ]);
            if (!user1?.latitude ||
                !user1?.longitude ||
                !user2?.latitude ||
                !user2?.longitude) {
                return false;
            }
            const distance = this.calculateDistance({ latitude: user1.latitude, longitude: user1.longitude }, { latitude: user2.latitude, longitude: user2.longitude });
            // Check if distance is within both users' preferences
            return distance <= user1.maxDistance && distance <= user2.maxDistance;
        }
        catch (error) {
            logger_1.logger.error("Failed to check user range:", error);
            return (0, error_1.handleServiceError)(error);
        }
    }
    /**
     * Get discovery feed based on location and preferences
     */
    static async getDiscoveryFeed(userId, limit = 20) {
        try {
            const userProfile = await prisma_1.prisma.profile.findUnique({
                where: { userId },
                select: {
                    latitude: true,
                    longitude: true,
                    maxDistance: true,
                    ageMin: true,
                    ageMax: true,
                    showMe: true,
                },
            });
            if (!userProfile?.latitude || !userProfile?.longitude) {
                const err = new Error("User location not available");
                logger_1.logger.warn("getDiscoveryFeed called but user location missing", {
                    userId,
                });
                return (0, error_1.handleServiceError)(err);
            }
            // Get potential matches based on location and preferences
            const nearbyUsers = await this.findNearbyUsers({
                latitude: userProfile.latitude,
                longitude: userProfile.longitude,
                radius: userProfile.maxDistance,
                userId,
                limit: limit * 2, // Get more to filter by preferences
            });
            // Filter by age and orientation preferences
            // Ensure we have birthdate available by re-querying IDs with birthdate if necessary
            const userIds = nearbyUsers.map((u) => u.id);
            const profiles = await prisma_1.prisma.profile.findMany({
                where: { userId: { in: userIds } },
                select: { userId: true, birthdate: true },
            });
            const profileByUserId = {};
            profiles.forEach((p) => {
                profileByUserId[p.userId] = {
                    birthdate: p.birthdate ? new Date(p.birthdate) : null,
                };
            });
            const calcAge = (birthdate) => {
                if (!birthdate)
                    return null;
                const diff = Date.now() - birthdate.getTime();
                const ageDt = new Date(diff);
                return Math.abs(ageDt.getUTCFullYear() - 1970);
            };
            const filteredUsers = nearbyUsers.filter((user) => {
                if (!user || !user.profile)
                    return false;
                const p = profileByUserId[user.id];
                const age = calcAge(p?.birthdate ?? null);
                // If age is not available, include user (fallback)
                if (age === null)
                    return true;
                const min = userProfile.ageMin ?? 18;
                const max = userProfile.ageMax ?? 120;
                return age >= min && age <= max;
            });
            return filteredUsers.slice(0, limit);
        }
        catch (error) {
            logger_1.logger.error("Failed to get discovery feed:", error);
            return (0, error_1.handleServiceError)(error);
        }
    }
    /**
     * Update location and get nearby users in one call (optimized for mobile)
     */
    static async updateLocationAndGetNearby(userId, latitude, longitude, radius = 50) {
        // Update location first
        await this.updateUserLocation({ userId, latitude, longitude });
        // Then get nearby entities
        return this.findNearby({
            latitude,
            longitude,
            radius,
            userId,
            type: "all",
        });
    }
}
exports.GeospatialService = GeospatialService;
//# sourceMappingURL=geospatial.service.js.map