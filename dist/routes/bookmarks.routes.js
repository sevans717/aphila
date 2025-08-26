"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const bookmark_service_1 = require("../services/bookmark.service");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Validation schemas
const createCollectionValidation = {
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100),
        description: zod_1.z.string().optional(),
        isPublic: zod_1.z.boolean().default(false),
    }),
};
// Collection routes
router.post("/collections", auth_1.auth, (0, validate_1.validateRequest)(createCollectionValidation), async (req, res) => {
    try {
        const userId = req.user.userId;
        const collection = await bookmark_service_1.BookmarkService.createCollection({
            userId,
            name: req.body.name,
            description: req.body.description,
            isPublic: req.body.isPublic,
        });
        res.status(201).json({ success: true, data: collection });
    }
    catch (error) {
        logger_1.logger.error("Error creating collection:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to create collection" });
    }
});
router.get("/collections", auth_1.auth, async (req, res) => {
    try {
        const collections = await bookmark_service_1.BookmarkService.getUserCollections(req.user.userId);
        res.json({ success: true, data: collections });
    }
    catch (error) {
        logger_1.logger.error("Error fetching collections:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to fetch collections" });
    }
});
// Bookmark routes
router.post("/posts/:postId/toggle", auth_1.auth, (0, validate_1.validateRequest)({
    params: zod_1.z.object({ postId: zod_1.z.string().min(1) }),
    body: zod_1.z.object({ collectionId: zod_1.z.string().optional() }),
}), async (req, res) => {
    try {
        const result = await bookmark_service_1.BookmarkService.togglePostBookmark(req.user.userId, req.params.postId, req.body.collectionId || null);
        res.json({ success: true, data: result });
    }
    catch (error) {
        logger_1.logger.error("Error toggling post bookmark:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to toggle bookmark" });
    }
});
router.post("/media/:mediaId/toggle", auth_1.auth, (0, validate_1.validateRequest)({ params: zod_1.z.object({ mediaId: zod_1.z.string().min(1) }) }), async (req, res) => {
    try {
        const result = await bookmark_service_1.BookmarkService.toggleMediaBookmark(req.user.userId, req.params.mediaId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        logger_1.logger.error("Error toggling media bookmark:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to toggle bookmark" });
    }
});
router.get("/stats", auth_1.auth, async (req, res) => {
    try {
        const stats = await bookmark_service_1.BookmarkService.getBookmarkStats(req.user.userId);
        res.json({ success: true, data: stats });
    }
    catch (error) {
        logger_1.logger.error("Error fetching bookmark stats:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to fetch bookmark stats" });
    }
});
exports.default = router;
//# sourceMappingURL=bookmarks.routes.js.map