import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { SubscriptionService } from "../services/subscription.service";
import { handleServiceError } from "../utils/error";
import { prisma } from "../lib/prisma";

const router = Router();

// Get subscription plans
router.get("/plans", async (_req, res) => {
  try {
    const plans = SubscriptionService.getPlans();
    res.json({
      success: true,
      data: { plans },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get user's current subscription
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const subscription = await SubscriptionService.getUserSubscription(userId);
    const usage = await SubscriptionService.getUsage(userId);

    res.json({
      success: true,
      data: {
        subscription,
        usage,
      },
    });
  } catch (error: any) {
    const serviceError = handleServiceError(error);
    res.status(serviceError.statusCode || 500).json({
      success: false,
      error: serviceError.message,
    });
  }
});

// Subscribe to plan
router.post("/subscribe", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const { planId, paymentMethodId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: "Plan ID is required",
      });
    }

    const result = await SubscriptionService.createSubscription(
      userId,
      planId,
      paymentMethodId
    );

    if (result.success) {
      res.json({
        success: true,
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || "Subscription creation failed",
      });
    }
  } catch (error: any) {
    const serviceError = handleServiceError(error);
    res.status(serviceError.statusCode || 500).json({
      success: false,
      error: serviceError.message,
    });
  }
});

// Cancel subscription
router.post("/cancel", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const result = await SubscriptionService.cancelSubscription(userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const serviceError = handleServiceError(error);
    res.status(serviceError.statusCode || 500).json({
      success: false,
      error: serviceError.message,
    });
  }
});

// Update subscription (change plan)
router.put("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const { planId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: "Plan ID is required",
      });
    }

    // Cancel current subscription
    await SubscriptionService.cancelSubscription(userId);

    // Create new subscription
    const result = await SubscriptionService.createSubscription(userId, planId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const serviceError = handleServiceError(error);
    res.status(serviceError.statusCode || 500).json({
      success: false,
      error: serviceError.message,
    });
  }
});

// Get billing history
router.get("/billing", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const billingHistory = await prisma.invoice.findMany({
      where: { userId },
      include: {
        charges: true,
        subscription: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: {
        billingHistory: billingHistory.map((invoice) => ({
          id: invoice.id,
          stripeInvoiceId: invoice.stripeInvoiceId,
          amountPaid: invoice.amountPaid,
          currency: invoice.currency,
          status: invoice.status,
          invoicePdf: invoice.invoicePdf,
          hostedInvoiceUrl: invoice.hostedInvoiceUrl,
          createdAt: invoice.createdAt,
          subscription: invoice.subscription
            ? {
                type: invoice.subscription.type,
                isActive: invoice.subscription.isActive,
              }
            : null,
          charges: invoice.charges.map((charge) => ({
            id: charge.id,
            stripeChargeId: charge.stripeChargeId,
            amount: charge.amount,
            currency: charge.currency,
            status: charge.status,
            paymentMethod: charge.paymentMethod,
            createdAt: charge.createdAt,
          })),
        })),
      },
    });
  } catch (error: any) {
    const serviceError = handleServiceError(error);
    res.status(serviceError.statusCode || 500).json({
      success: false,
      error: serviceError.message,
    });
  }
});

// Get subscription usage
router.get("/usage", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const usage = await SubscriptionService.getUsage(userId);

    res.json({
      success: true,
      data: { usage },
    });
  } catch (error: any) {
    const serviceError = handleServiceError(error);
    res.status(serviceError.statusCode || 500).json({
      success: false,
      error: serviceError.message,
    });
  }
});

// Use a boost
router.post("/boost", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const boost = await SubscriptionService.useBoost(userId);

    res.json({
      success: true,
      data: {
        boost: {
          id: boost.id,
          type: boost.type,
          startAt: boost.startAt,
          endAt: boost.endAt,
          status: boost.status,
        },
      },
    });
  } catch (error: any) {
    const serviceError = handleServiceError(error);
    res.status(serviceError.statusCode || 500).json({
      success: false,
      error: serviceError.message,
    });
  }
});

// Check feature access
router.get("/features/:feature", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const { feature } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const hasFeature = await SubscriptionService.hasFeature(userId, feature);

    res.json({
      success: true,
      data: {
        feature,
        hasAccess: hasFeature,
      },
    });
  } catch (error: any) {
    const serviceError = handleServiceError(error);
    res.status(serviceError.statusCode || 500).json({
      success: false,
      error: serviceError.message,
    });
  }
});

export default router;
