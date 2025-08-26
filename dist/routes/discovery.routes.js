"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const community_service_1 = require("../services/community.service");
const discovery_service_1 = require("../services/discovery.service");
const router = (0, express_1.Router)();
// Validation schemas
const discoverQuerySchema = zod_1.z.object({
    latitude: zod_1.z.string().transform(Number).optional(),
    longitude: zod_1.z.string().transform(Number).optional(),
    maxDistance: zod_1.z.string().transform(Number).optional(),
    minAge: zod_1.z.string().transform(Number).optional(),
    maxAge: zod_1.z.string().transform(Number).optional(),
    orientation: zod_1.z.string().optional(),
    interests: zod_1.z
        .string()
        .optional()
        .transform((str) => (str ? str.split(",") : [])),
    limit: zod_1.z.string().transform(Number).optional(),
});
const swipeSchema = zod_1.z.object({
    swipedId: zod_1.z.string(),
    isLike: zod_1.z.boolean(),
    isSuper: zod_1.z.boolean().optional().default(false),
});
// GET /discover - Get users for discovery
router.get("/discover", auth_1.requireAuth, (0, validate_1.validateRequest)({ query: discoverQuerySchema }), async (req, res) => {
    try {
        const userId = req.user.id;
        const filters = {
            userId,
            ...req.query,
        };
        const users = await discovery_service_1.DiscoveryService.discoverUsers(filters);
        res.json({
            success: true,
            data: users.map((user) => ({
                id: user.userId,
                displayName: user.displayName,
                age: user.birthdate
                    ? Math.floor((Date.now() - new Date(user.birthdate).getTime()) /
                        (365.25 * 24 * 60 * 60 * 1000))
                    : null,
                bio: user.bio,
                orientation: user.orientation,
                location: user.latitude && user.longitude
                    ? {
                        latitude: user.latitude,
                        longitude: user.longitude,
                        city: user.city,
                        country: user.country,
                    }
                    : null,
                photos: user.user.photos,
                interests: user.user.interests,
                compatibilityScore: user.compatibilityScore,
                isVerified: user.isVerified,
                distance: req.query.latitude &&
                    req.query.longitude &&
                    user.latitude &&
                    user.longitude
                    ? Math.round(discovery_service_1.DiscoveryService.calculateDistance(parseFloat(req.query.latitude), parseFloat(req.query.longitude), user.latitude, user.longitude))
                    : null,
            })),
            pagination: {
                limit: filters.limit || 20,
                hasMore: users.length === (filters.limit || 20),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// POST /swipe - Handle swipe actions
router.post("/swipe", auth_1.requireAuth, (0, validate_1.validateRequest)({ body: swipeSchema }), async (req, res) => {
    try {
        const swiperId = req.user.id;
        const { swipedId, isLike, isSuper } = req.body;
        // Prevent self-swiping
        if (swiperId === swipedId) {
            return res.status(400).json({
                success: false,
                error: "Cannot swipe on yourself",
            });
        }
        const result = await discovery_service_1.DiscoveryService.handleSwipe({
            swiperId,
            swipedId,
            isLike,
            isSuper,
        });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// GET /matches - Get user's matches
router.get("/matches", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const matches = await discovery_service_1.DiscoveryService.getUserMatches(userId);
        res.json({
            success: true,
            data: matches.map((match) => {
                const otherUser = match.initiatorId === userId ? match.receiver : match.initiator;
                const lastMessage = match.messages[0];
                return {
                    id: match.id,
                    user: {
                        id: otherUser.id,
                        displayName: otherUser.profile?.displayName,
                        bio: otherUser.profile?.bio,
                        photo: otherUser.photos[0]?.url,
                    },
                    lastMessage: lastMessage
                        ? {
                            content: lastMessage.content,
                            sentAt: lastMessage.createdAt,
                            isFromMe: lastMessage.senderId === userId,
                        }
                        : null,
                    matchedAt: match.createdAt,
                    status: match.status,
                };
            }),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// GET /likes - Get likes received
router.get("/likes", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const likes = await discovery_service_1.DiscoveryService.getReceivedLikes(userId);
        res.json({
            success: true,
            data: likes.map((like) => ({
                id: like.id,
                user: {
                    id: like.liker.id,
                    displayName: like.liker.profile?.displayName,
                    bio: like.liker.profile?.bio,
                    photo: like.liker.photos[0]?.url,
                },
                isSuper: like.isSuper,
                likedAt: like.createdAt,
            })),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// GET /communities - simple passthrough for communities listing (compatibility)
router.get("/communities", async (req, res) => {
    try {
        const { categoryId } = req.query;
        const communities = await community_service_1.CommunityService.getAllCommunities(categoryId || undefined);
        res.json(communities);
    }
    catch (error) {
        res
            .status(500)
            .json({
            success: false,
            error: error.message || "Failed to fetch communities",
        });
    }
});
exports.default = router;
//# sourceMappingURL=discovery.routes.js.map