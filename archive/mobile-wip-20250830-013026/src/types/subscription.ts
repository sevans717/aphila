/**
 * Subscription Types
 * Defines subscription plans, billing, payments, and premium features
 */

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  pricing: SubscriptionPricing;
  features: SubscriptionFeature[];
  limits: SubscriptionLimits;
  payment: PaymentInfo;
  trial?: TrialInfo;
  discounts: AppliedDiscount[];
  addons: SubscriptionAddon[];
  metadata: SubscriptionMetadata;
  startedAt: string;
  renewsAt: string;
  endsAt?: string;
  cancelledAt?: string;
  pausedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionStatus =
  | "active"
  | "inactive"
  | "trial"
  | "cancelled"
  | "paused"
  | "past_due"
  | "suspended"
  | "pending"
  | "expired";

export type BillingCycle =
  | "monthly"
  | "quarterly"
  | "yearly"
  | "one_time"
  | "custom";

export interface SubscriptionPricing {
  basePrice: number;
  currency: string;
  totalPrice: number;
  taxes: TaxInfo[];
  discountAmount: number;
  finalAmount: number;
  proration?: ProrationInfo;
}

export interface TaxInfo {
  name: string;
  rate: number;
  amount: number;
  jurisdiction: string;
  type: "vat" | "sales_tax" | "gst" | "other";
}

export interface ProrationInfo {
  amount: number;
  description: string;
  startDate: string;
  endDate: string;
}

export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  type: FeatureType;
  value: FeatureValue;
  isEnabled: boolean;
  isPremium: boolean;
  category: FeatureCategory;
  dependencies?: string[];
}

export type FeatureType = "boolean" | "numeric" | "text" | "list" | "object";
export type FeatureValue =
  | boolean
  | number
  | string
  | string[]
  | Record<string, any>;

export type FeatureCategory =
  | "matching"
  | "messaging"
  | "media"
  | "profile"
  | "analytics"
  | "customization"
  | "support"
  | "api"
  | "storage"
  | "community";

export interface SubscriptionLimits {
  dailyLikes: number;
  dailyMatches: number;
  monthlyBoosts: number;
  superLikes: number;
  rewinds: number;
  messageAttachments: number;
  profilePhotos: number;
  videoUploads: number;
  communityPosts: number;
  apiCalls: number;
  storageGB: number;
  customLimits: Record<string, number>;
}

export interface PaymentInfo {
  method: PaymentMethod;
  provider: PaymentProvider;
  customerId: string;
  subscriptionId: string;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  failedPayments: FailedPayment[];
  autoRenew: boolean;
  paymentHistory: PaymentHistoryEntry[];
}

export interface PaymentMethod {
  id: string;
  type: PaymentType;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  country?: string;
  isDefault: boolean;
  isVerified: boolean;
  metadata?: Record<string, any>;
}

export type PaymentType =
  | "credit_card"
  | "debit_card"
  | "paypal"
  | "apple_pay"
  | "google_pay"
  | "bank_transfer"
  | "crypto"
  | "gift_card"
  | "other";

export type PaymentProvider =
  | "stripe"
  | "paypal"
  | "square"
  | "braintree"
  | "adyen"
  | "razorpay"
  | "paddle"
  | "chargebee"
  | "recurly"
  | "other";

export interface FailedPayment {
  date: string;
  amount: number;
  reason: string;
  code: string;
  retryAt?: string;
  maxRetries: number;
  currentRetry: number;
}

export interface PaymentHistoryEntry {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description: string;
  invoice?: InvoiceInfo;
  refund?: RefundInfo;
}

export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "refunded"
  | "disputed"
  | "cancelled";

export interface InvoiceInfo {
  id: string;
  number: string;
  url: string;
  pdfUrl?: string;
  dueDate: string;
  paidAt?: string;
}

export interface RefundInfo {
  id: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  processedAt?: string;
}

export type RefundStatus = "pending" | "completed" | "failed" | "cancelled";

export interface TrialInfo {
  isActive: boolean;
  startedAt: string;
  endsAt: string;
  remainingDays: number;
  hasUsedTrial: boolean;
  trialType: TrialType;
  convertedAt?: string;
}

export type TrialType =
  | "free_trial"
  | "freemium"
  | "money_back"
  | "feature_limited";

export interface AppliedDiscount {
  id: string;
  code?: string;
  name: string;
  type: DiscountType;
  value: number;
  amount: number;
  currency: string;
  validUntil?: string;
  restrictions?: DiscountRestrictions;
  metadata?: Record<string, any>;
}

