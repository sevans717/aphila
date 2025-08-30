export declare function createUser(email: string, password: string): Promise<{
    id: string;
    email: string;
    password: string;
    isActive: boolean;
    isAdmin: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function findUserByEmail(email: string): Promise<{
    id: string;
    email: string;
    password: string;
    isActive: boolean;
    isAdmin: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
} | null>;
export declare function updateUserProfile(userId: string, data: Partial<{
    displayName: string;
    bio: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
}>): Promise<{
    id: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    displayName: string;
    bio: string | null;
    avatar: string | null;
    birthdate: Date;
    gender: import("@prisma/client").$Enums.Gender;
    orientation: import("@prisma/client").$Enums.Orientation;
    location: string | null;
    locationGeography: string | null;
    latitude: number | null;
    longitude: number | null;
    maxDistance: number;
    ageMin: number;
    ageMax: number;
    showMe: import("@prisma/client").$Enums.Orientation;
    isVisible: boolean;
    isVerified: boolean;
}>;
//# sourceMappingURL=user.service.d.ts.map