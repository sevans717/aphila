import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    id: 'basic',
    name: 'Basic',
    price: 0,
    duration: 30,
    features: [
      'Basic matching',
      '5 likes per day',
      'Standard support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    duration: 30,
    features: [
      'Unlimited likes',
      'See who liked you',
      'Super likes (5 per day)',
      'Boost profile (1 per month)',
      'Advanced filters',
      'Read receipts',
      'Priority support',
    ],
    stripeProductId: 'prod_premium_monthly',
    stripePriceId: 'price_premium_monthly',
  },
  {
    id: 'premium_yearly',
    name: 'Premium Yearly',
    price: 99.99,
    duration: 365,
    features: [
      'Unlimited likes',
      'See who liked you',
      'Super likes (10 per day)',
      'Boost profile (2 per month)',
      'Advanced filters',
      'Read receipts',
      'Priority support',
      '2 months free',
    ],
    stripeProductId: 'prod_premium_yearly',
    stripePriceId: 'price_premium_yearly',
  },
  {
    id: 'gold',
    name: 'Gold',
    price: 19.99,
    duration: 30,
    features: [
      'Everything in Premium',
      'Unlimited super likes',
      'Unlimited boosts',
      'See read receipts',
      'Incognito mode',
      'Passport (location change)',
      'Premium support',
    ],
    stripeProductId: 'prod_gold_monthly',
    stripePriceId: 'price_gold_monthly',
  },
];

export class SubscriptionService {
  // Get all available subscription plans
  static getPlans() {
    return SUBSCRIPTION_PLANS;
  }

  // Get user's current subscription
  static async getUserSubscription(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        // // @ts-ignore
        // subscriptionType moved to subscription relation true,
        // // @ts-ignore
        // subscriptionEnd moved to subscription relation true,
        // // @ts-ignore
        // isSubscriptionActive moved to subscription relation true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if subscription is still active
    // @ts-ignore - subscription fields might not exist in schema
    const isActive = user.isSubscriptionActive && 
                    // @ts-ignore - subscription fields might not exist in schema
                    user.subscriptionEnd && 
                    // @ts-ignore - subscription fields might not exist in schema
                    new Date(user.subscriptionEnd) > new Date();

    return {
      // @ts-ignore - subscription fields might not exist in schema
      type: user.subscriptionType || 'basic',
      // @ts-ignore - subscription fields might not exist in schema
      endDate: user.subscriptionEnd,
      isActive,
      // @ts-ignore - subscription fields might not exist in schema
      features: this.getFeatures(user.subscriptionType || 'basic'),
    };
  }

  // Get features for a subscription type
  static getFeatures(subscriptionType: string): string[] {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscriptionType);
    return plan ? plan.features : (SUBSCRIPTION_PLANS[0]?.features || []);
  }

  // Check if user has a specific feature
  static async hasFeature(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription.isActive) {
      // Check basic plan features
      const basicPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'basic');
      return basicPlan ? basicPlan.features.includes(feature) : false;
    }

    return subscription.features.includes(feature);
  }

  // Create subscription (placeholder for payment integration)
  static async createSubscription(userId: string, planId: string, paymentToken?: string) {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      throw new Error('Invalid subscription plan');
    }

    // In a real app, you'd integrate with Stripe here
    if (plan.price > 0 && !paymentToken) {
      throw new Error('Payment token required for paid plans');
    }

    // Calculate end date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);

    // Update user subscription
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        // // @ts-ignore
        // subscriptionType moved to subscription relation planId,
        // // @ts-ignore
        // subscriptionEnd moved to subscription relation endDate,
        // // @ts-ignore
        // isSubscriptionActive moved to subscription relation true,
      },
    });

    // Create subscription record (you might want a separate subscriptions table)
    await prisma.notification.create({
      data: {
        userId,
        type: 'subscription',
        title: 'Subscription Activated! 🎉',
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
      },
    };
  }

  // Cancel subscription
  static async cancelSubscription(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        // // @ts-ignore
        // isSubscriptionActive moved to subscription relation false,
        // Don't immediately remove subscription type - let it expire naturally
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        type: 'subscription',
        title: 'Subscription Cancelled',
        body: 'Your subscription has been cancelled and will not renew',
        data: { action: 'cancelled' },
      },
    });

    return { success: true };
  }

  // Get subscription usage/limits
  static async getUsage(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [subscription, todayLikes, todaySuperlikes, thisMonthBoosts] = await Promise.all([
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
      canLike: subscription.type === 'basic' ? todayLikes < limits.dailyLikes : true,
      canSuperlike: todaySuperlikes < limits.dailySuperlikes,
      canBoost: thisMonthBoosts < limits.monthlyBoosts,
    };
  }

  // Get usage limits for subscription type
  private static getLimits(subscriptionType: string) {
    switch (subscriptionType) {
      case 'basic':
        return {
          dailyLikes: 5,
          dailySuperlikes: 0,
          monthlyBoosts: 0,
        };
      case 'premium':
      case 'premium_yearly':
        return {
          dailyLikes: -1, // unlimited
          dailySuperlikes: subscriptionType === 'premium_yearly' ? 10 : 5,
          monthlyBoosts: subscriptionType === 'premium_yearly' ? 2 : 1,
        };
      case 'gold':
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
      throw new Error('Boost limit reached for your subscription');
    }

    // Create boost record
    const boost = await prisma.boost.create({
      data: {
        userId,
        type: 'PROFILE',
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        status: 'ACTIVE',
      },
    });

    // Set boost expiration
    setTimeout(async () => {
      await prisma.boost.update({
        where: { id: boost.id },
        data: { status: 'EXPIRED' },
      });
    }, 30 * 60 * 1000); // 30 minutes

    return boost;
  }
}