export type DiscountType =
  | "percentage"
  | "fixed_amount"
  | "free_shipping"
  | "buy_x_get_y";

export interface DiscountRestrictions {
  minAmount?: number;
  maxAmount?: number;
  firstTimeOnly?: boolean;
  maxUses?: number;
  currentUses?: number;
  eligiblePlans?: string[];
  excludedPlans?: string[];
}

export interface SubscriptionAddon {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  features: SubscriptionFeature[];
  limits: Record<string, number>;
  isActive: boolean;
  startedAt: string;
  endsAt?: string;
}

export interface SubscriptionMetadata {
  source: string;
  campaign?: string;
  referrer?: string;
  utmParams?: UTMParams;
  customFields?: Record<string, any>;
  tags?: string[];
}

export interface UTMParams {
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
}

// Subscription Plans
export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  shortDescription: string;
  category: PlanCategory;
  type: PlanType;
  status: PlanStatus;
  pricing: PlanPricing;
  features: PlanFeature[];
  limits: PlanLimits;
  benefits: PlanBenefit[];
  restrictions: PlanRestriction[];
  addons: PlanAddon[];
  metadata: PlanMetadata;
  isPopular: boolean;
  isPremium: boolean;
  sortOrder: number;
  availableFrom?: string;
  availableUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export type PlanCategory =
  | "basic"
  | "premium"
  | "pro"
  | "enterprise"
  | "custom";
export type PlanType = "subscription" | "one_time" | "usage_based" | "freemium";
export type PlanStatus = "active" | "inactive" | "deprecated" | "coming_soon";

export interface PlanPricing {
  monthly?: number;
  quarterly?: number;
  yearly?: number;
  oneTime?: number;
  currency: string;
  setupFee?: number;
  trialDays?: number;
  discounts: PlanDiscount[];
}

export interface PlanDiscount {
  type: DiscountType;
  value: number;
  duration?: number; // months
  condition?: string;
}

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  type: FeatureType;
  value: FeatureValue;
  category: FeatureCategory;
  isHighlight: boolean;
  comparison: FeatureComparison;
}

export interface FeatureComparison {
  basic?: FeatureValue;
  premium?: FeatureValue;
  pro?: FeatureValue;
  enterprise?: FeatureValue;
}

export interface PlanLimits {
  users?: number;
  projects?: number;
  storage?: number; // GB
  bandwidth?: number; // GB
  apiCalls?: number;
  customLimits?: Record<string, number>;
}

export interface PlanBenefit {
  title: string;
  description: string;
  icon?: string;
  isNew?: boolean;
  isPopular?: boolean;
}

export interface PlanRestriction {
  type: RestrictionType;
  description: string;
  condition?: string;
}

export type RestrictionType =
  | "geographic"
  | "age_limit"
  | "device_limit"
  | "feature_access"
  | "usage_quota"
  | "time_limit"
  | "custom";

export interface PlanAddon {
  id: string;
  name: string;
  description: string;
  pricing: AddonPricing;
  features: string[];
  isOptional: boolean;
  dependencies?: string[];
}

export interface AddonPricing {
  type: "flat" | "per_unit" | "tiered";
  price: number;
  currency: string;
  unit?: string;
  tiers?: PricingTier[];
}

export interface PricingTier {
  min: number;
  max?: number;
  price: number;
}

export interface PlanMetadata {
  targetAudience: string[];
  useCases: string[];
  competitorComparison?: Record<string, any>;
  marketingCopy?: MarketingCopy;
  seoData?: SEOData;
}

export interface MarketingCopy {
  headline: string;
  subheadline: string;
  cta: string;
  benefits: string[];
  testimonials?: Testimonial[];
}

export interface Testimonial {
  author: string;
  role: string;
  company?: string;
  content: string;
  rating?: number;
  avatar?: string;
}

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  ogImage?: string;
}

// Billing and Invoicing
export interface BillingInfo {
  userId: string;
  customerId: string;
  email: string;
  address: BillingAddress;
  paymentMethods: PaymentMethod[];
  taxId?: string;
  vatNumber?: string;
  billingContact?: ContactInfo;
  preferences: BillingPreferences;
  updatedAt: string;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone?: string;
}

export interface BillingPreferences {
  currency: string;
  timezone: string;
  language: string;
  invoiceDelivery: "email" | "postal" | "both";
  autoRenew: boolean;
  paymentReminders: boolean;
  receiptDelivery: boolean;
}

