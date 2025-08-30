interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    duration: number;
    features: string[];
    stripeProductId?: string;
    stripePriceId?: string;
}
export declare const SUBSCRIPTION_PLANS: SubscriptionPlan[];
export declare class SubscriptionService {
    static getPlans(): SubscriptionPlan[];
    static getUserSubscription(userId: string): Promise<{
        type: string;
        endDate: Date | null | undefined;
        isActive: boolean;
        features: string[];
    }>;
    private static mapSubscriptionEnumToPlanId;
    private static mapPlanIdToSubscriptionEnum;
    static getFeatures(subscriptionType: string): string[];
    static hasFeature(userId: string, feature: string): Promise<boolean>;
    static createSubscription(userId: string, planId: string, paymentToken?: string): Promise<any>;
    static cancelSubscription(userId: string): Promise<{
        success: boolean;
    }>;
    static getUsage(userId: string): Promise<{
        subscription: {
            type: string;
            endDate: Date | null | undefined;
            isActive: boolean;
            features: string[];
        };
        usage: {
            likesToday: number;
            superlikesToday: number;
            boostsThisMonth: number;
        };
        limits: {
            dailyLikes: number;
            dailySuperlikes: number;
            monthlyBoosts: number;
        };
        canLike: boolean;
        canSuperlike: boolean;
        canBoost: boolean;
    }>;
    private static getLimits;
    static useBoost(userId: string): Promise<{
        id: string;
        userId: string;
        type: import("@prisma/client").$Enums.BoostType;
        createdAt: Date;
        status: import("@prisma/client").$Enums.BoostStatus;
        categoryId: string | null;
        communityId: string | null;
        startAt: Date;
        endAt: Date;
        priority: number;
    }>;
}
export {};
//# sourceMappingURL=subscription.service.d.ts.map