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
//# sourceMappingURL=user.service.d.ts.map