import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  SubscriptionPlan,
  SubscriptionStatus,
  PaymentMethod,
  PurchaseHistory,
  SubscriptionFeatures,
} from "../../types/subscription";

interface SubscriptionState {
  // Current subscription
  currentPlan: SubscriptionPlan | null;
  subscriptionStatus: SubscriptionStatus;
  expiryDate: Date | null;
  autoRenew: boolean;

  // Available plans
  availablePlans: SubscriptionPlan[];

  // Payment methods
  paymentMethods: PaymentMethod[];
  defaultPaymentMethod: string | null;

  // Purchase history
  purchaseHistory: PurchaseHistory[];

  // Features and usage
  subscriptionFeatures: SubscriptionFeatures | null;
  featureUsage: Record<
    string,
    {
      used: number;
      limit: number;
      resetDate?: Date;
    }
  >;

  // Billing
  nextBillingDate: Date | null;
  billingAmount: number;
  billingCurrency: string;
  billingCycle: "monthly" | "yearly";

  // UI state
  isLoadingPlans: boolean;
  isProcessingPayment: boolean;
  isUpdatingSubscription: boolean;
  showUpgradeModal: boolean;
  showCancelModal: boolean;
  selectedPlanId: string | null;

  // Notifications
  paymentFailures: number;
  lastPaymentFailure: Date | null;
  renewalReminders: boolean;
  billingAlerts: boolean;
}

interface SubscriptionActions {
  // Plan management
  loadAvailablePlans: () => Promise<void>;
  selectPlan: (planId: string) => void;
  upgradePlan: (planId: string, paymentMethodId?: string) => Promise<void>;
  downgradePlan: (planId: string) => Promise<void>;
  cancelSubscription: (reason?: string) => Promise<void>;
  reactivateSubscription: () => Promise<void>;

  // Payment methods
  loadPaymentMethods: () => Promise<void>;
  addPaymentMethod: (
    paymentMethod: Omit<PaymentMethod, "id">
  ) => Promise<string>;
  updatePaymentMethod: (
    methodId: string,
    updates: Partial<PaymentMethod>
  ) => Promise<void>;
  deletePaymentMethod: (methodId: string) => Promise<void>;
  setDefaultPaymentMethod: (methodId: string) => Promise<void>;

  // Subscription management
  loadSubscriptionDetails: () => Promise<void>;
  updateAutoRenew: (autoRenew: boolean) => Promise<void>;
  changeBillingCycle: (cycle: "monthly" | "yearly") => Promise<void>;
  pauseSubscription: (duration: number) => Promise<void>;
  resumeSubscription: () => Promise<void>;

  // Purchase and billing
  processPurchase: (
    planId: string,
    paymentMethodId: string,
    promotionCode?: string
  ) => Promise<string>;
  loadPurchaseHistory: () => Promise<void>;
  downloadInvoice: (invoiceId: string) => Promise<void>;
  retryFailedPayment: (paymentMethodId?: string) => Promise<void>;

  // Feature management
  loadSubscriptionFeatures: () => Promise<void>;
  checkFeatureAccess: (featureName: string) => boolean;
  updateFeatureUsage: (featureName: string, increment?: number) => void;
  resetFeatureUsage: (featureName: string) => void;

  // Promotions and discounts
  applyPromotionCode: (
    code: string
  ) => Promise<{ valid: boolean; discount?: number; message?: string }>;
  removePromotionCode: () => Promise<void>;
  loadAvailablePromotions: () => Promise<void>;

  // Analytics and tracking
  trackSubscriptionEvent: (
    eventType: string,
    metadata?: Record<string, any>
  ) => void;
  loadUsageAnalytics: (period: "week" | "month" | "year") => Promise<void>;

  // Notifications
  updateNotificationPreferences: (preferences: {
    renewalReminders: boolean;
    billingAlerts: boolean;
  }) => Promise<void>;
  markPaymentFailureHandled: () => void;

  // Modal state
  showUpgradeFlow: (planId?: string) => void;
  hideUpgradeFlow: () => void;
  showCancelFlow: () => void;
  hideCancelFlow: () => void;

  // Cleanup
  clearSubscriptionData: () => void;
}

