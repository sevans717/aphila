"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const social_service_1 = require("../services/social.service");
const router = (0, express_1.Router)();
// Comments
router.post('/posts/:postId/comments', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const comment = await social_service_1.SocialService.createComment(userId, { postId: req.params.postId, content: req.body.content, parentId: req.body.parentCommentId });
        res.status(201).json({ success: true, data: comment });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to create comment' });
    }
});
router.get('/posts/:postId/comments', auth_1.auth, async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
        const comments = await social_service_1.SocialService.getPostComments(req.params.postId, req.user.userId, limit);
        res.json({ success: true, data: { comments } });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch comments' });
    }
});
router.get('/comments/:commentId/replies', auth_1.auth, async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
        const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
        const result = await social_service_1.SocialService.getCommentReplies(req.params.commentId, limit, offset);
        res.json({ success: true, data: result });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch replies' });
    }
});
// Likes
router.post('/posts/:postId/likes/toggle', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await social_service_1.SocialService.togglePostLike(req.params.postId, userId, req.body.type);
        res.json({ success: true, data: result });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to toggle like' });
    }
});
router.post('/comments/:commentId/likes/toggle', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await social_service_1.SocialService.toggleCommentLike(req.params.commentId, userId);
        res.json({ success: true, data: result });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to toggle like' });
    }
});
exports.default = router;
//# sourceMappingURL=social.routes.js.map