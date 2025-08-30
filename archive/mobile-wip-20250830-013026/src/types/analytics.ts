/**
 * Analytics Types
 * Defines analytics, tracking, metrics, and reporting structures
 */

export interface AnalyticsEvent {
  id: string;
  userId?: string;
  sessionId: string;
  name: string;
  category: EventCategory;
  type: EventType;
  properties: EventProperties;
  context: EventContext;
  timestamp: string;
  deviceInfo: DeviceInfo;
  location?: LocationInfo;
  metadata?: Record<string, any>;
}

export interface UserAction {
  type:
    | "click"
    | "tap"
    | "swipe"
    | "scroll"
    | "form_submit"
    | "search"
    | "share"
    | "like"
    | "match"
    | "message"
    | "upload"
    | "download"
    | "custom";
  target: string;
  data?: Record<string, any>;
  timestamp: string;
  sessionId: string;
}

export interface ScreenView {
  screenName: string;
  route: string;
  params?: Record<string, any>;
  timestamp: string;
  sessionId: string;
  duration?: number;
  previousScreen?: string;
}

export interface CustomEvent {
  name: string;
  category: string;
  properties: Record<string, any>;
  timestamp: string;
  sessionId: string;
  userId?: string;
}

export interface AnalyticsConfig {
  batchSize: number;
  flushInterval: number;
  enableAutoTracking: boolean;
  enablePerformanceTracking: boolean;
  enableErrorTracking: boolean;
  enableOfflineQueue?: boolean;
  maxQueueSize?: number;
  apiEndpoint?: string;
  debug?: boolean;
}

export type EventCategory =
  | "user"
  | "navigation"
  | "interaction"
  | "conversion"
  | "engagement"
  | "performance"
  | "error"
  | "system"
  | "session"
  | "user_action"
  | "custom";

export type EventType =
  | "page_view"
  | "screen_view"
  | "click"
  | "tap"
  | "swipe"
  | "scroll"
  | "form_submit"
  | "search"
  | "purchase"
  | "signup"
  | "login"
  | "logout"
  | "share"
  | "like"
  | "match"
  | "message"
  | "upload"
  | "download"
  | "error"
  | "crash"
  | "performance"
  | "custom";

export interface EventProperties {
  [key: string]:
    | string
    | number
    | boolean
    | Date
    | null
    | undefined
    | Record<string, any>;
}

export interface EventContext extends Record<string, any> {
  app: AppContext;
  screen: ScreenContext;
  user: UserContext;
  session: SessionContext;
  campaign?: CampaignContext;
}

export interface AppContext {
  version: string;
  build: string;
  platform: "ios" | "android" | "web";
  environment: "development" | "staging" | "production";
  locale: string;
  timezone: string;
}

export interface ScreenContext {
  name: string;
  route: string;
  params?: Record<string, any>;
  referrer?: string;
  path?: string;
  title?: string;
}

export interface UserContext {
  id?: string | null;
  isAuthenticated: boolean;
  role?: string;
  segment?: string;
  subscription?: string;
  registrationDate?: string;
  lastActiveDate?: string;
}

export interface SessionContext {
  id: string;
  startTime: string;
  duration: number;
  pageViews: number;
  isFirstSession: boolean;
  referrer?: string;
  utmParams?: UTMParams;
}

export interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface CampaignContext {
  id: string;
  name: string;
  source: string;
  medium: string;
  content?: string;
  term?: string;
}

export interface DeviceInfo {
  id: string;
  type: "mobile" | "tablet" | "desktop" | "tv" | "watch" | "unknown";
  os: string;
  osVersion: string;
  browser?: string;
  browserVersion?: string;
  manufacturer?: string;
  model?: string;
  screenResolution?: string;
  orientation?: "portrait" | "landscape";
  connectionType?: "wifi" | "cellular" | "ethernet" | "unknown";
  platform?: string;
  appVersion?: string;
  buildNumber?: string;
  language?: string;
  timezone?: string;
}

export interface LocationInfo {
  country: string;
  region: string;
  city: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  timezone: string;
  ipAddress?: string;
}

// Analytics Metrics
export interface AnalyticsMetrics {
  period: TimePeriod;
  overview: OverviewMetrics;
  acquisition: AcquisitionMetrics;
  engagement: EngagementMetrics;
  retention: RetentionMetrics;
  conversion: ConversionMetrics;
  revenue: RevenueMetrics;
  performance: PerformanceMetrics;
  errors: ErrorMetrics;
  customMetrics: CustomMetric[];
}

export interface TimePeriod {
  start: string;
  end: string;
  granularity: "hour" | "day" | "week" | "month" | "quarter" | "year";
  timezone: string;
}

export interface OverviewMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  sessions: number;
  pageViews: number;
  bounceRate: number;
  averageSessionDuration: number;
  pagesPerSession: number;
}

export interface AcquisitionMetrics {
  totalAcquisitions: number;
  channels: ChannelMetrics[];
  campaigns: CampaignMetrics[];
  referrers: ReferrerMetrics[];
  organicVsPaid: OrganicPaidBreakdown;
  costMetrics: CostMetrics;
}