type SubscriptionStore = SubscriptionState & SubscriptionActions;

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentPlan: null,
      subscriptionStatus: "inactive",
      expiryDate: null,
      autoRenew: true,
      availablePlans: [],
      paymentMethods: [],
      defaultPaymentMethod: null,
      purchaseHistory: [],
      subscriptionFeatures: null,
      featureUsage: {},
      nextBillingDate: null,
      billingAmount: 0,
      billingCurrency: "USD",
      billingCycle: "monthly",
      isLoadingPlans: false,
      isProcessingPayment: false,
      isUpdatingSubscription: false,
      showUpgradeModal: false,
      showCancelModal: false,
      selectedPlanId: null,
      paymentFailures: 0,
      lastPaymentFailure: null,
      renewalReminders: true,
      billingAlerts: true,

      // Actions
      loadAvailablePlans: async () => {
        set({ isLoadingPlans: true });
        try {
          // TODO: Implement API call
          // const plans = await SubscriptionService.getAvailablePlans();
          // set({ availablePlans: plans, isLoadingPlans: false });
          set({ isLoadingPlans: false });
        } catch (error) {
          console.error("Failed to load available plans:", error);
          set({ isLoadingPlans: false });
        }
      },

      selectPlan: (planId: string) => {
        set({ selectedPlanId: planId });
      },

      upgradePlan: async (planId: string, paymentMethodId?: string) => {
        set({ isUpdatingSubscription: true });
        try {
          // TODO: Implement API call
          // const subscription = await SubscriptionService.upgradePlan(planId, paymentMethodId);
          // set({ currentPlan: subscription.plan, subscriptionStatus: subscription.status });

          // Update feature usage limits
          get().loadSubscriptionFeatures();

          set({ isUpdatingSubscription: false });
        } catch (error) {
          console.error("Failed to upgrade plan:", error);
          set({ isUpdatingSubscription: false });
          throw error;
        }
      },

      downgradePlan: async (planId: string) => {
        set({ isUpdatingSubscription: true });
        try {
          // TODO: Implement API call
          // const subscription = await SubscriptionService.downgradePlan(planId);
          // set({ currentPlan: subscription.plan, subscriptionStatus: subscription.status });

          get().loadSubscriptionFeatures();

          set({ isUpdatingSubscription: false });
        } catch (error) {
          console.error("Failed to downgrade plan:", error);
          set({ isUpdatingSubscription: false });
          throw error;
        }
      },

      cancelSubscription: async (reason?: string) => {
        set({ isUpdatingSubscription: true });
        try {
          // TODO: Implement API call
          // await SubscriptionService.cancelSubscription(reason);
          set({
            subscriptionStatus: "cancelled",
            autoRenew: false,
            isUpdatingSubscription: false,
            showCancelModal: false,
          });
        } catch (error) {
          console.error("Failed to cancel subscription:", error);
          set({ isUpdatingSubscription: false });
          throw error;
        }
      },

      reactivateSubscription: async () => {
        set({ isUpdatingSubscription: true });
        try {
          // TODO: Implement API call
          // const subscription = await SubscriptionService.reactivateSubscription();
          set({
            subscriptionStatus: "active",
            autoRenew: true,
            isUpdatingSubscription: false,
          });
        } catch (error) {
          console.error("Failed to reactivate subscription:", error);
          set({ isUpdatingSubscription: false });
          throw error;
        }
      },

      loadPaymentMethods: async () => {
        try {
          // TODO: Implement API call
          // const methods = await SubscriptionService.getPaymentMethods();
          // set({ paymentMethods: methods });
        } catch (error) {
          console.error("Failed to load payment methods:", error);
        }
      },

      addPaymentMethod: async (paymentMethod: Omit<PaymentMethod, "id">) => {
        try {
          // TODO: Implement API call
          const methodId = `method_${Date.now()}`;
          const newMethod: PaymentMethod = {
            ...paymentMethod,
            id: methodId,
          };

          set((state) => ({
            paymentMethods: [...state.paymentMethods, newMethod],
          }));

          return methodId;
        } catch (error) {
          console.error("Failed to add payment method:", error);
          throw error;
        }
      },

      updatePaymentMethod: async (
        methodId: string,
        updates: Partial<PaymentMethod>
      ) => {
        try {
          // TODO: Implement API call
          set((state) => ({
            paymentMethods: state.paymentMethods.map((method) =>
              method.id === methodId ? { ...method, ...updates } : method
            ),
          }));
        } catch (error) {
          console.error("Failed to update payment method:", error);
          throw error;
        }
      },

      deletePaymentMethod: async (methodId: string) => {
        try {
          // TODO: Implement API call
          set((state) => ({
            paymentMethods: state.paymentMethods.filter(
              (method) => method.id !== methodId
            ),
            defaultPaymentMethod:
              state.defaultPaymentMethod === methodId
                ? null
                : state.defaultPaymentMethod,
          }));
        } catch (error) {
          console.error("Failed to delete payment method:", error);
          throw error;
        }
      },

      setDefaultPaymentMethod: async (methodId: string) => {
        try {
          // TODO: Implement API call
          set({ defaultPaymentMethod: methodId });
        } catch (error) {
          console.error("Failed to set default payment method:", error);
          throw error;
        }
      },

      loadSubscriptionDetails: async () => {
        try {
          // TODO: Implement API call
          // const subscription = await SubscriptionService.getSubscriptionDetails();
          // set({
          //   currentPlan: subscription.plan,
          //   subscriptionStatus: subscription.status,
          //   expiryDate: subscription.expiryDate,
          //   autoRenew: subscription.autoRenew,
          //   nextBillingDate: subscription.nextBillingDate,
          //   billingAmount: subscription.billingAmount,
          //   billingCurrency: subscription.billingCurrency,
          //   billingCycle: subscription.billingCycle,
          // });
        } catch (error) {
          console.error("Failed to load subscription details:", error);
        }
      },

      updateAutoRenew: async (autoRenew: boolean) => {
        try {
          // TODO: Implement API call
          set({ autoRenew });
        } catch (error) {
          console.error("Failed to update auto-renew:", error);
          throw error;
        }
      },

      changeBillingCycle: async (cycle: "monthly" | "yearly") => {
        set({ isUpdatingSubscription: true });
        try {
          // TODO: Implement API call
          set({ billingCycle: cycle, isUpdatingSubscription: false });
        } catch (error) {
          console.error("Failed to change billing cycle:", error);
          set({ isUpdatingSubscription: false });
          throw error;
        }
      },

      pauseSubscription: async (duration: number) => {
        set({ isUpdatingSubscription: true });
        try {
          // TODO: Implement API call with duration
          set({
            subscriptionStatus: "paused",
            isUpdatingSubscription: false,
          });
        } catch (error) {
          console.error("Failed to pause subscription:", error);
          set({ isUpdatingSubscription: false });
          throw error;
        }
      },

      resumeSubscription: async () => {
        set({ isUpdatingSubscription: true });
        try {
          // TODO: Implement API call
          set({
            subscriptionStatus: "active",
            isUpdatingSubscription: false,
          });
        } catch (error) {
          console.error("Failed to resume subscription:", error);
          set({ isUpdatingSubscription: false });
          throw error;
        }
      },

      processPurchase: async (
        planId: string,
        paymentMethodId: string,
        promotionCode?: string
      ) => {
        set({ isProcessingPayment: true });
        try {
          // TODO: Implement API call
          const purchaseId = `purchase_${Date.now()}`;

          // Add to purchase history
          const purchase: PurchaseHistory = {
            id: purchaseId,
            subscriptionId: planId, // Use subscriptionId instead of planId
            amount: 0, // TODO: Get from API
            currency: "USD",
            status: "completed",
            transactionId: `txn_${Date.now()}`,
            createdAt: new Date().toISOString(),
          };

          set((state) => ({
            purchaseHistory: [purchase, ...state.purchaseHistory],
            isProcessingPayment: false,
          }));

          return purchaseId;
        } catch (error) {
          console.error("Failed to process purchase:", error);
          set({ isProcessingPayment: false });
          throw error;
        }
      },

      loadPurchaseHistory: async () => {
        try {
          // TODO: Implement API call
          // const history = await SubscriptionService.getPurchaseHistory();
          // set({ purchaseHistory: history });
        } catch (error) {
          console.error("Failed to load purchase history:", error);
        }
      },

      downloadInvoice: async (invoiceId: string) => {
        try {
          // TODO: Implement API call and file download
          console.log("Downloading invoice:", invoiceId);
        } catch (error) {
          console.error("Failed to download invoice:", error);
          throw error;
        }
      },

      retryFailedPayment: async (paymentMethodId?: string) => {
        set({ isProcessingPayment: true });
        try {
          // TODO: Implement API call
          set({
            paymentFailures: 0,
            lastPaymentFailure: null,
            isProcessingPayment: false,
          });
        } catch (error) {
          console.error("Failed to retry payment:", error);
          set({ isProcessingPayment: false });
          throw error;
        }
      },

      loadSubscriptionFeatures: async () => {
        try {
          // TODO: Implement API call
          // const features = await SubscriptionService.getSubscriptionFeatures();
          // set({ subscriptionFeatures: features });
        } catch (error) {
          console.error("Failed to load subscription features:", error);
        }
      },

      checkFeatureAccess: (featureName: string) => {
        const state = get();
        if (!state.subscriptionFeatures) return false;

        // Since subscriptionFeatures is a single SubscriptionFeature, check if it matches the featureName
        return (
          state.subscriptionFeatures.name === featureName &&
          state.subscriptionFeatures.isEnabled
        );
      },

      updateFeatureUsage: (featureName: string, increment = 1) => {
        set((state) => {
          const currentUsage = state.featureUsage[featureName] || {
            used: 0,
            limit: 0,
          };
          const newUsed = Math.max(0, currentUsage.used + increment);

          return {
            featureUsage: {
              ...state.featureUsage,
              [featureName]: {
                ...currentUsage,
                used: newUsed,
              },
            },
          };
        });
      },

      resetFeatureUsage: (featureName: string) => {
        set((state) => ({
          featureUsage: {
            ...state.featureUsage,
            [featureName]: {
              ...state.featureUsage[featureName],
              used: 0,
              resetDate: new Date(),
            },
          },
        }));
      },

      applyPromotionCode: async (code: string) => {
        try {
          // TODO: Implement API call
          // const result = await SubscriptionService.validatePromotionCode(code);
          // return result;
          return {
            valid: true,
            discount: 10,
            message: "Promotion code applied successfully",
          };
        } catch (error) {
          console.error("Failed to apply promotion code:", error);
          return { valid: false, message: "Invalid promotion code" };
        }
      },

      removePromotionCode: async () => {
        try {
          // TODO: Implement API call
          console.log("Promotion code removed");
        } catch (error) {
          console.error("Failed to remove promotion code:", error);
          throw error;
        }
      },

      loadAvailablePromotions: async () => {
        try {
          // TODO: Implement API call
          // const promotions = await SubscriptionService.getAvailablePromotions();
          console.log("Available promotions loaded");
        } catch (error) {
          console.error("Failed to load available promotions:", error);
        }
      },

      trackSubscriptionEvent: (
        eventType: string,
        metadata?: Record<string, any>
      ) => {
        // TODO: Implement analytics tracking
        console.log("Subscription event:", eventType, metadata);
      },

      loadUsageAnalytics: async (period: "week" | "month" | "year") => {
        try {
          // TODO: Implement API call
          console.log("Usage analytics loaded for:", period);
        } catch (error) {
          console.error("Failed to load usage analytics:", error);
        }
      },

      updateNotificationPreferences: async (preferences: {
        renewalReminders: boolean;
        billingAlerts: boolean;
      }) => {
        try {
          // TODO: Implement API call
          set({
            renewalReminders: preferences.renewalReminders,
            billingAlerts: preferences.billingAlerts,
          });
        } catch (error) {
          console.error("Failed to update notification preferences:", error);
          throw error;
        }
      },

      markPaymentFailureHandled: () => {
        set({ paymentFailures: 0, lastPaymentFailure: null });
      },

      showUpgradeFlow: (planId?: string) => {
        set({
          showUpgradeModal: true,
          selectedPlanId: planId || null,
        });
      },

      hideUpgradeFlow: () => {
        set({
          showUpgradeModal: false,
          selectedPlanId: null,
        });
      },

      showCancelFlow: () => {
        set({ showCancelModal: true });
      },

      hideCancelFlow: () => {
        set({ showCancelModal: false });
      },

      clearSubscriptionData: () => {
        set({
          currentPlan: null,
          subscriptionStatus: "inactive",
          expiryDate: null,
          autoRenew: true,
          availablePlans: [],
          paymentMethods: [],
          defaultPaymentMethod: null,
          purchaseHistory: [],
          subscriptionFeatures: null,
          featureUsage: {},
          nextBillingDate: null,
          billingAmount: 0,
          billingCurrency: "USD",
          billingCycle: "monthly",
          paymentFailures: 0,
          lastPaymentFailure: null,
          selectedPlanId: null,
        });
      },
    }),
    {
      name: "subscription-store",
      partialize: (state) => ({
        currentPlan: state.currentPlan,
        subscriptionStatus: state.subscriptionStatus,
        expiryDate: state.expiryDate,
        autoRenew: state.autoRenew,
        defaultPaymentMethod: state.defaultPaymentMethod,
        featureUsage: state.featureUsage,
        billingCycle: state.billingCycle,
        renewalReminders: state.renewalReminders,
        billingAlerts: state.billingAlerts,
        paymentFailures: state.paymentFailures,
        lastPaymentFailure: state.lastPaymentFailure,
      }),
    }
  )
);
