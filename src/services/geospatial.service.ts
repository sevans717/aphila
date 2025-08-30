import { getDistance } from "geolib";
import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";
import { handleServiceError } from "../utils/error";

export interface LocationUpdate {
  userId: string;
  latitude: number;
  longitude: number;
}

export interface NearbyQuery {
  latitude: number;
  longitude: number;
  radius: number; // in kilometers
  userId?: string; // to exclude from results
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

export class GeospatialService {
  /**
   * Update user's location
   */
  static async updateUserLocation(data: LocationUpdate): Promise<void> {
    try {
      const updateData: any = {
        latitude: data.latitude,
        longitude: data.longitude,
      };

      // If PostGIS is available, also update the geography column
      const postgisAvailable = await this.isPostGISAvailable();
      if (postgisAvailable) {
        updateData.locationGeography = `POINT(${data.longitude} ${data.latitude})`;
      }

      await prisma.profile.update({
        where: { userId: data.userId },
        data: updateData,
      });

      logger.info(`Updated location for user ${data.userId}`);
    } catch (error) {
      logger.error("Failed to update user location:", error);
      return handleServiceError(error);
    }
  }

  /**
   * Find nearby users and communities
   */
  static async findNearby(query: NearbyQuery): Promise<NearbyResult> {
    const result: NearbyResult = {
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
    } catch (error) {
      logger.error("Failed to find nearby entities:", error);
      return handleServiceError(error);
    }
  }

  /**
   * Find nearby users using geospatial queries
   */
  private static async findNearbyUsers(query: NearbyQuery): Promise<any[]> {
    try {
      // Try PostGIS first if available
      const postgisAvailable = await this.isPostGISAvailable();
      if (postgisAvailable) {
        return this.findNearbyUsersPostGIS(query);
      }
    } catch (error) {
      logger.warn("PostGIS not available, falling back to geolib:", error);
    }

    // Fallback to bounding box + distance calculation
    return this.findNearbyUsersGeolib(query);
  }

  /**
   * Check if PostGIS is available
   */
  private static async isPostGISAvailable(): Promise<boolean> {
    try {
      const result = await prisma.$queryRaw`SELECT PostGIS_version()`;
      return !!result;
    } catch {
      return false;
    }
  }

  /**
   * Find nearby users using PostGIS
   */
  private static async findNearbyUsersPostGIS(
    query: NearbyQuery
  ): Promise<any[]> {
    const userPoint = `POINT(${query.longitude} ${query.latitude})`;

    const users = (await prisma.$queryRaw`
      SELECT
        u.id,
        p."displayName",
        p.bio,
        p.gender,
        p."birthdate",
        p."isVerified",
        ST_Distance(p."locationGeography", ST_GeogFromText(${userPoint})) / 1000.0 as distance_km,
        ph.url as "primaryPhoto"
      FROM users u
      JOIN profiles p ON u.id = p."userId"
      LEFT JOIN photos ph ON u.id = ph."userId" AND ph."isPrimary" = true
      WHERE u."isActive" = true
        AND p."isVisible" = true
        AND p."locationGeography" IS NOT NULL
        AND ST_DWithin(p."locationGeography", ST_GeogFromText(${userPoint}), ${query.radius * 1000})
        AND u.id != ${query.userId || ""}
      ORDER BY p."locationGeography" <-> ST_GeogFromText(${userPoint})
      LIMIT ${query.limit || 50}
    `) as any[];

    return users.map((user: any) => ({
      id: user.id,
      profile: {
        displayName: user.displayName,
        bio: user.bio,
        gender: user.gender,
        birthdate: user.birthdate,
        isVerified: user.isVerified,
        primaryPhoto: user.primaryPhoto,
      },
      distance: Math.round((user.distance_km as number) * 10) / 10,
    }));
  }