export interface ChannelMetrics {
  channel: string;
  users: number;
  sessions: number;
  conversions: number;
  conversionRate: number;
  cost: number;
  roas: number; // Return on Ad Spend
}

export interface CampaignMetrics {
  campaignId: string;
  name: string;
  impressions: number;
  clicks: number;
  ctr: number; // Click-through rate
  users: number;
  conversions: number;
  conversionRate: number;
  cost: number;
  cac: number; // Customer Acquisition Cost
  roas: number;
}

export interface ReferrerMetrics {
  domain: string;
  users: number;
  sessions: number;
  bounceRate: number;
  conversions: number;
}

export interface OrganicPaidBreakdown {
  organic: {
    users: number;
    sessions: number;
    conversions: number;
  };
  paid: {
    users: number;
    sessions: number;
    conversions: number;
    cost: number;
  };
}

export interface CostMetrics {
  totalSpend: number;
  costPerClick: number;
  costPerAcquisition: number;
  returnOnAdSpend: number;
  adSpendEfficiency: number;
}

export interface EngagementMetrics {
  averageSessionDuration: number;
  pagesPerSession: number;
  bounceRate: number;
  timeOnPage: number;
  scrollDepth: number;
  interactions: InteractionMetrics;
  content: ContentEngagement[];
  social: SocialMetrics;
}

export interface InteractionMetrics {
  clicks: number;
  taps: number;
  swipes: number;
  scrolls: number;
  formSubmissions: number;
  downloads: number;
  shares: number;
  likes: number;
  comments: number;
}

export interface ContentEngagement {
  content: string;
  type: "page" | "post" | "video" | "image" | "document";
  views: number;
  uniqueViews: number;
  averageTime: number;
  engagementRate: number;
  shares: number;
  likes: number;
  comments: number;
}

export interface SocialMetrics {
  shares: ShareMetrics[];
  likes: number;
  comments: number;
  mentions: number;
  followers: number;
  reach: number;
  impressions: number;
  engagementRate: number;
}

export interface ShareMetrics {
  platform: string;
  shares: number;
  clicks: number;
  impressions: number;
}

export interface RetentionMetrics {
  overallRetention: RetentionData;
  cohortAnalysis: CohortData[];
  churnRate: number;
  stickiness: StickinessMetrics;
  lifecycle: LifecycleSegments;
}

export interface RetentionData {
  day1: number;
  day7: number;
  day30: number;
  day90: number;
  day365: number;
}

export interface CohortData {
  cohort: string; // e.g., "2024-01"
  size: number;
  retention: RetentionData;
}

export interface StickinessMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  dau_wau_ratio: number;
  dau_mau_ratio: number;
  wau_mau_ratio: number;
}

export interface LifecycleSegments {
  new: number;
  active: number;
  returning: number;
  dormant: number;
  churned: number;
}

export interface ConversionMetrics {
  goals: ConversionGoal[];
  funnels: FunnelAnalysis[];
  attribution: AttributionAnalysis;
  multitouch: MultitouchAttribution[];
}

export interface ConversionGoal {
  id: string;
  name: string;
  type: "macro" | "micro";
  conversions: number;
  conversionRate: number;
  value: number;
  attribution: AttributionData[];
}

export interface AttributionData {
  channel: string;
  conversions: number;
  percentage: number;
  value: number;
}

export interface FunnelAnalysis {
  id: string;
  name: string;
  steps: FunnelStep[];
  conversionRate: number;
  dropOffPoints: DropOffAnalysis[];
}

export interface FunnelStep {
  name: string;
  users: number;
  conversionRate: number;
  averageTime: number;
  dropOff: number;
}

export interface DropOffAnalysis {
  step: string;
  dropOffRate: number;
  reasons: DropOffReason[];
  recommendations: string[];
}

export interface DropOffReason {
  reason: string;
  percentage: number;
  impact: "high" | "medium" | "low";
}

export interface AttributionAnalysis {
  model: AttributionModel;
  channels: ChannelAttribution[];
  touchpoints: TouchpointAttribution[];
  paths: ConversionPath[];
}

export type AttributionModel =
  | "first_click"
  | "last_click"
  | "linear"
  | "time_decay"
  | "position_based"
  | "data_driven"
  | "custom";

export interface ChannelAttribution {
  channel: string;
  credit: number;
  percentage: number;
  conversions: number;
  value: number;
}

export interface TouchpointAttribution {
  touchpoint: string;
  position: number;
  credit: number;
  influence: number;
}

export interface ConversionPath {
  path: string[];
  conversions: number;
  percentage: number;
  averageTime: number;
  value: number;
}

export interface MultitouchAttribution {
  conversionId: string;
  touchpoints: Touchpoint[];
  totalCredit: number;
  attributionModel: AttributionModel;
}

export interface Touchpoint {
  channel: string;
  campaign?: string;
  timestamp: string;
  credit: number;
  position: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  averageOrderValue: number;
  revenuePerUser: number;
  lifetimeValue: number;
  paybackPeriod: number;
  segments: RevenueSegment[];
  products: ProductRevenue[];
  geography: GeographicRevenue[];
  trends: RevenueTrends;
}

