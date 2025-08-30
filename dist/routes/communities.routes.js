"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const analytics_service_1 = require("../services/analytics.service");
const router = (0, express_1.Router)();
// Validation schemas
const createCommunitySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().min(1).max(500),
    category: zod_1.z.string().optional(),
    isPrivate: zod_1.z.boolean().default(false),
    location: zod_1.z
        .object({
        latitude: zod_1.z.number(),
        longitude: zod_1.z.number(),
    })
        .optional(),
});
const updateCommunitySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().min(1).max(500).optional(),
    category: zod_1.z.string().optional(),
    isPrivate: zod_1.z.boolean().optional(),
    location: zod_1.z
        .object({
        latitude: zod_1.z.number(),
        longitude: zod_1.z.number(),
    })
        .optional(),
});
const communityQuerySchema = zod_1.z.object({
    limit: zod_1.z.string().transform(Number).optional().default(20),
    offset: zod_1.z.string().transform(Number).optional().default(0),
    category: zod_1.z.string().optional(),
    nearby: zod_1.z.string().optional(), // "lat,lng,radius"
});
// Get all communities
router.get("/", auth_1.requireAuth, (0, validate_1.validateRequest)({ query: communityQuerySchema }), async (req, res) => {
    try {
        const _userId = req.user.id;
        const { category, nearby } = req.query;
        const whereClause = {};
        // Filter by category if provided
        if (category) {
            whereClause.category = category;
        }
        // Filter by nearby location if provided
        if (nearby) {
            const [lat, lng, radius] = nearby.split(",").map(Number);
            if (lat && lng && radius) {
                // Use PostGIS if available, otherwise skip location filter
                try {
                    const nearbyCommunities = await prisma_1.prisma.$queryRaw `
            SELECT id FROM communities
            WHERE ST_DWithin(location, ST_GeogFromText('POINT(${lng} ${lat})'), ${radius * 1000})
          `;
                    const communityIds = nearbyCommunities.map((c) => c.id);
                    whereClause.id = { in: communityIds };
                }
                catch {
                    logger_1.logger.warn("PostGIS not available for community location filter");
                }
            }
        }
        const communities = await prisma_1.prisma.community.findMany({
            where: whereClause,
            include: {
                owner: {
                    select: {
                        id: true,
                        profile: {
                            select: { displayName: true },
                        },
                    },
                },
                _count: {
                    select: { memberships: true, messages: true },
                },
            },
            orderBy: { createdAt: "desc" },
            take: parseInt(req.query.limit) || 20,
            skip: parseInt(req.query.offset) || 0,
        });
        const total = await prisma_1.prisma.community.count({ where: whereClause });
        // Track analytics for community browsing
        await analytics_service_1.AnalyticsService.trackEvent({
            userId: _userId,
            event: "communities_browsed",
            properties: {
                totalCommunities: communities.length,
                category: category || null,
                nearby: nearby ? true : false,
                limit: parseInt(req.query.limit) || 20,
                platform: req.headers["user-agent"]?.includes("Mobile")
                    ? "mobile"
                    : "web",
            },
        }).catch((err) => {
            logger_1.logger.warn("Failed to track community browsing analytics:", err);
        });
        logger_1.logger.info("Communities browsed:", {
            userId: _userId,
            communityCount: communities.length,
            category: category || null,
            nearby: nearby ? true : false,
        });
        res.json({
            success: true,
            data: {
                communities: communities.map((community) => ({
                    id: community.id,
                    name: community.name,
                    description: community.description,
                    category: community.categoryId,
                    isPrivate: community.visibility === "PRIVATE",
                    owner: community.owner,
                    memberCount: community._count.memberships,
                    messageCount: community._count.messages,
                    createdAt: community.createdAt,
                })),
                pagination: {
                    total,
                    limit: parseInt(req.query.limit) || 20,
                    offset: parseInt(req.query.offset) || 0,
                    hasMore: (parseInt(req.query.offset) || 0) +
                        (parseInt(req.query.limit) || 20) <
                        total,
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to get communities:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Create a new community
router.post("/", auth_1.requireAuth, (0, validate_1.validateRequest)({ body: createCommunitySchema }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description, category, isPrivate, location } = req.body;
        // Check if community name already exists
        const existingCommunity = await prisma_1.prisma.community.findFirst({
            where: { name: { equals: name, mode: "insensitive" } },
        });
        if (existingCommunity) {
            return res.status(400).json({
                success: false,
                error: "Community name already exists",
            });
        }
        const communityData = {
            name,
            description,
            categoryId: category || null,
            visibility: isPrivate ? "PRIVATE" : "PUBLIC",
            ownerId: userId,
        };
        // Add location if provided
        if (location) {
            try {
                communityData.location = `POINT(${location.longitude} ${location.latitude})`;
            }
            catch {
                logger_1.logger.warn("Failed to set community location");
            }
        }
        const community = await prisma_1.prisma.community.create({
            data: communityData,
            include: {
                owner: {
                    select: {
                        id: true,
                        profile: {
                            select: { displayName: true },
                        },
                    },
                },
                _count: {
                    select: { memberships: true },
                },
            },
        });
        // Add owner as first member
        await prisma_1.prisma.communityMembership.create({
            data: {
                communityId: community.id,
                userId,
                role: client_1.MembershipRole.ADMIN,
            },
        });
        res.status(201).json({
            success: true,
            data: {
                community: {
                    id: community.id,
                    name: community.name,
                    description: community.description,
                    category: community.categoryId,
                    isPrivate: community.visibility === "PRIVATE",
                    owner: community.owner,
                    memberCount: community._count.memberships + 1, // Include owner
                    createdAt: community.createdAt,
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to create community:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Get community by ID
router.get("/:id", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const community = await prisma_1.prisma.community.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true,
                        profile: {
                            select: { displayName: true, bio: true },
                        },
                    },
                },
                memberships: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                profile: {
                                    select: { displayName: true },
                                },
                            },
                        },
                    },
                },
                _count: {
                    select: { memberships: true, messages: true },
                },
            },
        });
        if (!community) {
            return res.status(404).json({
                success: false,
                error: "Community not found",
            });
        }
        // Check if user is member (for private communities)
        const isMember = community.memberships.some((m) => m.userId === userId);
        const isOwner = community.ownerId === userId;
        if (community.visibility === "PRIVATE" && !isMember && !isOwner) {
            return res.status(403).json({
                success: false,
                error: "Access denied to private community",
            });
        }
        res.json({
            success: true,
            data: {
                community: {
                    id: community.id,
                    name: community.name,
                    description: community.description,
                    category: community.categoryId,
                    isPrivate: community.visibility === "PRIVATE",
                    owner: community.owner,
                    members: community.memberships.map((m) => ({
                        id: m.user.id,
                        displayName: m.user.profile?.displayName,
                        role: m.role,
                        joinedAt: m.joinedAt,
                    })),
                    memberCount: community._count.memberships,
                    messageCount: community._count.messages,
                    createdAt: community.createdAt,
                    isMember,
                    isOwner,
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to get community:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Update community
router.put("/:id", auth_1.requireAuth, (0, validate_1.validateRequest)({ body: updateCommunitySchema }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updates = req.body; // Check if user is owner
        const community = await prisma_1.prisma.community.findUnique({
            where: { id },
            select: { ownerId: true },
        });
        if (!community) {
            return res.status(404).json({
                success: false,
                error: "Community not found",
            });
        }
        if (community.ownerId !== userId) {
            return res.status(403).json({
                success: false,
                error: "Only community owner can update community",
            });
        }
        const updateData = { ...updates };
        // Handle category and visibility updates
        if (updates.category !== undefined) {
            updateData.categoryId = updates.category;
            delete updateData.category;
        }
        if (updates.isPrivate !== undefined) {
            updateData.visibility = updates.isPrivate ? "PRIVATE" : "PUBLIC";
            delete updateData.isPrivate;
        }
        // Handle location update
        if (updates.location) {
            try {
                updateData.location = `POINT(${updates.location.longitude} ${updates.location.latitude})`;
            }
            catch {
                logger_1.logger.warn("Failed to update community location");
            }
        }
        const updatedCommunity = await prisma_1.prisma.community.update({
            where: { id },
            data: updateData,
            include: {
                owner: {
                    select: {
                        id: true,
                        profile: {
                            select: { displayName: true },
                        },
                    },
                },
                _count: {
                    select: { memberships: true },
                },
            },
        });
        res.json({
            success: true,
            data: {
                community: {
                    id: updatedCommunity.id,
                    name: updatedCommunity.name,
                    description: updatedCommunity.description,
                    category: updatedCommunity.categoryId,
                    isPrivate: updatedCommunity.visibility === "PRIVATE",
                    owner: updatedCommunity.owner,
                    memberCount: updatedCommunity._count.memberships,
                    updatedAt: updatedCommunity.updatedAt,
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to update community:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Delete community
router.delete("/:id", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        // Check if user is owner
        const community = await prisma_1.prisma.community.findUnique({
            where: { id },
            select: { ownerId: true, name: true },
        });
        if (!community) {
            return res.status(404).json({
                success: false,
                error: "Community not found",
            });
        }
        if (community.ownerId !== userId) {
            return res.status(403).json({
                success: false,
                error: "Only community owner can delete community",
            });
        }
        // Delete community and all related data
        await prisma_1.prisma.community.delete({
            where: { id },
        });
        res.json({
            success: true,
            data: {
                deleted: true,
                communityId: id,
                communityName: community.name,
            },
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to delete community:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Join a community
router.post("/:id/join", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const community = await prisma_1.prisma.community.findUnique({
            where: { id },
            select: { id: true, name: true, visibility: true, ownerId: true },
        });
        if (!community) {
            return res.status(404).json({
                success: false,
                error: "Community not found",
            });
        }
        // Check if already a member
        const existingMembership = await prisma_1.prisma.communityMembership.findUnique({
            where: {
                userId_communityId: {
                    userId,
                    communityId: id,
                },
            },
        });
        if (existingMembership) {
            return res.status(400).json({
                success: false,
                error: "Already a member of this community",
            });
        }
        // For private communities, this would need approval logic
        // For now, allow direct joining
        const membership = await prisma_1.prisma.communityMembership.create({
            data: {
                communityId: id,
                userId,
                role: community.ownerId === userId
                    ? client_1.MembershipRole.ADMIN
                    : client_1.MembershipRole.MEMBER,
            },
        });
        res.json({
            success: true,
            data: {
                communityId: id,
                communityName: community.name,
                userId,
                role: membership.role,
                joinedAt: membership.joinedAt,
            },
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to join community:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Leave a community
router.post("/:id/leave", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const community = await prisma_1.prisma.community.findUnique({
            where: { id },
            select: { id: true, name: true, ownerId: true },
        });
        if (!community) {
            return res.status(404).json({
                success: false,
                error: "Community not found",
            });
        }
        // Owner cannot leave their own community
        if (community.ownerId === userId) {
            return res.status(400).json({
                success: false,
                error: "Community owner cannot leave their own community",
            });
        }
        const membership = await prisma_1.prisma.communityMembership.findUnique({
            where: {
                userId_communityId: {
                    userId,
                    communityId: id,
                },
            },
        });
        if (!membership) {
            return res.status(400).json({
                success: false,
                error: "Not a member of this community",
            });
        }
        await prisma_1.prisma.communityMembership.delete({
            where: {
                userId_communityId: {
                    userId,
                    communityId: id,
                },
            },
        });
        res.json({
            success: true,
            data: {
                communityId: id,
                communityName: community.name,
                userId,
                leftAt: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to leave community:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Get community messages
router.get("/:id/messages", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const before = req.query.before;
        // Check if user is member
        const membership = await prisma_1.prisma.communityMembership.findUnique({
            where: {
                userId_communityId: {
                    userId,
                    communityId: id,
                },
            },
        });
        if (!membership) {
            return res.status(403).json({
                success: false,
                error: "Not a member of this community",
            });
        }
        const whereClause = { communityId: id };
        if (before) {
            const beforeMessage = await prisma_1.prisma.communityMessage.findUnique({
                where: { id: before },
                select: { createdAt: true },
            });
            if (beforeMessage) {
                whereClause.createdAt = { lt: beforeMessage.createdAt };
            }
        }
        const messages = await prisma_1.prisma.communityMessage.findMany({
            where: whereClause,
            include: {
                sender: {
                    select: {
                        id: true,
                        profile: {
                            select: { displayName: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
        });
        res.json({
            success: true,
            data: {
                messages: messages.reverse().map((message) => ({
                    id: message.id,
                    senderId: message.senderId,
                    content: message.content,
                    messageType: message.messageType,
                    createdAt: message.createdAt,
                    sender: message.sender,
                })),
                hasMore: messages.length === limit,
            },
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to get community messages:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Send message to community
router.post("/:id/messages", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { content, messageType } = req.body;
        // Check if user is member
        const membership = await prisma_1.prisma.communityMembership.findUnique({
            where: {
                userId_communityId: {
                    userId,
                    communityId: id,
                },
            },
        });
        if (!membership) {
            return res.status(403).json({
                success: false,
                error: "Not a member of this community",
            });
        }
        const message = await prisma_1.prisma.communityMessage.create({
            data: {
                communityId: id,
                senderId: userId,
                content,
                messageType: messageType || "text",
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        profile: {
                            select: { displayName: true },
                        },
                    },
                },
            },
        });
        res.status(201).json({
            success: true,
            data: {
                message: {
                    id: message.id,
                    senderId: message.senderId,
                    content: message.content,
                    messageType: message.messageType,
                    createdAt: message.createdAt,
                    sender: message.sender,
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to send community message:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=communities.routes.js.map