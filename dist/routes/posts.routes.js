"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const post_service_1 = require("../services/post.service");
const router = (0, express_1.Router)();
// Validation schemas
const createPostSchema = { body: zod_1.z.object({ content: zod_1.z.string().min(1).max(10000).optional(), communityId: zod_1.z.string().cuid().optional(), type: zod_1.z.string().optional(), visibility: zod_1.z.string().optional() }) };
const updatePostSchema = { body: zod_1.z.object({ content: zod_1.z.string().min(1).max(10000).optional(), isPinned: zod_1.z.boolean().optional(), isArchived: zod_1.z.boolean().optional() }) };
// Get a single post
router.get('/:postId', auth_1.requireAuth, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user?.userId;
        const post = await post_service_1.PostService.getPostById(postId, userId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        res.json({ success: true, data: post });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch post' });
    }
});
// Get feed
router.get('/feed', auth_1.requireAuth, async (req, res) => {
    try {
        const { cursor, limit } = req.query;
        const userId = req.user.userId;
        const result = await post_service_1.PostService.getFeed(userId, { cursor: cursor, limit: limit ? parseInt(limit, 10) : undefined });
        res.json({ success: true, data: result });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch feed' });
    }
});
// Create a post
router.post('/', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const post = await post_service_1.PostService.createPost({ authorId: userId, content: req.body.content, communityId: req.body.communityId, type: req.body.type, visibility: req.body.visibility });
        res.status(201).json({ success: true, data: post });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to create post' });
    }
});
// Update a post
router.patch('/:postId', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const updated = await post_service_1.PostService.updatePost(req.params.postId, userId, { content: req.body.content, isPinned: req.body.isPinned, isArchived: req.body.isArchived });
        if (!updated)
            return res.status(404).json({ success: false, message: 'Post not found' });
        res.json({ success: true, data: updated });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update post' });
    }
});
// Delete a post
router.delete('/:postId', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const ok = await post_service_1.PostService.deletePost(req.params.postId, userId);
        if (!ok)
            return res.status(404).json({ success: false, message: 'Post not found' });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete post' });
    }
});
exports.default = router;
//# sourceMappingURL=posts.routes.js.map