export interface RevenueSegment {
  segment: string;
  revenue: number;
  users: number;
  averageValue: number;
  percentage: number;
}

export interface ProductRevenue {
  productId: string;
  name: string;
  revenue: number;
  units: number;
  averagePrice: number;
  margin: number;
  percentage: number;
}

export interface GeographicRevenue {
  country: string;
  revenue: number;
  users: number;
  averageValue: number;
  percentage: number;
}

export interface RevenueTrends {
  growth: GrowthTrend[];
  seasonality: SeasonalityData[];
  forecasts: RevenueForecast[];
}

export interface GrowthTrend {
  period: string;
  revenue: number;
  growth: number;
  yoy_growth: number;
}

export interface SeasonalityData {
  period: string;
  index: number;
  typical_revenue: number;
  variance: number;
}

export interface RevenueForecast {
  period: string;
  forecast: number;
  confidence_lower: number;
  confidence_upper: number;
  factors: ForecastFactor[];
}

export interface ForecastFactor {
  factor: string;
  impact: number;
  confidence: number;
}

export interface PerformanceMetrics {
  pageLoad: PerformanceData;
  api: APIPerformance[];
  resources: ResourceMetrics;
  userExperience: UXMetrics;
  errors: ErrorRate[];
}

export interface PerformanceData {
  averageLoadTime: number;
  medianLoadTime: number;
  p95LoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

export interface APIPerformance {
  endpoint: string;
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  throughput: number;
}

export interface ResourceMetrics {
  totalSize: number;
  requests: number;
  cached: number;
  cacheHitRate: number;
  compressionRatio: number;
}

export interface UXMetrics {
  timeToInteractive: number;
  totalBlockingTime: number;
  speedIndex: number;
  userSatisfaction: number;
  frustrationSignals: FrustrationSignal[];
}

export interface FrustrationSignal {
  type: "rage_click" | "dead_click" | "error_click" | "excessive_scrolling";
  count: number;
  impact: "high" | "medium" | "low";
}

export interface ErrorRate {
  type: string;
  count: number;
  rate: number;
  trend: "increasing" | "decreasing" | "stable";
}

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  criticalErrors: number;
  errorTypes: ErrorTypeBreakdown[];
  affectedUsers: number;
  resolution: ErrorResolution;
}

export interface ErrorTypeBreakdown {
  type: string;
  count: number;
  percentage: number;
  severity: "critical" | "high" | "medium" | "low";
  trend: "increasing" | "decreasing" | "stable";
}

export interface ErrorResolution {
  averageTimeToResolution: number;
  resolutionRate: number;
  escalatedErrors: number;
  recurringErrors: number;
}

export interface CustomMetric {
  id: string;
  name: string;
  description: string;
  value: number;
  unit: string;
  type: "counter" | "gauge" | "histogram" | "timer";
  tags: Record<string, string>;
  timestamp: string;
}

// Real-time Analytics
export interface RealTimeAnalytics {
  activeUsers: number;
  currentSessions: number;
  pagesPerSecond: number;
  topPages: TopPage[];
  topEvents: TopEvent[];
  geographicData: GeographicData[];
  deviceBreakdown: DeviceBreakdown[];
  traffic: TrafficData[];
}

export interface TopPage {
  path: string;
  activeUsers: number;
  pageViews: number;
}

export interface TopEvent {
  name: string;
  count: number;
  lastOccurred: string;
}

export interface GeographicData {
  country: string;
  activeUsers: number;
  percentage: number;
}

export interface DeviceBreakdown {
  category: string;
  activeUsers: number;
  percentage: number;
}

export interface TrafficData {
  timestamp: string;
  users: number;
  sessions: number;
  pageViews: number;
}

// A/B Testing Analytics
export interface ABTestAnalytics {
  testId: string;
  name: string;
  status: "running" | "completed" | "paused" | "stopped";
  variants: ABTestVariant[];
  metrics: ABTestMetrics;
  significance: StatisticalSignificance;
  recommendations: TestRecommendation[];
}

export interface ABTestVariant {
  id: string;
  name: string;
  trafficAllocation: number;
  participants: number;
  conversions: number;
  conversionRate: number;
  isControl: boolean;
}

export interface ABTestMetrics {
  primaryMetric: TestMetric;
  secondaryMetrics: TestMetric[];
  guardrailMetrics: TestMetric[];
}

export interface TestMetric {
  name: string;
  type: "conversion" | "revenue" | "engagement" | "retention";
  control: MetricValue;
  variants: Record<string, MetricValue>;
  improvement: number;
  pValue: number;
  confidence: number;
}

export interface MetricValue {
  value: number;
  variance: number;
  sampleSize: number;
  confidenceInterval: [number, number];
}

export interface StatisticalSignificance {
  isSignificant: boolean;
  confidenceLevel: number;
  pValue: number;
  effect_size: number;
  power: number;
  minDetectableEffect: number;
}

export interface TestRecommendation {
  type: "launch" | "stop" | "continue" | "iterate";
  reason: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  nextSteps: string[];
}
