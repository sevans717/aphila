"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityService = void 0;
const prisma_1 = require("../lib/prisma");
class CommunityService {
    static async getAllCommunities(categoryId) {
        return await prisma_1.prisma.community.findMany({
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
    static async getCommunityById(id) {
        return await prisma_1.prisma.community.findUnique({
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
    static async createCommunity(data) {
        return await prisma_1.prisma.community.create({
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
    static async joinCommunity(userId, communityId) {
        return await prisma_1.prisma.communityMembership.upsert({
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
                role: "MEMBER",
            },
        });
    }
    static async leaveCommunity(userId, communityId) {
        return await prisma_1.prisma.communityMembership.delete({
            where: {
                userId_communityId: {
                    userId,
                    communityId,
                },
            },
        });
    }
    static async sendMessage(data) {
        return await prisma_1.prisma.communityMessage.create({
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
exports.CommunityService = CommunityService;
//# sourceMappingURL=community.service.js.map