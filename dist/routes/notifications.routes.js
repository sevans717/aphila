"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const notification_service_1 = require("../services/notification.service");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// Validation schemas
const listNotificationsSchema = zod_1.z.object({
    limit: zod_1.z.string().transform(Number).optional(),
    cursor: zod_1.z.string().optional(),
});
const markReadSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.string()),
});
// GET / - Get user's notifications
router.get("/", auth_1.requireAuth, (0, validate_1.validateRequest)({ query: listNotificationsSchema }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit, cursor } = req.query;
        const result = await notification_service_1.NotificationService.list(userId, { limit, cursor });
        res.json({
            success: true,
            data: result.items,
            pagination: {
                hasMore: !!result.nextCursor,
                nextCursor: result.nextCursor,
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
// PUT /read - Mark notifications as read
router.put("/read", auth_1.requireAuth, (0, validate_1.validateRequest)({ body: markReadSchema }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { ids } = req.body;
        await notification_service_1.NotificationService.markRead(userId, ids);
        res.json({
            success: true,
            message: "Notifications marked as read",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// PUT /read-all - Mark all notifications as read
router.put("/read-all", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        await notification_service_1.NotificationService.markAllRead(userId);
        res.json({
            success: true,
            message: "All notifications marked as read",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// GET /unread-count - Get unread notification count
router.get("/unread-count", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        // Get total count and unread count
        const [total, unread] = await Promise.all([
            prisma_1.prisma.notification.count({ where: { userId } }),
            prisma_1.prisma.notification.count({ where: { userId, isRead: false } }),
        ]);
        res.json({
            success: true,
            data: { total, unread },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.routes.js.map