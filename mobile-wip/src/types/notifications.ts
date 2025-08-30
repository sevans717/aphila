/**
 * Notification Types
 * Defines notification structures, settings, and delivery mechanisms
 */

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  data?: NotificationData;
  priority: NotificationPriority;
  status: NotificationStatus;
  channels: DeliveryChannel[];
  actions: NotificationAction[];
  metadata: NotificationMetadata;
  scheduledFor?: string;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export type NotificationType =
  | "match"
  | "message"
  | "like"
  | "comment"
  | "mention"
  | "follow"
  | "event"
  | "system"
  | "marketing"
  | "reminder"
  | "alert"
  | "update"
  | "achievement";

export type NotificationCategory =
  | "dating"
  | "social"
  | "community"
  | "content"
  | "account"
  | "security"
  | "promotion"
  | "news";

export interface NotificationData {
  entityId?: string;
  entityType?: string;
  imageUrl?: string;
  deepLink?: string;
  customFields?: Record<string, any>;
  tracking?: NotificationTracking;
}

export interface NotificationTracking {
  campaignId?: string;
  segmentId?: string;
  source: string;
  medium: string;
  content?: string;
  term?: string;
}

export type NotificationPriority = "low" | "normal" | "high" | "urgent";
export type NotificationStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "cancelled";

export type DeliveryChannel = "push" | "email" | "sms" | "in_app" | "webhook";

export interface NotificationAction {
  id: string;
  label: string;
  action: ActionType;
  deepLink?: string;
  icon?: string;
  color?: string;
  requiresAuth?: boolean;
  destructive?: boolean;
}

export type ActionType =
  | "open"
  | "dismiss"
  | "reply"
  | "like"
  | "accept"
  | "decline"
  | "custom";

export interface NotificationMetadata {
  source: string;
  batchId?: string;
  templateId?: string;
  version: string;
  locale: string;
  timezone: string;
  deviceInfo?: DeviceInfo;
  userContext?: UserContext;
}

export interface DeviceInfo {
  deviceId: string;
  platform: "ios" | "android" | "web";
  osVersion: string;
  appVersion: string;
  pushToken?: string;
}

export interface UserContext {
  isActive: boolean;
  lastSeen: string;
  preferredTime?: string;
  location?: {
    country: string;
    region: string;
    city: string;
  };
}

// Notification Settings
export interface NotificationSettings {
  userId: string;
  globalEnabled: boolean;
  channels: ChannelSettings;
  categories: CategorySettings;
  quiet_hours: QuietHours;
  frequency: FrequencySettings;
  customRules: NotificationRule[];
  updatedAt: string;
}

export interface ChannelSettings {
  push: ChannelConfig;
  email: ChannelConfig;
  sms: ChannelConfig;
  inApp: ChannelConfig;
}

export interface ChannelConfig {
  enabled: boolean;
  types: Record<NotificationType, boolean>;
  categories: Record<NotificationCategory, boolean>;
  priority_threshold: NotificationPriority;
  custom_sound?: string;
  vibration?: boolean;
}

export type CategorySettings = {
  [K in NotificationCategory]: {
    enabled: boolean;
    channels: DeliveryChannel[];
    priority: NotificationPriority;
    frequency: FrequencyLimit;
    grouping: boolean;
  };
};

export interface QuietHours {
  enabled: boolean;
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  timezone: string;
  days: number[]; // 0-6, Sunday = 0
  emergency_override: boolean;
}

export interface FrequencySettings {
  global: FrequencyLimit;
  per_type: Record<NotificationType, FrequencyLimit>;
  burst_protection: BurstProtection;
}

export interface FrequencyLimit {
  max_per_hour: number;
  max_per_day: number;
  max_per_week: number;
  cooldown_minutes: number;
}

export interface BurstProtection {
  enabled: boolean;
  threshold: number; // notifications within time window
  window_minutes: number;
  action: "delay" | "group" | "suppress";
}

export interface NotificationRule {
  id: string;
  name: string;
  condition: RuleCondition;
  action: RuleAction;
  priority: number;
  isActive: boolean;
  createdAt: string;
}

