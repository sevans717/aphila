import { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";

export class CommunityService {
  static async getAllCommunities(categoryId?: string) {
    return await prisma.community.findMany({
      where: {
        visibility: "PUBLIC",
        ...(categoryId && { categoryId }),
      },
      include: {
        owner: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            memberships: true,
            messages: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getCommunityById(id: string) {
    return await prisma.community.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
        category: true,
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
        messages: {
          include: {
            sender: {
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
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });
  }

  static async createCommunity(data: {
    name: string;
    description?: string;
    visibility: "PUBLIC" | "PRIVATE" | "SECRET";
    ownerId: string;
    categoryId?: string;
  }) {
    return await prisma.community.create({
      data,
      include: {
        owner: {
          select: {
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
        category: true,
      },
    });
  }

  static async joinCommunity(userId: string, communityId: string) {
    return await prisma.communityMembership.upsert({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
      update: {},
      create: {
        userId,
        communityId,
        role: "MEMBER" as const,
      },
    });
  }

  static async leaveCommunity(userId: string, communityId: string) {
    return await prisma.communityMembership.delete({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
    });
  }

  static async sendMessage(data: {
    communityId: string;
    senderId: string;
    content: string;
    messageType?: string;
  }) {
    return await prisma.communityMessage.create({
      data: {
        ...data,
        messageType: data.messageType || "text",
      },
      include: {
        sender: {
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
    });
  }
}
