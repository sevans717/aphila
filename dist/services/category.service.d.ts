export declare class CategoryService {
    static getAllCategories(): Promise<({
        _count: {
            memberships: number;
            communities: number;
        };
    } & {
        id: string;
        type: import("@prisma/client").$Enums.CategoryType | null;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        slug: string;
    })[]>;
    static getCategoryBySlug(slug: string): Promise<({
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
            categoryId: string;
            role: import("@prisma/client").$Enums.MembershipRole;
            joinedAt: Date;
        })[];
        communities: ({
            _count: {
                memberships: number;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            categoryId: string | null;
            ownerId: string;
            visibility: import("@prisma/client").$Enums.CommunityVisibility;
        })[];
    } & {
        id: string;
        type: import("@prisma/client").$Enums.CategoryType | null;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        slug: string;
    }) | null>;
    static joinCategory(userId: string, categoryId: string): Promise<{
        id: string;
        userId: string;
        categoryId: string;
        role: import("@prisma/client").$Enums.MembershipRole;
        joinedAt: Date;
    }>;
    static leaveCategory(userId: string, categoryId: string): Promise<{
        id: string;
        userId: string;
        categoryId: string;
        role: import("@prisma/client").$Enums.MembershipRole;
        joinedAt: Date;
    }>;
    static getUserCategories(userId: string): Promise<({
        category: {
            id: string;
            type: import("@prisma/client").$Enums.CategoryType | null;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            slug: string;
        };
    } & {
        id: string;
        userId: string;
        categoryId: string;
        role: import("@prisma/client").$Enums.MembershipRole;
        joinedAt: Date;
    })[]>;
}
//# sourceMappingURL=category.service.d.ts.map