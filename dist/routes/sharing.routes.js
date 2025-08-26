"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const sharing_service_1 = require("../services/sharing.service");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Validation schemas
const sharePostValidation = {
    body: zod_1.z.object({
        postId: zod_1.z.string(),
        platform: zod_1.z.string().optional(),
        comment: zod_1.z.string().optional()
    })
};
const shareMediaValidation = {
    body: zod_1.z.object({
        mediaId: zod_1.z.string(),
        platform: zod_1.z.string().optional(),
        comment: zod_1.z.string().optional()
    })
};
// Share a post
router.post('/post', auth_1.auth, (0, validate_1.validateRequest)(sharePostValidation), async (req, res) => {
    try {
        const { postId, platform, comment } = req.body;
        const userId = req.user.userId;
        const share = await sharing_service_1.SharingService.sharePost({
            userId,
            postId,
            platform,
            comment,
        });
        res.status(201).json({
            success: true,
            data: share
        });
    }
    catch (error) {
        logger_1.logger.error('Error sharing post:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to share post'
        });
    }
});
// Share media
router.post('/media', auth_1.auth, (0, validate_1.validateRequest)(shareMediaValidation), async (req, res) => {
    try {
        const { mediaId, platform, comment } = req.body;
        const userId = req.user.userId;
        const share = await sharing_service_1.SharingService.shareMedia({
            userId,
            mediaId,
            platform,
            comment,
        });
        res.status(201).json({
            success: true,
            data: share
        });
    }
    catch (error) {
        logger_1.logger.error('Error sharing media:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to share media'
        });
    }
});
// Get user's shares
router.get('/my-shares', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit = 20 } = req.query;
        const shares = await sharing_service_1.SharingService.getUserShares(userId, parseInt(limit));
        res.json({
            success: true,
            data: shares
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching user shares:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch shares'
        });
    }
});
// Delete share
router.delete('/:shareId', auth_1.auth, async (req, res) => {
    try {
        const { shareId } = req.params;
        const { type } = req.query; // 'post' | 'media'
        const userId = req.user.userId;
        await sharing_service_1.SharingService.deleteShare(shareId, userId, type);
        res.json({
            success: true,
            message: 'Share deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting share:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete share'
        });
    }
});
exports.default = router;
//# sourceMappingURL=sharing.routes.js.map