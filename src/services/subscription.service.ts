// avoid importing generated enum types directly; use strings for type-safety compatibility
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { handleServiceError } from "../utils/error";
import {
  createStripeCheckoutSession,
  createOrRetrieveCustomer,
  createSubscription,
  cancelSubscription,
  updateSubscription,
} from "./stripe.service";

// using shared singleton `prisma` from src/lib/prisma

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: number; // in days
  features: string[];
  stripeProductId?: string;
  stripePriceId?: string;
}

// Subscription plans configuration
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 0,
    duration: 30,
    features: ["Basic matching", "5 likes per day", "Standard support"],
  },
  {
    id: "premium",
    name: "Premium",
    price: 9.99,
    duration: 30,
    features: [
      "Unlimited likes",
      "See who liked you",
      "Super likes (5 per day)",
      "Boost profile (1 per month)",
      "Advanced filters",
      "Read receipts",
      "Priority support",
    ],
    stripeProductId: "prod_premium_monthly",
    stripePriceId: "price_premium_monthly",
  },
  {
    id: "premium_yearly",
    name: "Premium Yearly",
    price: 99.99,
    duration: 365,
    features: [
      "Unlimited likes",
      "See who liked you",
      "Super likes (10 per day)",
      "Boost profile (2 per month)",
      "Advanced filters",
      "Read receipts",
      "Priority support",
      "2 months free",
    ],
    stripeProductId: "prod_premium_yearly",
    stripePriceId: "price_premium_yearly",
  },
  {
    id: "gold",
    name: "Gold",
    price: 19.99,
    duration: 30,
    features: [
      "Everything in Premium",
      "Unlimited super likes",
      "Unlimited boosts",
      "See read receipts",
      "Incognito mode",
      "Passport (location change)",
      "Premium support",
    ],
    stripeProductId: "prod_gold_monthly",
    stripePriceId: "price_gold_monthly",
  },
];

export class SubscriptionService {
  // Get all available subscription plans
  static getPlans() {
    console.log(`Getting subscription plans for environment: ${env.nodeEnv}`);
    return SUBSCRIPTION_PLANS;
  }

  // Get user's current subscription
  static async getUserSubscription(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    // If user is not found, return the default basic plan (graceful fallback)
    if (!user) {
      return {
        type: "basic",
        endDate: null,
        isActive: false,
        features: this.getFeatures("basic"),
      };
    }

    const subscription = user.subscription;

    const planId = this.mapSubscriptionEnumToPlanId(
      subscription?.type as unknown as string
    );

    const isActive = !!(
      subscription &&
      subscription.isActive &&
      subscription.endDate &&
      new Date(subscription.endDate) > new Date()
    );

    return {
      type: planId,
      endDate: subscription?.endDate,
      isActive,
      features: this.getFeatures(planId),
    };
  }

  // Map Prisma SubscriptionType enum value to our local plan id strings
  private static mapSubscriptionEnumToPlanId(enumVal?: string) {
    if (!enumVal) return "basic";
    switch (enumVal.toUpperCase()) {
      case "FREE":
        return "basic";
      case "PREMIUM":
        return "premium";
      case "PLUS":
        return "gold";
      default:
        return "basic";
    }
  }

  private static mapPlanIdToSubscriptionEnum(planId: string): string {
    switch (planId) {
      case "premium":
      case "premium_yearly":
        return "PREMIUM";
      case "gold":
      case "plus":
        return "PLUS";
      default:
        return "FREE";
    }
  }

