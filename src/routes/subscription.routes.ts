import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { SubscriptionService } from '../services/subscription.service';

const router = Router();

// Validation schemas
const subscribeSchema = z.object({
  planId: z.string(),
  paymentToken: z.string().optional(),
});

// GET /plans - Get all subscription plans
router.get('/plans', async (req: any, res: any) => {
  try {
    const plans = SubscriptionService.getPlans();
    // If client requests flat shape (?flat=1), return array directly for compatibility with some clients/tests
    if (req.query.flat === '1' || req.query.flat === 'true') {
      return res.json(plans);
    }

    res.json({ success: true, data: plans });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /current - Get user's current subscription
router.get(
  '/current',
  requireAuth,
  async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const subscription = await SubscriptionService.getUserSubscription(userId);

      res.json({
        success: true,
        data: subscription,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// POST /subscribe - Subscribe to a plan
router.post(
  '/subscribe',
  requireAuth,
  validateBody(subscribeSchema),
  async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const { planId, paymentToken } = req.body;

      const result = await SubscriptionService.createSubscription(
        userId,
        planId,
        paymentToken
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// POST /cancel - Cancel subscription
router.post(
  '/cancel',
  requireAuth,
  async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const result = await SubscriptionService.cancelSubscription(userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// GET /usage - Get subscription usage and limits
router.get(
  '/usage',
  requireAuth,
  async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const usage = await SubscriptionService.getUsage(userId);

      res.json({
        success: true,
        data: usage,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// POST /boost - Use a boost
router.post(
  '/boost',
  requireAuth,
  async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const boost = await SubscriptionService.useBoost(userId);

      res.status(201).json({
        success: true,
        data: boost,
        message: 'Boost activated! Your profile will be shown to more people for the next 30 minutes.',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

export default router;
