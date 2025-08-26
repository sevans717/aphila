"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const moderation_service_1 = require("../services/moderation.service");
const router = (0, express_1.Router)();
// Admin middleware (simplified - in production, use proper role checking)
const requireAdmin = (req, res, next) => {
    // Check if user is admin (you'd implement proper admin role checking)
    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            error: 'Admin access required',
        });
    }
    next();
};
// Validation schemas
const reportSchema = zod_1.z.object({
    reportedId: zod_1.z.string(),
    type: zod_1.z.enum(['profile', 'message', 'photo', 'behavior']),
    reason: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    contentId: zod_1.z.string().optional(),
});
const reportsQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(['pending', 'reviewed', 'resolved']).optional(),
    type: zod_1.z.enum(['profile', 'message', 'photo', 'behavior']).optional(),
    limit: zod_1.z.string().transform(Number).optional(),
    page: zod_1.z.string().transform(Number).optional(),
});
const updateReportSchema = zod_1.z.object({
    status: zod_1.z.enum(['reviewed', 'resolved']),
    action: zod_1.z.enum(['warn', 'suspend', 'ban', 'dismiss']).optional(),
    adminNotes: zod_1.z.string().optional(),
});
const reportParamsSchema = zod_1.z.object({
    reportId: zod_1.z.string(),
});
const userParamsSchema = zod_1.z.object({
    userId: zod_1.z.string(),
});
// POST /report - Create a report
router.post('/report', auth_1.requireAuth, (0, validation_1.validateBody)(reportSchema), async (req, res) => {
    try {
        const reporterId = req.user.id;
        const reportData = {
            reporterId,
            ...req.body,
        };
        const report = await moderation_service_1.ModerationService.createReport(reportData);
        res.status(201).json({
            success: true,
            data: report,
            message: 'Report submitted successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// GET /reports - Get reports (admin only)
router.get('/reports', auth_1.requireAuth, requireAdmin, (0, validation_1.validateQuery)(reportsQuerySchema), async (req, res) => {
    try {
        const filters = req.query;
        const result = await moderation_service_1.ModerationService.getReports(filters);
        res.json({
            success: true,
            data: result.reports,
            pagination: result.pagination,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// PUT /reports/:reportId - Update report status (admin only)
router.put('/reports/:reportId', auth_1.requireAuth, requireAdmin, (0, validation_1.validateParams)(reportParamsSchema), (0, validation_1.validateBody)(updateReportSchema), async (req, res) => {
    try {
        const { reportId } = req.params;
        const { status, action, adminNotes } = req.body;
        await moderation_service_1.ModerationService.updateReportStatus(reportId, status, action, adminNotes);
        res.json({
            success: true,
            message: 'Report updated successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// GET /user/:userId/history - Get user moderation history (admin only)
router.get('/user/:userId/history', auth_1.requireAuth, requireAdmin, (0, validation_1.validateParams)(userParamsSchema), async (req, res) => {
    try {
        const { userId } = req.params;
        const history = await moderation_service_1.ModerationService.getUserModerationHistory(userId);
        res.json({
            success: true,
            data: history,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// GET /user/:userId/suspended - Check if user is suspended
router.get('/user/:userId/suspended', auth_1.requireAuth, requireAdmin, (0, validation_1.validateParams)(userParamsSchema), async (req, res) => {
    try {
        const { userId } = req.params;
        const isSuspended = await moderation_service_1.ModerationService.isUserSuspended(userId);
        res.json({
            success: true,
            data: { isSuspended },
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
//# sourceMappingURL=moderation.routes.js.map