"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const subscription_service_1 = require("../services/subscription.service");
const router = (0, express_1.Router)();
// Validation schemas
const subscribeSchema = zod_1.z.object({
    planId: zod_1.z.string(),
    paymentToken: zod_1.z.string().optional(),
});
// GET /plans - Get all subscription plans
router.get('/plans', async (req, res) => {
    try {
        const plans = subscription_service_1.SubscriptionService.getPlans();
        // If client requests flat shape (?flat=1), return array directly for compatibility with some clients/tests
        if (req.query.flat === '1' || req.query.flat === 'true') {
            return res.json(plans);
        }
        res.json({ success: true, data: plans });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// GET /current - Get user's current subscription
router.get('/current', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const subscription = await subscription_service_1.SubscriptionService.getUserSubscription(userId);
        res.json({
            success: true,
            data: subscription,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// POST /subscribe - Subscribe to a plan
router.post('/subscribe', auth_1.requireAuth, (0, validation_1.validateBody)(subscribeSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { planId, paymentToken } = req.body;
        const result = await subscription_service_1.SubscriptionService.createSubscription(userId, planId, paymentToken);
        res.status(201).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// POST /cancel - Cancel subscription
router.post('/cancel', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await subscription_service_1.SubscriptionService.cancelSubscription(userId);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// GET /usage - Get subscription usage and limits
router.get('/usage', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const usage = await subscription_service_1.SubscriptionService.getUsage(userId);
        res.json({
            success: true,
            data: usage,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// POST /boost - Use a boost
router.post('/boost', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const boost = await subscription_service_1.SubscriptionService.useBoost(userId);
        res.status(201).json({
            success: true,
            data: boost,
            message: 'Boost activated! Your profile will be shown to more people for the next 30 minutes.',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=subscription.routes.js.map