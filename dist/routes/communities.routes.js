"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const community_service_1 = require("../services/community.service");
const router = (0, express_1.Router)();
const createCommunitySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().optional(),
    visibility: zod_1.z.enum(['PUBLIC', 'PRIVATE', 'SECRET']),
    categoryId: zod_1.z.string().optional(),
});
const sendMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(1000),
    messageType: zod_1.z.string().optional(),
});
// Get all communities (optionally filtered by category)
router.get('/', async (req, res) => {
    try {
        const { categoryId } = req.query;
        const communities = await community_service_1.CommunityService.getAllCommunities(categoryId);
        res.json(communities);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch communities' });
    }
});
// Get community by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const community = await community_service_1.CommunityService.getCommunityById(id);
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }
        res.json(community);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch community' });
    }
});
// Create community
router.post('/', auth_1.requireAuth, (0, validate_1.validateRequest)({ body: createCommunitySchema }), async (req, res) => {
    try {
        const data = req.body;
        const ownerId = req.user.userId;
        const community = await community_service_1.CommunityService.createCommunity({
            ...data,
            ownerId,
        });
        res.status(201).json(community);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create community' });
    }
});
// Join community
router.post('/:id/join', auth_1.requireAuth, (0, validate_1.validateRequest)({ params: zod_1.z.object({ id: zod_1.z.string() }) }), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const membership = await community_service_1.CommunityService.joinCommunity(userId, id);
        res.status(201).json(membership);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to join community' });
    }
});
// Leave community
router.delete('/:id/leave', auth_1.requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        await community_service_1.CommunityService.leaveCommunity(userId, id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to leave community' });
    }
});
// Send message to community
router.post('/:id/messages', auth_1.requireAuth, (0, validate_1.validateRequest)({ params: zod_1.z.object({ id: zod_1.z.string() }), body: sendMessageSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const senderId = req.user.userId;
        const message = await community_service_1.CommunityService.sendMessage({
            ...data,
            communityId: id,
            senderId,
        });
        res.status(201).json(message);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});
exports.default = router;
//# sourceMappingURL=communities.routes.js.map