"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = exports.SUBSCRIPTION_PLANS = void 0;
// avoid importing generated enum types directly; use strings for type-safety compatibility
const prisma_1 = require("../lib/prisma");
const env_1 = require("../config/env");
const uuid_1 = require("uuid");
const error_1 = require("../utils/error");
// Subscription plans configuration
exports.SUBSCRIPTION_PLANS = [
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
class SubscriptionService {
    // Get all available subscription plans
    static getPlans() {
        return exports.SUBSCRIPTION_PLANS;
    }
    // Get user's current subscription
    static async getUserSubscription(userId) {
        const user = await prisma_1.prisma.user.findUnique({
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
        const planId = this.mapSubscriptionEnumToPlanId(subscription?.type);
        const isActive = !!(subscription &&
            subscription.isActive &&
            subscription.endDate &&
            new Date(subscription.endDate) > new Date());
        return {
            type: planId,
            endDate: subscription?.endDate,
            isActive,
            features: this.getFeatures(planId),
        };
    }
    // Map Prisma SubscriptionType enum value to our local plan id strings
    static mapSubscriptionEnumToPlanId(enumVal) {
        if (!enumVal)
            return "basic";
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
    static mapPlanIdToSubscriptionEnum(planId) {
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
    static getFeatures(subscriptionType) {
        const plan = exports.SUBSCRIPTION_PLANS.find((p) => p.id === subscriptionType);
        return plan ? plan.features : exports.SUBSCRIPTION_PLANS[0]?.features || [];
    }
    // Check if user has a specific feature
    static async hasFeature(userId, feature) {
        const subscription = await this.getUserSubscription(userId);
        if (!subscription.isActive) {
            // Check basic plan features
            const basicPlan = exports.SUBSCRIPTION_PLANS.find((p) => p.id === "basic");
            return basicPlan ? basicPlan.features.includes(feature) : false;
        }
        return subscription.features.includes(feature);
    }
    // Create subscription (placeholder for payment integration)
    static async createSubscription(userId, planId, paymentToken) {
        const plan = exports.SUBSCRIPTION_PLANS.find((p) => p.id === planId);
        if (!plan) {
            const err = new Error("Invalid subscription plan");
            return (0, error_1.handleServiceError)(err);
        }
        // In a real app, you'd integrate with Stripe here
        if (plan.price > 0 && !paymentToken) {
            // Allow bypassing real payments in dev environments when explicitly configured
            if (!env_1.env.disablePayments) {
                const err = new Error("Payment token required for paid plans");
                return (0, error_1.handleServiceError)(err);
            }
        }
        // Calculate end date
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.duration);
        // Update user subscription
        // Upsert subscription record for the user
        const planEnum = this.mapPlanIdToSubscriptionEnum(planId);
        await prisma_1.prisma.subscription.upsert({
            where: { userId },
            update: {
                type: planEnum,
                isActive: true,
                startDate: new Date(),
                endDate,
            },
            create: {
                userId,
                type: planEnum,
                isActive: true,
                startDate: new Date(),
                endDate,
            },
        });
        // Create subscription record (you might want a separate subscriptions table)
        const notificationData = {
            userId,
            type: "subscription",
            title: "Subscription Activated! 🎉",
            body: `Your ${plan.name} subscription is now active`,
            data: { planId, endDate: endDate.toISOString() },
        };
        // If payments are disabled for dev, add a mock receipt payload
        if (env_1.env.disablePayments) {
            notificationData.data.mockPayment = true;
            notificationData.data.payment = {
                id: `mock_${(0, uuid_1.v4)()}`,
                amount: plan.price,
                currency: "USD",
                status: "succeeded",
                createdAt: new Date().toISOString(),
            };
        }
        await prisma_1.prisma.notification.create({ data: notificationData });
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
    static async cancelSubscription(userId) {
        // Mark subscription as inactive and disable autoRenew
        await prisma_1.prisma.subscription.updateMany({
            where: { userId },
            data: { isActive: false, autoRenew: false },
        });
        await prisma_1.prisma.notification.create({
            data: {
                userId,
                type: "subscription",
                title: "Subscription Cancelled",
                body: "Your subscription has been cancelled and will not renew",
                data: { action: "cancelled" },
            },
        });
        return { success: true };
    }
    // Get subscription usage/limits
    static async getUsage(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [subscription, todayLikes, todaySuperlikes, thisMonthBoosts] = await Promise.all([
            this.getUserSubscription(userId),
            prisma_1.prisma.like.count({
                where: {
                    likerId: userId,
                    createdAt: { gte: today, lt: tomorrow },
                },
            }),
            prisma_1.prisma.like.count({
                where: {
                    likerId: userId,
                    isSuper: true,
                    createdAt: { gte: today, lt: tomorrow },
                },
            }),
            prisma_1.prisma.boost.count({
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
            canLike: subscription.type === "basic" ? todayLikes < limits.dailyLikes : true,
            canSuperlike: todaySuperlikes < limits.dailySuperlikes,
            canBoost: thisMonthBoosts < limits.monthlyBoosts,
        };
    }
    // Get usage limits for subscription type
    static getLimits(subscriptionType) {
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
    static async useBoost(userId) {
        const usage = await this.getUsage(userId);
        if (!usage.canBoost) {
            const err = new Error("Boost limit reached for your subscription");
            if (env_1.env.nodeEnv === "production")
                throw err;
            return Promise.reject(err);
        }
        // Create boost record
        const boost = await prisma_1.prisma.boost.create({
            data: {
                userId,
                type: "PROFILE",
                startAt: new Date(),
                endAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
                status: "ACTIVE",
            },
        });
        // Set boost expiration
        setTimeout(async () => {
            await prisma_1.prisma.boost.update({
                where: { id: boost.id },
                data: { status: "EXPIRED" },
            });
        }, 30 * 60 * 1000); // 30 minutes
        return boost;
    }
}
exports.SubscriptionService = SubscriptionService;
//# sourceMappingURL=subscription.service.js.map