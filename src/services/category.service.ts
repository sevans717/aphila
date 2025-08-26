import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CategoryService {
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

  static async getCategoryBySlug(slug: string) {
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

  static async joinCategory(userId: string, categoryId: string) {
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
        role: 'MEMBER' as const,
      },
    });
  }

  static async leaveCategory(userId: string, categoryId: string) {
    return await prisma.categoryMembership.delete({
      where: {
        userId_categoryId: {
          userId,
          categoryId,
        },
      },
    });
  }

  static async getUserCategories(userId: string) {
    return await prisma.categoryMembership.findMany({
      where: { userId },
      include: {
        category: true,
      },
    });
  }
}
