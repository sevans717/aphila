export declare function createUser(email: string, password: string): Promise<any>;
export declare function findUserByEmail(email: string): Promise<any>;
export declare function updateUserProfile(userId: string, data: Partial<{
    displayName: string;
    bio: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
}>): Promise<any>;
//# sourceMappingURL=user.service.d.ts.map