export interface RuleCondition {
  type: ConditionType;
  field: string;
  operator: ConditionOperator;
  value: any;
  logicalOperator?: "AND" | "OR";
  nested?: RuleCondition[];
}

export type ConditionType =
  | "user"
  | "notification"
  | "time"
  | "device"
  | "custom";
export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "greater_than"
  | "less_than"
  | "in"
  | "not_in";

export interface RuleAction {
  type: ActionType;
  parameters: Record<string, any>;
}

// Push Notification Types
export interface PushNotification {
  title: string;
  body: string;
  badge?: number;
  sound?: string;
  category?: string;
  thread_id?: string;
  collapse_key?: string;
  time_to_live?: number;
  data?: Record<string, any>;
  android?: AndroidConfig;
  ios?: IOSConfig;
  web?: WebConfig;
}

export interface AndroidConfig {
  channel_id: string;
  icon?: string;
  color?: string;
  tag?: string;
  sticky?: boolean;
  ongoing?: boolean;
  only_alert_once?: boolean;
  vibrate?: number[];
  lights?: {
    color: string;
    on_ms: number;
    off_ms: number;
  };
  big_picture?: string;
  big_text?: string;
  actions?: AndroidAction[];
}

export interface AndroidAction {
  key: string;
  title: string;
  icon?: string;
  inputs?: AndroidInput[];
}

export interface AndroidInput {
  key: string;
  placeholder: string;
}

export interface IOSConfig {
  alert?: {
    title?: string;
    subtitle?: string;
    body?: string;
  };
  badge?: number;
  sound?: string | IOSCriticalSound;
  category?: string;
  thread_id?: string;
  target_content_id?: string;
  interruption_level?: "passive" | "active" | "time-sensitive" | "critical";
  relevance_score?: number;
  filter_criteria?: string;
  mutable_content?: boolean;
}

export interface IOSCriticalSound {
  critical: boolean;
  name: string;
  volume: number;
}

export interface WebConfig {
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  renotify?: boolean;
  require_interaction?: boolean;
  actions?: WebAction[];
  timestamp?: number;
  vibrate?: number[];
}

export interface WebAction {
  action: string;
  title: string;
  icon?: string;
}

// Email Notification Types
export interface EmailNotification {
  to: string[];
  cc?: string[];
  bcc?: string[];
  from: EmailAddress;
  reply_to?: EmailAddress;
  subject: string;
  html_body: string;
  text_body?: string;
  template_id?: string;
  template_data?: Record<string, any>;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string; // base64 encoded
  content_type: string;
  content_id?: string;
  disposition?: "attachment" | "inline";
}

// SMS Notification Types
export interface SMSNotification {
  to: string;
  from?: string;
  body: string;
  media_urls?: string[];
  status_callback?: string;
  max_price?: number;
  validity_period?: number;
  force_delivery?: boolean;
  smart_encoded?: boolean;
  provider_id?: string;
}

// In-App Notification Types
export interface InAppNotification {
  id: string;
  type: InAppType;
  title: string;
  message: string;
  icon?: string;
  image?: string;
  actions?: InAppAction[];
  style: InAppStyle;
  duration?: number;
  dismissible: boolean;
  sound?: boolean;
  vibration?: boolean;
  position: NotificationPosition;
}

export type InAppType = "toast" | "banner" | "modal" | "badge" | "feed_item";

export interface InAppAction {
  label: string;
  action: string;
  style: "default" | "cancel" | "destructive";
}

export interface InAppStyle {
  background_color?: string;
  text_color?: string;
  border_color?: string;
  border_radius?: number;
  opacity?: number;
  animation?: "slide" | "fade" | "bounce" | "none";
}

export type NotificationPosition = "top" | "bottom" | "center";

// Notification Analytics
export interface NotificationAnalytics {
  notificationId: string;
  metrics: NotificationMetrics;
  engagement: EngagementMetrics;
  delivery: DeliveryMetrics;
  conversion: ConversionMetrics;
}

export interface NotificationMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  dismissed: number;
  failed: number;
}

