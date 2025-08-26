"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharingService = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
const error_1 = require("../utils/error");
class SharingService {
    static async sharePost(data) {
        try {
            const { userId, postId, platform, comment } = data;
            if (!postId) {
                const err = new Error("Post ID is required for post sharing");
                logger_1.logger.warn("sharePost called without postId", { userId });
                return (0, error_1.handleServiceError)(err);
            }
            const share = await prisma_1.prisma.postShare.create({
                data: {
                    userId,
                    postId,
                    platform,
                    comment,
                },
                include: {
                    post: {
                        include: {
                            author: {
                                include: {
                                    profile: {
                                        select: {
                                            displayName: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            logger_1.logger.info("Post shared", {
                shareId: share.id,
                postId,
                userId,
                platform,
            });
            return {
                id: share.id,
                platform: share.platform || undefined,
                comment: share.comment || undefined,
                createdAt: share.createdAt,
                post: {
                    id: share.post.id,
                    content: share.post.content || undefined,
                    author: {
                        id: share.post.author.id,
                        profile: {
                            displayName: share.post.author.profile.displayName,
                        },
                    },
                },
            };
        }
        catch (error) {
            logger_1.logger.error("Error sharing post", { error, data });
            return (0, error_1.handleServiceError)(error);
        }
    }
    static async shareMedia(data) {
        try {
            const { userId, mediaId, platform, comment } = data;
            if (!mediaId) {
                const err = new Error("Media ID is required for media sharing");
                logger_1.logger.warn("shareMedia called without mediaId", { userId });
                return (0, error_1.handleServiceError)(err);
            }
            const share = await prisma_1.prisma.mediaShare.create({
                data: {
                    userId,
                    mediaId,
                    platform,
                    comment,
                },
                include: {
                    media: {
                        select: {
                            id: true,
                            url: true,
                            type: true,
                        },
                    },
                },
            });
            logger_1.logger.info("Media shared", {
                shareId: share.id,
                mediaId,
                userId,
                platform,
            });
            return {
                id: share.id,
                platform: share.platform || undefined,
                comment: share.comment || undefined,
                createdAt: share.createdAt,
                media: share.media,
            };
        }
        catch (error) {
            logger_1.logger.error("Error sharing media", { error, data });
            return (0, error_1.handleServiceError)(error);
        }
    }
    static async getUserShares(userId, limit = 20) {
        try {
            const [postShares, mediaShares] = await Promise.all([
                prisma_1.prisma.postShare.findMany({
                    where: { userId },
                    include: {
                        post: {
                            include: {
                                author: {
                                    include: {
                                        profile: {
                                            select: {
                                                displayName: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    take: Math.ceil(limit / 2),
                }),
                prisma_1.prisma.mediaShare.findMany({
                    where: { userId },
                    include: {
                        media: {
                            select: {
                                id: true,
                                url: true,
                                type: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    take: Math.ceil(limit / 2),
                }),
            ]);
            const allShares = [
                ...postShares.map((share) => ({
                    id: share.id,
                    platform: share.platform || undefined,
                    comment: share.comment || undefined,
                    createdAt: share.createdAt,
                    post: {
                        id: share.post.id,
                        content: share.post.content || undefined,
                        author: {
                            id: share.post.author.id,
                            profile: {
                                displayName: share.post.author.profile.displayName,
                            },
                        },
                    },
                })),
                ...mediaShares.map((share) => ({
                    id: share.id,
                    platform: share.platform || undefined,
                    comment: share.comment || undefined,
                    createdAt: share.createdAt,
                    media: share.media,
                })),
            ];
            return allShares
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, limit);
        }
        catch (error) {
            logger_1.logger.error("Error getting user shares", { error, userId });
            return (0, error_1.handleServiceError)(error);
        }
    }
    static async deleteShare(shareId, userId, type) {
        try {
            if (type === "post") {
                const share = await prisma_1.prisma.postShare.findUnique({
                    where: { id: shareId },
                    select: { userId: true },
                });
                if (!share) {
                    const err = new Error("Share not found");
                    logger_1.logger.warn("deleteShare called for missing post share", {
                        shareId,
                        userId,
                    });
                    return (0, error_1.handleServiceError)(err);
                }
                if (share.userId !== userId) {
                    const err = new Error("Unauthorized to delete this share");
                    logger_1.logger.warn("deleteShare unauthorized for post", { shareId, userId });
                    return (0, error_1.handleServiceError)(err);
                }
                await prisma_1.prisma.postShare.delete({
                    where: { id: shareId },
                });
            }
            else {
                const share = await prisma_1.prisma.mediaShare.findUnique({
                    where: { id: shareId },
                    select: { userId: true },
                });
                if (!share) {
                    const err = new Error("Share not found");
                    logger_1.logger.warn("deleteShare called for missing media share", {
                        shareId,
                        userId,
                    });
                    return (0, error_1.handleServiceError)(err);
                }
                if (share.userId !== userId) {
                    const err = new Error("Unauthorized to delete this share");
                    logger_1.logger.warn("deleteShare unauthorized for media", {
                        shareId,
                        userId,
                    });
                    return (0, error_1.handleServiceError)(err);
                }
                await prisma_1.prisma.mediaShare.delete({
                    where: { id: shareId },
                });
            }
            logger_1.logger.info("Share deleted", { shareId, userId, type });
        }
        catch (error) {
            logger_1.logger.error("Error deleting share", { error, shareId, userId, type });
            return (0, error_1.handleServiceError)(error);
        }
    }
    static async shareContent(data) {
        try {
            if (data.postId) {
                return this.sharePost(data);
            }
            else if (data.mediaId) {
                return this.shareMedia(data);
            }
            else {
                const err = new Error("Either postId or mediaId must be provided");
                logger_1.logger.warn("shareContent called without postId or mediaId", { data });
                return (0, error_1.handleServiceError)(err);
            }
        }
        catch (error) {
            logger_1.logger.error("Error sharing content", { error, data });
            return (0, error_1.handleServiceError)(error);
        }
    }
    static async getContentShares(contentId, type, limit = 20, offset = 0) {
        try {
            if (type === "post") {
                const [shares, total] = await Promise.all([
                    prisma_1.prisma.postShare.findMany({
                        where: { postId: contentId },
                        include: {
                            user: {
                                include: {
                                    profile: {
                                        select: {
                                            displayName: true,
                                        },
                                    },
                                },
                            },
                            post: {
                                include: {
                                    author: {
                                        include: {
                                            profile: {
                                                select: {
                                                    displayName: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        orderBy: { createdAt: "desc" },
                        skip: offset,
                        take: limit,
                    }),
                    prisma_1.prisma.postShare.count({
                        where: { postId: contentId },
                    }),
                ]);
                return {
                    shares: shares.map((share) => ({
                        id: share.id,
                        platform: share.platform || undefined,
                        comment: share.comment || undefined,
                        createdAt: share.createdAt,
                        post: {
                            id: share.post.id,
                            content: share.post.content || undefined,
                            author: {
                                id: share.post.author.id,
                                profile: {
                                    displayName: share.post.author.profile.displayName,
                                },
                            },
                        },
                    })),
                    total,
                };
            }
            else {
                const [shares, total] = await Promise.all([
                    prisma_1.prisma.mediaShare.findMany({
                        where: { mediaId: contentId },
                        include: {
                            user: {
                                include: {
                                    profile: {
                                        select: {
                                            displayName: true,
                                        },
                                    },
                                },
                            },
                            media: {
                                select: {
                                    id: true,
                                    url: true,
                                    type: true,
                                },
                            },
                        },
                        orderBy: { createdAt: "desc" },
                        skip: offset,
                        take: limit,
                    }),
                    prisma_1.prisma.mediaShare.count({
                        where: { mediaId: contentId },
                    }),
                ]);
                return {
                    shares: shares.map((share) => ({
                        id: share.id,
                        platform: share.platform || undefined,
                        comment: share.comment || undefined,
                        createdAt: share.createdAt,
                        media: share.media,
                    })),
                    total,
                };
            }
        }
        catch (error) {
            logger_1.logger.error("Error getting content shares", { error, contentId, type });
            return (0, error_1.handleServiceError)(error);
        }
    }
}
exports.SharingService = SharingService;
//# sourceMappingURL=sharing.service.js.map