"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class CategoryService {
    static async getAllCategories() {
        return await prisma.category.findMany({
            where: { isActive: true },
            include: {
                _count: {
                    select: {
                        memberships: true,
                        communities: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
    static async getCategoryBySlug(slug) {
        return await prisma.category.findUnique({
            where: { slug },
            include: {
                memberships: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                profile: {
                                    select: {
                                        displayName: true,
                                    },
                                },
                            },
                        },
                    },
                },
                communities: {
                    where: { visibility: 'PUBLIC' },
                    include: {
                        _count: {
                            select: {
                                memberships: true,
                            },
                        },
                    },
                },
            },
        });
    }
    static async joinCategory(userId, categoryId) {
        return await prisma.categoryMembership.upsert({
            where: {
                userId_categoryId: {
                    userId,
                    categoryId,
                },
            },
            update: {},
            create: {
                userId,
                categoryId,
                role: 'MEMBER',
            },
        });
    }
    static async leaveCategory(userId, categoryId) {
        return await prisma.categoryMembership.delete({
            where: {
                userId_categoryId: {
                    userId,
                    categoryId,
                },
            },
        });
    }
    static async getUserCategories(userId) {
        return await prisma.categoryMembership.findMany({
            where: { userId },
            include: {
                category: true,
            },
        });
    }
}
exports.CategoryService = CategoryService;
//# sourceMappingURL=category.service.js.map