export interface EngagementMetrics {
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  time_to_open: number; // average seconds
  time_to_click: number; // average seconds
}

export interface DeliveryMetrics {
  delivery_rate: number;
  failure_rate: number;
  bounce_rate: number;
  delivery_time: number; // average seconds
  retry_count: number;
}

export interface ConversionMetrics {
  goal_completions: number;
  revenue: number;
  attribution_window: number; // hours
  conversion_events: ConversionEvent[];
}

export interface ConversionEvent {
  event_name: string;
  count: number;
  revenue: number;
  timestamp: string;
}

// Notification Templates
export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  type: NotificationType;
  category: NotificationCategory;
  channels: DeliveryChannel[];
  subject: string;
  body: string;
  html_body?: string;
  variables: TemplateVariable[];
  conditions?: TemplateCondition[];
  scheduling?: TemplateScheduling;
  localization: Record<string, LocalizedTemplate>;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "url" | "email";
  required: boolean;
  default_value?: any;
  description?: string;
  validation?: VariableValidation;
}

export interface VariableValidation {
  min_length?: number;
  max_length?: number;
  pattern?: string;
  allowed_values?: any[];
}

export interface TemplateCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
  template_variant?: string;
}

export interface TemplateScheduling {
  delay_seconds?: number;
  optimal_time?: boolean;
  timezone_aware?: boolean;
  batch_size?: number;
  rate_limit?: number; // per second
}

export interface LocalizedTemplate {
  subject: string;
  body: string;
  html_body?: string;
  variables: Record<string, string>;
}

// Notification Campaigns
export interface NotificationCampaign {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  status: CampaignStatus;
  template_id: string;
  audience: AudienceConfig;
  scheduling: CampaignScheduling;
  delivery: CampaignDelivery;
  ab_test?: ABTestConfig;
  analytics: CampaignAnalytics;
  createdAt: string;
  updatedAt: string;
}

export type CampaignType =
  | "one_time"
  | "recurring"
  | "triggered"
  | "drip"
  | "ab_test";
export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "running"
  | "paused"
  | "completed"
  | "cancelled";

export interface AudienceConfig {
  type: "all" | "segment" | "custom" | "imported";
  segment_id?: string;
  filters?: AudienceFilter[];
  size?: number;
  preview_users?: string[];
}

export interface AudienceFilter {
  field: string;
  operator: ConditionOperator;
  value: any;
  logicalOperator?: "AND" | "OR";
}

export interface CampaignScheduling {
  start_date?: string;
  end_date?: string;
  timezone: string;
  frequency?: FrequencyConfig;
  optimal_timing?: boolean;
}

export interface FrequencyConfig {
  type: "once" | "daily" | "weekly" | "monthly" | "custom";
  interval?: number;
  days_of_week?: number[];
  time_of_day?: string;
  end_after?: number; // number of occurrences
}

export interface CampaignDelivery {
  channels: DeliveryChannel[];
  priority: NotificationPriority;
  batch_size?: number;
  rate_limit?: number;
  retry_config?: RetryConfig;
}

export interface RetryConfig {
  max_retries: number;
  retry_intervals: number[]; // seconds
  backoff_strategy: "fixed" | "exponential" | "linear";
}

export interface ABTestConfig {
  variants: ABTestVariant[];
  traffic_split: number[]; // percentages
  duration_days: number;
  confidence_level: number;
  primary_metric: string;
  secondary_metrics: string[];
}

export interface ABTestVariant {
  id: string;
  name: string;
  template_id: string;
  traffic_percentage: number;
}

export interface CampaignAnalytics {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_conversions: number;
  revenue: number;
  roi: number;
  cost: number;
  delivery_metrics: DeliveryMetrics;
  engagement_metrics: EngagementMetrics;
  conversion_metrics: ConversionMetrics;
}

// Additional interfaces needed by services
export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  channels: Record<string, boolean>;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  categories: Record<NotificationCategory, boolean>;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: DeliveryChannel;
  enabled: boolean;
  settings: Record<string, any>;
}

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
}