  // Get features for a subscription type
  static getFeatures(subscriptionType: string): string[] {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === subscriptionType);
    return plan ? plan.features : SUBSCRIPTION_PLANS[0]?.features || [];
  }

  // Check if user has a specific feature
  static async hasFeature(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription.isActive) {
      // Check basic plan features
      const basicPlan = SUBSCRIPTION_PLANS.find((p) => p.id === "basic");
      return basicPlan ? basicPlan.features.includes(feature) : false;
    }

    return subscription.features.includes(feature);
  }

  // Create subscription (placeholder for payment integration)
  static async createSubscription(
    userId: string,
    planId: string,
    paymentMethodId?: string
  ) {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) {
      const err = new Error("Invalid subscription plan");
      return handleServiceError(err);
    }

    try {
      // Get user details
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error("User not found");
      }

      // Calculate end date
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);

      // For free plans, create immediately
      if (plan.price === 0) {
        // Update user subscription
        const planEnum = this.mapPlanIdToSubscriptionEnum(planId);
        await prisma.subscription.upsert({
          where: { userId },
          update: {
            type: planEnum as any,
            isActive: true,
            startDate: new Date(),
            endDate,
          },
          create: {
            userId,
            type: planEnum as any,
            isActive: true,
            startDate: new Date(),
            endDate,
          },
        });

        // Create notification
        await prisma.notification.create({
          data: {
            userId,
            type: "subscription",
            title: "Subscription Activated! 🎉",
            body: `Your ${plan.name} subscription is now active`,
            data: { planId, endDate: endDate.toISOString() },
          },
        });

        return {
          success: true,
          subscription: {
            type: planId,
            endDate,
            features: plan.features,
            note: "Free plan activated",
          },
        };
      }

      // For paid plans, use Stripe
      if (plan.stripePriceId) {
        // Create or retrieve Stripe customer
        const customer = await createOrRetrieveCustomer(
          user.email,
          user.email // Using email as name for now
        );

        // Create Stripe subscription
        const stripeSubscription = await createSubscription(
          customer.id,
          plan.stripePriceId,
          paymentMethodId
        );

        // Update local subscription record
        const planEnum = this.mapPlanIdToSubscriptionEnum(planId);
        await prisma.subscription.upsert({
          where: { userId },
          update: {
            type: planEnum as any,
            isActive: true,
            startDate: new Date(),
            endDate,
            stripeCustomerId: customer.id,
            stripeSubscriptionId: stripeSubscription.id,
            stripePriceId: plan.stripePriceId,
          },
          create: {
            userId,
            type: planEnum as any,
            isActive: true,
            startDate: new Date(),
            endDate,
            stripeCustomerId: customer.id,
            stripeSubscriptionId: stripeSubscription.id,
            stripePriceId: plan.stripePriceId,
          },
        });

        // Create notification
        await prisma.notification.create({
          data: {
            userId,
            type: "subscription",
            title: "Subscription Processing",
            body: `Your ${plan.name} subscription is being processed`,
            data: { planId, stripeSubscriptionId: stripeSubscription.id },
          },
        });

        return {
          success: true,
          subscription: {
            type: planId,
            endDate,
            features: plan.features,
            stripeSubscriptionId: stripeSubscription.id,
            note: "Subscription created, awaiting payment confirmation",
          },
        };
      }

      // Fallback for plans without Stripe configuration
      throw new Error("Payment configuration not available for this plan");
    } catch (error: any) {
      return handleServiceError(error);
    }
  }

  // Cancel subscription
  static async cancelSubscription(userId: string) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription) {
        throw new Error("No subscription found");
      }

      // If there's a Stripe subscription, cancel it there too
      if (subscription.stripeSubscriptionId) {
        await cancelSubscription(subscription.stripeSubscriptionId);
      }

      // Mark local subscription as inactive
      await prisma.subscription.update({
        where: { userId },
        data: {
          isActive: false,
          autoRenew: false,
          endDate: subscription.endDate, // Keep current end date
        },
      });

      await prisma.notification.create({
        data: {
          userId,
          type: "subscription",
          title: "Subscription Cancelled",
          body: "Your subscription has been cancelled and will not renew",
          data: { action: "cancelled" },
        },
      });

      return { success: true };
    } catch (error: any) {
      return handleServiceError(error);
    }
  }

  // Get subscription usage/limits
  static async getUsage(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [subscription, todayLikes, todaySuperlikes, thisMonthBoosts] =
      await Promise.all([
        this.getUserSubscription(userId),
        prisma.like.count({
          where: {
            likerId: userId,
            createdAt: { gte: today, lt: tomorrow },
          },
        }),
        prisma.like.count({
          where: {
            likerId: userId,
            isSuper: true,
            createdAt: { gte: today, lt: tomorrow },
          },
        }),
        prisma.boost.count({
          where: {
            userId,
            createdAt: {
              gte: new Date(today.getFullYear(), today.getMonth(), 1),
              lt: tomorrow,
            },
          },
        }),
      ]);

    // Set limits based on subscription
    const limits = this.getLimits(subscription.type);

    return {
      subscription,
      usage: {
        likesToday: todayLikes,
        superlikesToday: todaySuperlikes,
        boostsThisMonth: thisMonthBoosts,
      },
      limits,
      canLike:
        subscription.type === "basic" ? todayLikes < limits.dailyLikes : true,
      canSuperlike: todaySuperlikes < limits.dailySuperlikes,
      canBoost: thisMonthBoosts < limits.monthlyBoosts,
    };
  }

  // Get usage limits for subscription type
  private static getLimits(subscriptionType: string) {
    switch (subscriptionType) {
      case "basic":
        return {
          dailyLikes: 5,
          dailySuperlikes: 0,
          monthlyBoosts: 0,
        };
      case "premium":
      case "premium_yearly":
        return {
          dailyLikes: -1, // unlimited
          dailySuperlikes: subscriptionType === "premium_yearly" ? 10 : 5,
          monthlyBoosts: subscriptionType === "premium_yearly" ? 2 : 1,
        };
      case "gold":
        return {
          dailyLikes: -1, // unlimited
          dailySuperlikes: -1, // unlimited
          monthlyBoosts: -1, // unlimited
        };
      default:
        return {
          dailyLikes: 5,
          dailySuperlikes: 0,
          monthlyBoosts: 0,
        };
    }
  }

  // Use a boost
  static async useBoost(userId: string) {
    const usage = await this.getUsage(userId);

    if (!usage.canBoost) {
      const err = new Error("Boost limit reached for your subscription");
      return handleServiceError(err);
      return Promise.reject(err);
    }

    // Create boost record
    const boost = await prisma.boost.create({
      data: {
        userId,
        type: "PROFILE",
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        status: "ACTIVE",
      },
    });

    // Set boost expiration
    setTimeout(
      async () => {
        await prisma.boost.update({
          where: { id: boost.id },
          data: { status: "EXPIRED" },
        });
      },
      30 * 60 * 1000
    ); // 30 minutes

    return boost;
  }
}