  /**
   * Find nearby users using geolib (fallback)
   */
  private static async findNearbyUsersGeolib(
    query: NearbyQuery
  ): Promise<any[]> {
    // Use PostGIS if available, otherwise fall back to bounding box + distance calculation
    const boundingBox = this.calculateBoundingBox(
      query.latitude,
      query.longitude,
      query.radius
    );

    const users = await prisma.user.findMany({
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
            birthdate: true,
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
        if (!user.profile?.latitude || !user.profile?.longitude) return null;

        const distance =
          getDistance(
            { latitude: query.latitude, longitude: query.longitude },
            {
              latitude: user.profile.latitude,
              longitude: user.profile.longitude,
            }
          ) / 1000; // Convert to km

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
      .sort((a, b) => a!.distance - b!.distance);

    return usersWithDistance;
  }

  /**
   * Find nearby communities
   */
  private static async findNearbyCommunities(
    query: NearbyQuery
  ): Promise<any[]> {
    // For communities, we'll use the owner's location or a community-specific location
    const boundingBox = this.calculateBoundingBox(
      query.latitude,
      query.longitude,
      query.radius
    );

    const communities = await prisma.community.findMany({
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
        if (
          !community.owner.profile?.latitude ||
          !community.owner.profile?.longitude
        )
          return null;

        const distance =
          getDistance(
            { latitude: query.latitude, longitude: query.longitude },
            {
              latitude: community.owner.profile.latitude,
              longitude: community.owner.profile.longitude,
            }
          ) / 1000; // Convert to km

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
      .sort((a, b) => a!.distance - b!.distance);

    return communitiesWithDistance;
  }

  /**
   * Calculate bounding box for efficient querying
   */
  private static calculateBoundingBox(
    lat: number,
    lng: number,
    radiusKm: number
  ) {
    const earthRadiusKm = 6371;
    const latRadian = (lat * Math.PI) / 180;

    const deltaLat = (radiusKm / earthRadiusKm) * (180 / Math.PI);
    const deltaLng =
      ((radiusKm / earthRadiusKm) * (180 / Math.PI)) / Math.cos(latRadian);

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
  static async getUserLocation(
    userId: string
  ): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const profile = await prisma.profile.findUnique({
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
    } catch (error) {
      logger.error("Failed to get user location:", error);
      return handleServiceError(error) as any;
    }
  }

  /**
   * Calculate distance between two points
   */
  static calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    return getDistance(point1, point2) / 1000; // Convert to km
  }

  /**
   * Get users within a specific distance from a user
   */
  static async getUsersNearUser(
    userId: string,
    radiusKm: number = 50
  ): Promise<any[]> {
    const userLocation = await this.getUserLocation(userId);

    if (!userLocation) {
      const err = new Error("User location not available");
      logger.warn("getUsersNearUser called but user location missing", {
        userId,
      });
      return handleServiceError(err) as any;
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
  static async areUsersInRange(
    userId1: string,
    userId2: string
  ): Promise<boolean> {
    try {
      const [user1, user2] = await Promise.all([
        prisma.profile.findUnique({
          where: { userId: userId1 },
          select: { latitude: true, longitude: true, maxDistance: true },
        }),
        prisma.profile.findUnique({
          where: { userId: userId2 },
          select: { latitude: true, longitude: true, maxDistance: true },
        }),
      ]);

      if (
        !user1?.latitude ||
        !user1?.longitude ||
        !user2?.latitude ||
        !user2?.longitude
      ) {
        return false;
      }

      const distance = this.calculateDistance(
        { latitude: user1.latitude, longitude: user1.longitude },
        { latitude: user2.latitude, longitude: user2.longitude }
      );

      // Check if distance is within both users' preferences
      return distance <= user1.maxDistance && distance <= user2.maxDistance;
    } catch (error) {
      logger.error("Failed to check user range:", error);
      return handleServiceError(error) as any;
    }
  }

  /**
   * Get discovery feed based on location and preferences
   */
  static async getDiscoveryFeed(
    userId: string,
    limit: number = 20
  ): Promise<any[]> {
    try {
      const userProfile = await prisma.profile.findUnique({
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
        logger.warn("getDiscoveryFeed called but user location missing", {
          userId,
        });
        return handleServiceError(err) as any;
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
      const userIds = nearbyUsers.map((u) => u!.id);
      const profiles = await prisma.profile.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, birthdate: true },
      });

      const profileByUserId: Record<string, { birthdate: Date | null }> = {};
      profiles.forEach((p) => {
        profileByUserId[p.userId] = {
          birthdate: p.birthdate ? new Date(p.birthdate) : null,
        } as any;
      });

      const calcAge = (birthdate?: Date | null) => {
        if (!birthdate) return null;
        const diff = Date.now() - birthdate.getTime();
        const ageDt = new Date(diff);
        return Math.abs(ageDt.getUTCFullYear() - 1970);
      };

      const filteredUsers = nearbyUsers.filter((user) => {
        if (!user || !user.profile) return false;

        const p = profileByUserId[user.id];
        const age = calcAge(p?.birthdate ?? null);

        // If age is not available, include user (fallback)
        if (age === null) return true;

        const min = userProfile.ageMin ?? 18;
        const max = userProfile.ageMax ?? 120;

        return age >= min && age <= max;
      });

      return filteredUsers.slice(0, limit);
    } catch (error) {
      logger.error("Failed to get discovery feed:", error);
      return handleServiceError(error);
    }
  }

  /**
   * Update location and get nearby users in one call (optimized for mobile)
   */
  static async updateLocationAndGetNearby(
    userId: string,
    latitude: number,
    longitude: number,
    radius: number = 50
  ): Promise<NearbyResult> {
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
