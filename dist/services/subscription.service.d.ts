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
        type: any;
        endDate: any;
        isActive: any;
        features: string[];
    }>;
    static getFeatures(subscriptionType: string): string[];
    static hasFeature(userId: string, feature: string): Promise<boolean>;
    static createSubscription(userId: string, planId: string, paymentToken?: string): Promise<{
        success: boolean;
        subscription: {
            type: string;
            endDate: Date;
            features: string[];
        };
    }>;
    static cancelSubscription(userId: string): Promise<{
        success: boolean;
    }>;
    static getUsage(userId: string): Promise<{
        subscription: {
            type: any;
            endDate: any;
            isActive: any;
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
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.BoostStatus;
        type: import(".prisma/client").$Enums.BoostType;
        categoryId: string | null;
        communityId: string | null;
        startAt: Date;
        endAt: Date;
        priority: number;
    }>;
}
export {};
//# sourceMappingURL=subscription.service.d.ts.map