export interface Invoice {
  id: string;
  number: string;
  userId: string;
  subscriptionId?: string;
  status: InvoiceStatus;
  type: InvoiceType;
  description: string;
  items: InvoiceItem[];
  subtotal: number;
  taxes: TaxInfo[];
  discounts: AppliedDiscount[];
  total: number;
  currency: string;
  dueDate: string;
  paidAt?: string;
  voidedAt?: string;
  urls: InvoiceUrls;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus =
  | "draft"
  | "open"
  | "paid"
  | "void"
  | "uncollectible";
export type InvoiceType =
  | "subscription"
  | "one_off"
  | "credit_note"
  | "proration";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  period?: BillingPeriod;
  proration?: boolean;
  metadata?: Record<string, any>;
}

export interface BillingPeriod {
  start: string;
  end: string;
}

export interface InvoiceUrls {
  hostedUrl: string;
  invoicePdf: string;
  receiptPdf?: string;
}

// Usage and Analytics
export interface SubscriptionUsage {
  subscriptionId: string;
  period: BillingPeriod;
  metrics: UsageMetric[];
  summary: UsageSummary;
  alerts: UsageAlert[];
  updatedAt: string;
}

export interface UsageMetric {
  name: string;
  category: string;
  value: number;
  unit: string;
  limit?: number;
  percentage?: number;
  trend: TrendInfo;
}

export interface TrendInfo {
  direction: "up" | "down" | "stable";
  percentage: number;
  period: string;
}

export interface UsageSummary {
  totalUsage: number;
  totalLimit: number;
  utilizationRate: number;
  topFeatures: TopFeatureUsage[];
  predictions: UsagePrediction[];
}

export interface TopFeatureUsage {
  feature: string;
  usage: number;
  percentage: number;
}

export interface UsagePrediction {
  metric: string;
  predicted: number;
  confidence: number;
  period: string;
}

export interface UsageAlert {
  id: string;
  type: AlertType;
  threshold: number;
  current: number;
  severity: AlertSeverity;
  message: string;
  isActive: boolean;
  triggeredAt: string;
}

export type AlertType =
  | "approaching_limit"
  | "over_limit"
  | "unusual_activity"
  | "billing_issue";
export type AlertSeverity = "info" | "warning" | "critical";

// Subscription Analytics
export interface SubscriptionAnalytics {
  period: AnalyticsPeriod;
  metrics: SubscriptionMetrics;
  cohorts: CohortAnalysis[];
  churn: ChurnAnalysis;
  revenue: RevenueAnalysis;
  plans: PlanAnalysis[];
}

export type AnalyticsPeriod = "1d" | "7d" | "30d" | "90d" | "1y" | "all_time";

export interface SubscriptionMetrics {
  totalSubscribers: number;
  activeSubscribers: number;
  newSubscribers: number;
  cancelledSubscribers: number;
  trialConversions: number;
  churnRate: number;
  growthRate: number;
  retentionRate: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
  paybackPeriod: number;
}

export interface CohortAnalysis {
  cohortMonth: string;
  initialSize: number;
  retentionRates: number[];
  revenueRates: number[];
}

export interface ChurnAnalysis {
  rate: number;
  trend: TrendInfo;
  reasons: ChurnReason[];
  prevention: ChurnPrevention;
  segments: ChurnSegment[];
}

export interface ChurnReason {
  reason: string;
  percentage: number;
  count: number;
}

export interface ChurnPrevention {
  riskScore: number;
  actions: PreventionAction[];
  success_rate: number;
}

export interface PreventionAction {
  type: string;
  description: string;
  impact: number;
  cost: number;
}

export interface ChurnSegment {
  segment: string;
  churnRate: number;
  count: number;
  characteristics: string[];
}

export interface RevenueAnalysis {
  totalRevenue: number;
  recurringRevenue: number;
  oneTimeRevenue: number;
  averageRevenue: number;
  revenueGrowth: number;
  breakdown: RevenueBreakdown;
}

export interface RevenueBreakdown {
  byPlan: Record<string, number>;
  byFeature: Record<string, number>;
  byChannel: Record<string, number>;
  byRegion: Record<string, number>;
}

export interface PlanAnalysis {
  planId: string;
  subscribers: number;
  revenue: number;
  conversionRate: number;
  churnRate: number;
  satisfaction: number;
  populartiy: number;
}

// Additional types needed by stores
export interface PurchaseHistory {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  transactionId?: string;
  createdAt: string;
}

export type SubscriptionFeatures = SubscriptionFeature;
