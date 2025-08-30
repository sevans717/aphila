/**
 * Features Configuration
 * Defines feature toggles, experimental features, and feature-specific configurations
 */

// Feature Configuration
export interface FeaturesConfig {
  core: CoreFeatures;
  social: SocialFeatures;
  matching: MatchingFeatures;
  communication: CommunicationFeatures;
  content: ContentFeatures;
  monetization: MonetizationFeatures;
  gamification: GamificationFeatures;
  ai: AIFeatures;
  security: SecurityFeatures;
  analytics: AnalyticsFeatures;
  accessibility: AccessibilityFeatures;
  experimental: ExperimentalFeatures;
  platform: PlatformFeatures;
  integration: IntegrationFeatures;
  advanced: AdvancedFeatures;
}

// Core Features
export interface CoreFeatures {
  authentication: AuthFeatureConfig;
  profile: ProfileFeatureConfig;
  navigation: NavigationFeatureConfig;
  search: SearchFeatureConfig;
  notifications: NotificationFeatureConfig;
  storage: StorageFeatureConfig;
  sync: SyncFeatureConfig;
  offline: OfflineFeatureConfig;
}

export interface AuthFeatureConfig {
  enabled: boolean;
  methods: AuthMethod[];
  socialLogin: SocialLoginConfig;
  biometric: BiometricConfig;
  mfa: MFAConfig;
  session: SessionConfig;
  recovery: RecoveryConfig;
}

export interface AuthMethod {
  type: "email" | "phone" | "username" | "social" | "biometric" | "passkey";
  enabled: boolean;
  required: boolean;
  primary: boolean;
  config?: Record<string, any>;
}

export interface SocialLoginConfig {
  enabled: boolean;
  providers: SocialProvider[];
  autoLink: boolean;
  fallback: boolean;
}

export interface SocialProvider {
  name:
    | "google"
    | "facebook"
    | "apple"
    | "twitter"
    | "linkedin"
    | "github"
    | "discord";
  enabled: boolean;
  clientId?: string;
  scopes: string[];
  buttonStyle: "default" | "icon_only" | "standard" | "wide";
}

export interface BiometricConfig {
  enabled: boolean;
  types: BiometricType[];
  fallback: boolean;
  maxAttempts: number;
  lockoutDuration: number; // minutes
}

export type BiometricType = "fingerprint" | "face" | "voice" | "iris";

export interface MFAConfig {
  enabled: boolean;
  enforced: boolean;
  methods: MFAMethod[];
  gracePeriod: number; // days
  backupCodes: boolean;
}

export interface MFAMethod {
  type: "sms" | "email" | "totp" | "push" | "hardware_key";
  enabled: boolean;
  primary: boolean;
  config?: Record<string, any>;
}

export interface SessionConfig {
  timeout: number; // minutes
  extendOnActivity: boolean;
  maxConcurrentSessions: number;
  deviceLimit: number;
  rememberDevice: boolean;
  deviceTrustDuration: number; // days
}

export interface RecoveryConfig {
  enabled: boolean;
  methods: RecoveryMethod[];
  securityQuestions: boolean;
  emergencyContacts: boolean;
  adminOverride: boolean;
}

export interface RecoveryMethod {
  type: "email" | "sms" | "security_questions" | "trusted_contact" | "admin";
  enabled: boolean;
  primary: boolean;
  config?: Record<string, any>;
}

export interface ProfileFeatureConfig {
  enabled: boolean;
  verification: ProfileVerificationConfig;
  privacy: ProfilePrivacyConfig;
  customization: ProfileCustomizationConfig;
  media: ProfileMediaConfig;
  interests: ProfileInterestsConfig;
}

export interface ProfileVerificationConfig {
  enabled: boolean;
  methods: VerificationMethod[];
  required: boolean;
  badges: boolean;
  autoVerify: boolean;
}

export interface VerificationMethod {
  type: "photo" | "id" | "phone" | "email" | "social" | "background_check";
  enabled: boolean;
  required: boolean;
  automated: boolean;
  config?: Record<string, any>;
}

export interface ProfilePrivacyConfig {
  enabled: boolean;
  visibility: VisibilityLevel[];
  incognito: boolean;
  blocking: boolean;
  reporting: boolean;
  dataDownload: boolean;
}

export type VisibilityLevel =
  | "public"
  | "friends"
  | "matches"
  | "premium"
  | "private";

export interface ProfileCustomizationConfig {
  enabled: boolean;
  themes: boolean;
  customFields: boolean;
  badges: boolean;
  backgrounds: boolean;
  animations: boolean;
}

export interface ProfileMediaConfig {
  enabled: boolean;
  maxPhotos: number;
  maxVideos: number;
  videoLength: number; // seconds
  filters: boolean;
  cropping: boolean;
  compression: boolean;
}

export interface ProfileInterestsConfig {
  enabled: boolean;
  categories: InterestCategory[];
  maxSelections: number;
  customInterests: boolean;
  trending: boolean;
}

export interface InterestCategory {
  id: string;
  name: string;
  enabled: boolean;
  options: string[];
  maxSelections?: number;
}

export interface NavigationFeatureConfig {
  enabled: boolean;
  style: NavigationStyle;
  gestures: NavigationGestureConfig;
  deepLinks: DeepLinkConfig;
  shortcuts: ShortcutConfig;
}

export type NavigationStyle = "tab" | "drawer" | "stack" | "hybrid";

export interface NavigationGestureConfig {
  enabled: boolean;
  swipeGestures: boolean;
  pinchGestures: boolean;
  longPress: boolean;
  doubleTap: boolean;
  edgeSwipe: boolean;
}

export interface DeepLinkConfig {
  enabled: boolean;
  universal: boolean;
  custom: boolean;
  fallback: string;
  domains: string[];
  schemes: string[];
}

export interface ShortcutConfig {
  enabled: boolean;
  dynamic: boolean;
  static: StaticShortcut[];
  max: number;
}

export interface StaticShortcut {
  id: string;
  title: string;
  icon: string;
  action: string;
  enabled: boolean;
}

export interface SearchFeatureConfig {
  enabled: boolean;
  global: boolean;
  voice: boolean;
  visual: boolean;
  filters: SearchFilterConfig;
  suggestions: SearchSuggestionConfig;
  history: SearchHistoryConfig;
}

export interface SearchFilterConfig {
  enabled: boolean;
  categories: string[];
  dateRange: boolean;
  location: boolean;
  customFilters: boolean;
  saved: boolean;
}

export interface SearchSuggestionConfig {
  enabled: boolean;
  trending: boolean;
  personalized: boolean;
  predictive: boolean;
  maxSuggestions: number;
}

export interface SearchHistoryConfig {
  enabled: boolean;
  maxItems: number;
  retention: number; // days
  sync: boolean;
  privacy: boolean;
}

export interface NotificationFeatureConfig {
  enabled: boolean;
  push: PushNotificationConfig;
  inApp: InAppNotificationConfig;
  email: EmailNotificationConfig;
  sms: SMSNotificationConfig;
  categories: NotificationCategoryConfig[];
}

export interface PushNotificationConfig {
  enabled: boolean;
  sound: boolean;
  badge: boolean;
  alert: boolean;
  critical: boolean;
  grouping: boolean;
  actions: boolean;
  media: boolean;
}

export interface InAppNotificationConfig {
  enabled: boolean;
  banner: boolean;
  modal: boolean;
  toast: boolean;
  badge: boolean;
  sound: boolean;
}

export interface EmailNotificationConfig {
  enabled: boolean;
  digest: boolean;
  instant: boolean;
  templates: string[];
  unsubscribe: boolean;
}

export interface SMSNotificationConfig {
  enabled: boolean;
  emergency: boolean;
  security: boolean;
  marketing: boolean;
  optOut: boolean;
}

export interface NotificationCategoryConfig {
  id: string;
  name: string;
  enabled: boolean;
  channels: NotificationChannel[];
  priority: "low" | "normal" | "high" | "urgent";
  grouping: boolean;
}

export type NotificationChannel = "push" | "in_app" | "email" | "sms";

export interface StorageFeatureConfig {
  enabled: boolean;
  types: StorageType[];
  encryption: boolean;
  compression: boolean;
  sync: boolean;
  backup: boolean;
  cleanup: StorageCleanupConfig;
}

export type StorageType = "local" | "secure" | "cloud" | "cache";

export interface StorageCleanupConfig {
  enabled: boolean;
  automatic: boolean;
  schedule: string; // cron expression
  strategy: "lru" | "size" | "age" | "usage";
  thresholds: CleanupThreshold[];
}

export interface CleanupThreshold {
  type: "size" | "age" | "count";
  value: number;
  unit: string;
  action: "warn" | "clean" | "block";
}

export interface SyncFeatureConfig {
  enabled: boolean;
  automatic: boolean;
  conflicts: ConflictResolutionConfig;
  intervals: SyncInterval[];
  selective: boolean;
  background: boolean;
}

export interface ConflictResolutionConfig {
  strategy: "client_wins" | "server_wins" | "merge" | "prompt";
  rules: ConflictRule[];
  timeout: number; // seconds
}

export interface ConflictRule {
  field: string;
  strategy: "client_wins" | "server_wins" | "merge" | "prompt";
  condition?: string;
}

export interface SyncInterval {
  name: string;
  interval: number; // seconds
  conditions: SyncCondition[];
  priority: number;
}

export interface SyncCondition {
  type: "network" | "battery" | "storage" | "time" | "activity";
  requirement: string;
  value?: any;
}

export interface OfflineFeatureConfig {
  enabled: boolean;
  storage: OfflineStorageConfig;
  queue: OfflineQueueConfig;
  indicators: OfflineIndicatorConfig;
  fallbacks: OfflineFallbackConfig[];
}

export interface OfflineStorageConfig {
  enabled: boolean;
  maxSize: number; // MB
  ttl: number; // seconds
  compression: boolean;
  encryption: boolean;
}

export interface OfflineQueueConfig {
  enabled: boolean;
  maxItems: number;
  persistence: boolean;
  retryStrategy: RetryStrategy;
  deduplication: boolean;
}

export interface RetryStrategy {
  maxAttempts: number;
  backoff: "linear" | "exponential" | "fixed";
  initialDelay: number; // ms
  maxDelay: number; // ms
  jitter: boolean;
}

export interface OfflineIndicatorConfig {
  enabled: boolean;
  position: "top" | "bottom" | "floating";
  style: "banner" | "toast" | "badge" | "overlay";
  dismissible: boolean;
}

export interface OfflineFallbackConfig {
  screen: string;
  component: string;
  data?: any;
  enabled: boolean;
}

// Social Features
export interface SocialFeatures {
  sharing: SharingFeatureConfig;
  connections: ConnectionsFeatureConfig;
  recommendations: RecommendationFeatureConfig;
  activity: ActivityFeatureConfig;
  privacy: SocialPrivacyConfig;
}

export interface SharingFeatureConfig {
  enabled: boolean;
  platforms: SharingPlatform[];
  types: SharingType[];
  deepLinks: boolean;
  analytics: boolean;
}

export interface SharingPlatform {
  name:
    | "facebook"
    | "twitter"
    | "instagram"
    | "linkedin"
    | "whatsapp"
    | "telegram"
    | "discord";
  enabled: boolean;
  config?: Record<string, any>;
}

export type SharingType =
  | "profile"
  | "content"
  | "achievement"
  | "event"
  | "match";

export interface ConnectionsFeatureConfig {
  enabled: boolean;
  import: ContactImportConfig;
  suggestions: ConnectionSuggestionConfig;
  verification: ConnectionVerificationConfig;
  limits: ConnectionLimitConfig;
}

export interface ContactImportConfig {
  enabled: boolean;
  sources: ContactSource[];
  frequency: "once" | "periodic" | "manual";
  privacy: ContactPrivacyConfig;
}

export interface ContactSource {
  type: "phone" | "email" | "social" | "manual";
  enabled: boolean;
  permissions: string[];
  config?: Record<string, any>;
}

export interface ContactPrivacyConfig {
  hashContacts: boolean;
  consentRequired: boolean;
  optOut: boolean;
  retention: number; // days
}

export interface ConnectionSuggestionConfig {
  enabled: boolean;
  algorithms: SuggestionAlgorithm[];
  frequency: number; // per day
  blacklist: boolean;
  feedback: boolean;
}

export interface SuggestionAlgorithm {
  name: string;
  enabled: boolean;
  weight: number; // 0-1
  config?: Record<string, any>;
}

export interface ConnectionVerificationConfig {
  enabled: boolean;
  methods: string[];
  required: boolean;
  mutual: boolean;
}

export interface ConnectionLimitConfig {
  maxConnections: number;
  dailyLimit: number;
  rateLimit: RateLimit;
  premiumMultiplier: number;
}

export interface RateLimit {
  requests: number;
  window: number; // seconds
  burst?: number;
}

export interface RecommendationFeatureConfig {
  enabled: boolean;
  algorithms: RecommendationAlgorithm[];
  personalization: PersonalizationConfig;
  feedback: FeedbackConfig;
  diversity: DiversityConfig;
}

export interface RecommendationAlgorithm {
  name: string;
  type: "collaborative" | "content_based" | "hybrid" | "ml" | "rule_based";
  enabled: boolean;
  weight: number; // 0-1
  config?: Record<string, any>;
}

export interface PersonalizationConfig {
  enabled: boolean;
  factors: PersonalizationFactor[];
  learning: boolean;
  decay: number; // days
}

export interface PersonalizationFactor {
  name: string;
  weight: number; // 0-1
  adaptive: boolean;
  enabled: boolean;
}

export interface FeedbackConfig {
  explicit: boolean;
  implicit: boolean;
  negative: boolean;
  reasons: string[];
  anonymous: boolean;
}

export interface DiversityConfig {
  enabled: boolean;
  factors: string[];
  threshold: number; // 0-1
  boost: number; // multiplier
}

export interface ActivityFeatureConfig {
  enabled: boolean;
  feed: ActivityFeedConfig;
  tracking: ActivityTrackingConfig;
  privacy: ActivityPrivacyConfig;
  notifications: ActivityNotificationConfig;
}

export interface ActivityFeedConfig {
  enabled: boolean;
  types: ActivityType[];
  algorithm: "chronological" | "relevance" | "engagement" | "mixed";
  pagination: number;
  realtime: boolean;
}

export type ActivityType =
  | "new_match"
  | "message"
  | "profile_view"
  | "like"
  | "super_like"
  | "boost"
  | "achievement"
  | "content_post"
  | "event_join"
  | "group_join";

export interface ActivityTrackingConfig {
  enabled: boolean;
  events: string[];
  retention: number; // days
  analytics: boolean;
  privacy: boolean;
}

export interface ActivityPrivacyConfig {
  visibility: ActivityVisibility[];
  blocking: boolean;
  anonymous: boolean;
  optOut: boolean;
}

export type ActivityVisibility = "public" | "friends" | "matches" | "private";

export interface ActivityNotificationConfig {
  enabled: boolean;
  types: ActivityType[];
  frequency: "immediate" | "batched" | "digest";
  channels: NotificationChannel[];
}

export interface SocialPrivacyConfig {
  visibility: PrivacyVisibilityConfig;
  blocking: BlockingConfig;
  reporting: ReportingConfig;
  data: DataPrivacyConfig;
}

export interface PrivacyVisibilityConfig {
  profile: VisibilityLevel;
  activity: VisibilityLevel;
  connections: VisibilityLevel;
  content: VisibilityLevel;
  location: VisibilityLevel;
}

export interface BlockingConfig {
  enabled: boolean;
  types: BlockType[];
  duration: BlockDuration[];
  anonymous: boolean;
  cascade: boolean;
}

export type BlockType =
  | "user"
  | "content"
  | "keyword"
  | "location"
  | "category";
export type BlockDuration = "temporary" | "permanent" | "custom";

export interface ReportingConfig {
  enabled: boolean;
  categories: ReportCategory[];
  anonymous: boolean;
  feedback: boolean;
  moderation: boolean;
}

export interface ReportCategory {
  id: string;
  name: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
}

export interface DataPrivacyConfig {
  export: boolean;
  delete: boolean;
  portability: boolean;
  consent: ConsentConfig;
  retention: DataRetentionConfig;
}

export interface ConsentConfig {
  granular: boolean;
  withdrawal: boolean;
  tracking: boolean;
  documentation: boolean;
}

export interface DataRetentionConfig {
  automatic: boolean;
  policies: RetentionPolicy[];
  userControl: boolean;
  notifications: boolean;
}

export interface RetentionPolicy {
  type: string;
  duration: number; // days
  action: "delete" | "anonymize" | "archive";
  conditions?: RetentionCondition[];
}

export interface RetentionCondition {
  field: string;
  operator: string;
  value: any;
}

// Matching Features
export interface MatchingFeatures {
  discovery: DiscoveryFeatureConfig;
  filters: FilterFeatureConfig;
  algorithms: AlgorithmFeatureConfig;
  premium: PremiumMatchingConfig;
  safety: SafetyFeatureConfig;
}

export interface DiscoveryFeatureConfig {
  enabled: boolean;
  modes: DiscoveryMode[];
  radius: RadiusConfig;
  age: AgeRangeConfig;
  limits: DiscoveryLimitConfig;
}

export interface DiscoveryMode {
  name: "swipe" | "browse" | "nearby" | "events" | "interests" | "mutual";
  enabled: boolean;
  default: boolean;
  config?: Record<string, any>;
}

export interface RadiusConfig {
  min: number; // km
  max: number; // km
  default: number; // km
  unlimited: boolean;
  premium: boolean;
}

export interface AgeRangeConfig {
  min: number;
  max: number;
  defaultRange: [number, number];
  verification: boolean;
}

export interface DiscoveryLimitConfig {
  daily: number;
  hourly: number;
  premiumMultiplier: number;
  reset: "rolling" | "fixed";
}

export interface FilterFeatureConfig {
  enabled: boolean;
  basic: BasicFilterConfig;
  advanced: AdvancedFilterConfig;
  premium: PremiumFilterConfig;
  custom: CustomFilterConfig;
}

export interface BasicFilterConfig {
  age: boolean;
  distance: boolean;
  gender: boolean;
  lookingFor: boolean;
  enabled: boolean;
}

export interface AdvancedFilterConfig {
  education: boolean;
  occupation: boolean;
  height: boolean;
  bodyType: boolean;
  lifestyle: boolean;
  interests: boolean;
  enabled: boolean;
  premium: boolean;
}

export interface PremiumFilterConfig {
  verified: boolean;
  active: boolean;
  newUsers: boolean;
  popularUsers: boolean;
  compatibility: boolean;
  enabled: boolean;
}

export interface CustomFilterConfig {
  enabled: boolean;
  maxFilters: number;
  operators: FilterOperator[];
  save: boolean;
  share: boolean;
}

export type FilterOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than"
  | "contains"
  | "in_range";

export interface AlgorithmFeatureConfig {
  enabled: boolean;
  types: AlgorithmType[];
  weights: AlgorithmWeight[];
  learning: boolean;
  feedback: boolean;
}

export interface AlgorithmType {
  name:
    | "compatibility"
    | "activity"
    | "location"
    | "preferences"
    | "behavior"
    | "social";
  enabled: boolean;
  version: string;
  config?: Record<string, any>;
}

export interface AlgorithmWeight {
  factor: string;
  weight: number; // 0-1
  adaptive: boolean;
  userControl: boolean;
}

export interface PremiumMatchingConfig {
  enabled: boolean;
  features: PremiumMatchingFeature[];
  tiers: PremiumTier[];
  limits: PremiumLimitConfig;
}

export interface PremiumMatchingFeature {
  name: string;
  enabled: boolean;
  tier: string;
  description: string;
  config?: Record<string, any>;
}

export interface PremiumTier {
  id: string;
  name: string;
  features: string[];
  limits: Record<string, number>;
  enabled: boolean;
}

export interface PremiumLimitConfig {
  likes: number;
  superLikes: number;
  boosts: number;
  rewinds: number;
  filters: number;
}

export interface SafetyFeatureConfig {
  enabled: boolean;
  verification: SafetyVerificationConfig;
  reporting: SafetyReportingConfig;
  moderation: ModerationConfig;
  blocking: SafetyBlockingConfig;
}

export interface SafetyVerificationConfig {
  photo: boolean;
  identity: boolean;
  background: boolean;
  social: boolean;
  manual: boolean;
  required: boolean;
}

export interface SafetyReportingConfig {
  enabled: boolean;
  categories: string[];
  anonymous: boolean;
  evidence: boolean;
  followUp: boolean;
}

export interface ModerationConfig {
  automated: boolean;
  human: boolean;
  ml: boolean;
  community: boolean;
  appeals: boolean;
}

export interface SafetyBlockingConfig {
  enabled: boolean;
  mutual: boolean;
  cascade: boolean;
  duration: BlockDuration[];
  appeal: boolean;
}

// Communication Features
export interface CommunicationFeatures {
  messaging: MessagingFeatureConfig;
  calls: CallFeatureConfig;
  translation: TranslationFeatureConfig;
  moderation: CommunicationModerationConfig;
  encryption: EncryptionFeatureConfig;
}

export interface MessagingFeatureConfig {
  enabled: boolean;
  types: MessageType[];
  features: MessagingFeature[];
  limits: MessagingLimitConfig;
  storage: MessagingStorageConfig;
}

export type MessageType =
  | "text"
  | "emoji"
  | "sticker"
  | "gif"
  | "image"
  | "video"
  | "audio"
  | "location"
  | "contact";

export interface MessagingFeature {
  name:
    | "reactions"
    | "threading"
    | "forwarding"
    | "editing"
    | "deleting"
    | "scheduling"
    | "encryption";
  enabled: boolean;
  premium: boolean;
  config?: Record<string, any>;
}

export interface MessagingLimitConfig {
  messageLength: number;
  attachmentSize: number; // MB
  dailyMessages: number;
  conversationSize: number;
  mediaPerDay: number;
}

export interface MessagingStorageConfig {
  retention: number; // days
  compression: boolean;
  cloud: boolean;
  download: boolean;
  search: boolean;
}

export interface CallFeatureConfig {
  enabled: boolean;
  types: CallType[];
  features: CallFeature[];
  quality: CallQualityConfig;
  recording: CallRecordingConfig;
}

export type CallType = "voice" | "video" | "group_voice" | "group_video";

export interface CallFeature {
  name:
    | "screen_share"
    | "recording"
    | "effects"
    | "background_blur"
    | "noise_cancellation";
  enabled: boolean;
  premium: boolean;
  config?: Record<string, any>;
}

export interface CallQualityConfig {
  adaptive: boolean;
  maxResolution: string;
  maxFramerate: number;
  maxBitrate: number;
  compression: string;
}

export interface CallRecordingConfig {
  enabled: boolean;
  consent: boolean;
  storage: number; // days
  transcription: boolean;
  sharing: boolean;
}

export interface TranslationFeatureConfig {
  enabled: boolean;
  languages: LanguageConfig[];
  auto: boolean;
  confidence: number; // 0-1
  fallback: boolean;
}

export interface LanguageConfig {
  code: string;
  name: string;
  enabled: boolean;
  quality: "basic" | "good" | "excellent";
  direction: "bidirectional" | "from" | "to";
}

export interface CommunicationModerationConfig {
  enabled: boolean;
  filters: ContentFilter[];
  ml: boolean;
  human: boolean;
  user: boolean;
}

export interface ContentFilter {
  name: string;
  type: "text" | "image" | "video" | "audio" | "link";
  enabled: boolean;
  severity: "low" | "medium" | "high";
  action: "warn" | "block" | "review" | "delete";
}

export interface EncryptionFeatureConfig {
  enabled: boolean;
  endToEnd: boolean;
  algorithm: string;
  keyExchange: string;
  forward: boolean; // forward secrecy
  verification: boolean;
}

// Additional feature configurations would continue here for:
// - ContentFeatures
// - MonetizationFeatures
// - GamificationFeatures
// - AIFeatures
// - SecurityFeatures
// - AnalyticsFeatures
// - AccessibilityFeatures
// - ExperimentalFeatures
// - PlatformFeatures
// - IntegrationFeatures
// - AdvancedFeatures

// Content Features
export interface ContentFeatures {
  media: ContentMediaConfig;
  posts: ContentPostConfig;
  stories: ContentStoryConfig;
  live: ContentLiveConfig;
  moderation: ContentModerationConfig;
}

export interface ContentMediaConfig {
  enabled: boolean;
  types: string[];
  maxSize: number;
  compression: boolean;
  filters: boolean;
  editing: boolean;
}

export interface ContentPostConfig {
  enabled: boolean;
  types: string[];
  scheduling: boolean;
  drafts: boolean;
  analytics: boolean;
}

export interface ContentStoryConfig {
  enabled: boolean;
  duration: number;
  views: boolean;
  replies: boolean;
  highlights: boolean;
}

export interface ContentLiveConfig {
  enabled: boolean;
  duration: number;
  viewers: boolean;
  recording: boolean;
  monetization: boolean;
}

export interface ContentModerationConfig {
  enabled: boolean;
  automated: boolean;
  human: boolean;
  appeals: boolean;
}

// Monetization Features
export interface MonetizationFeatures {
  subscriptions: SubscriptionConfig;
  purchases: PurchaseConfig;
  ads: AdConfig;
  boosts: BoostConfig;
  premium: PremiumConfig;
}

export interface SubscriptionConfig {
  enabled: boolean;
  tiers: string[];
  billing: string[];
  trials: boolean;
}

export interface PurchaseConfig {
  enabled: boolean;
  items: string[];
  currency: string;
  payments: string[];
}

export interface AdConfig {
  enabled: boolean;
  types: string[];
  targeting: boolean;
  frequency: number;
}

export interface BoostConfig {
  enabled: boolean;
  types: string[];
  duration: number;
  pricing: Record<string, number>;
}

export interface PremiumConfig {
  enabled: boolean;
  features: string[];
  limits: Record<string, number>;
}

// Gamification Features
export interface GamificationFeatures {
  achievements: AchievementConfig;
  levels: LevelConfig;
  rewards: RewardConfig;
  challenges: ChallengeConfig;
  leaderboards: LeaderboardConfig;
}

export interface AchievementConfig {
  enabled: boolean;
  categories: string[];
  badges: boolean;
  notifications: boolean;
}

export interface LevelConfig {
  enabled: boolean;
  maxLevel: number;
  xpSystem: boolean;
  milestones: number[];
}

export interface RewardConfig {
  enabled: boolean;
  types: string[];
  distribution: string;
  limits: Record<string, number>;
}

export interface ChallengeConfig {
  enabled: boolean;
  types: string[];
  duration: number;
  rewards: string[];
}

export interface LeaderboardConfig {
  enabled: boolean;
  types: string[];
  periods: string[];
  privacy: boolean;
}

// AI Features
export interface AIFeatures {
  matching: AIMatchingConfig;
  content: AIContentConfig;
  moderation: AIModerationConfig;
  personalization: AIPersonalizationConfig;
  chat: AIChatConfig;
}

export interface AIMatchingConfig {
  enabled: boolean;
  algorithm: string;
  learning: boolean;
  feedback: boolean;
}

export interface AIContentConfig {
  enabled: boolean;
  generation: boolean;
  moderation: boolean;
  tagging: boolean;
}

export interface AIModerationConfig {
  enabled: boolean;
  types: string[];
  accuracy: number;
  appeals: boolean;
}

export interface AIPersonalizationConfig {
  enabled: boolean;
  factors: string[];
  learning: boolean;
  privacy: boolean;
}

export interface AIChatConfig {
  enabled: boolean;
  responses: boolean;
  suggestions: boolean;
  moderation: boolean;
}

// Security Features
export interface SecurityFeatures {
  encryption: EncryptionConfig;
  authentication: SecurityAuthConfig;
  monitoring: SecurityMonitoringConfig;
  compliance: ComplianceConfig;
  privacy: SecurityPrivacyConfig;
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: string;
  keyRotation: number;
  backup: boolean;
}

export interface SecurityAuthConfig {
  enabled: boolean;
  mfa: boolean;
  biometrics: boolean;
  session: SessionConfig;
}

export interface SecurityMonitoringConfig {
  enabled: boolean;
  alerts: boolean;
  logging: boolean;
  anomalies: boolean;
}

export interface ComplianceConfig {
  enabled: boolean;
  standards: string[];
  audits: boolean;
  reporting: boolean;
}

export interface SecurityPrivacyConfig {
  enabled: boolean;
  consent: boolean;
  data: DataPrivacyConfig;
  tracking: boolean;
}

// Analytics Features
export interface AnalyticsFeatures {
  tracking: AnalyticsTrackingConfig;
  reporting: AnalyticsReportingConfig;
  insights: AnalyticsInsightsConfig;
  privacy: AnalyticsPrivacyConfig;
  integration: AnalyticsIntegrationConfig;
}

export interface AnalyticsTrackingConfig {
  enabled: boolean;
  events: string[];
  userId: boolean;
  session: boolean;
}

export interface AnalyticsReportingConfig {
  enabled: boolean;
  dashboards: boolean;
  exports: boolean;
  realtime: boolean;
}

export interface AnalyticsInsightsConfig {
  enabled: boolean;
  predictions: boolean;
  recommendations: boolean;
  automation: boolean;
}

export interface AnalyticsPrivacyConfig {
  enabled: boolean;
  anonymization: boolean;
  consent: boolean;
  retention: number;
}

export interface AnalyticsIntegrationConfig {
  enabled: boolean;
  providers: string[];
  webhooks: boolean;
  api: boolean;
}

// Accessibility Features
export interface AccessibilityFeatures {
  screenReader: ScreenReaderConfig;
  keyboard: KeyboardConfig;
  color: ColorConfig;
  motion: MotionConfig;
  font: FontConfig;
}

export interface ScreenReaderConfig {
  enabled: boolean;
  labels: boolean;
  hints: boolean;
  order: boolean;
}

export interface KeyboardConfig {
  enabled: boolean;
  navigation: boolean;
  shortcuts: boolean;
  focus: boolean;
}

export interface ColorConfig {
  enabled: boolean;
  contrast: boolean;
  themes: string[];
  indicators: boolean;
}

export interface MotionConfig {
  enabled: boolean;
  reduce: boolean;
  autoplay: boolean;
  transitions: boolean;
}

export interface FontConfig {
  enabled: boolean;
  sizes: number[];
  families: string[];
  scaling: boolean;
}

// Experimental Features
export interface ExperimentalFeatures {
  features: ExperimentalFeature[];
  testing: ExperimentalTestingConfig;
  rollout: ExperimentalRolloutConfig;
  monitoring: ExperimentalMonitoringConfig;
}

export interface ExperimentalFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  percentage: number;
  config?: Record<string, any>;
}

export interface ExperimentalTestingConfig {
  enabled: boolean;
  a_b: boolean;
  multivariate: boolean;
  userGroups: string[];
}

export interface ExperimentalRolloutConfig {
  enabled: boolean;
  stages: RolloutStage[];
  monitoring: boolean;
  rollback: boolean;
}

export interface RolloutStage {
  name: string;
  percentage: number;
  duration: number;
  conditions: string[];
}

export interface ExperimentalMonitoringConfig {
  enabled: boolean;
  metrics: string[];
  alerts: boolean;
  dashboards: boolean;
}

// Platform Features
export interface PlatformFeatures {
  web: WebPlatformConfig;
  mobile: MobilePlatformConfig;
  desktop: DesktopPlatformConfig;
  api: APIPlatformConfig;
  integrations: PlatformIntegrationConfig;
}

export interface WebPlatformConfig {
  enabled: boolean;
  pwa: boolean;
  responsive: boolean;
  browsers: string[];
}

export interface MobilePlatformConfig {
  enabled: boolean;
  ios: boolean;
  android: boolean;
  reactNative: boolean;
  flutter: boolean;
}

export interface DesktopPlatformConfig {
  enabled: boolean;
  windows: boolean;
  mac: boolean;
  linux: boolean;
  electron: boolean;
}

export interface APIPlatformConfig {
  enabled: boolean;
  version: string;
  rateLimit: number;
  documentation: boolean;
}

export interface PlatformIntegrationConfig {
  enabled: boolean;
  webhooks: boolean;
  oauth: boolean;
  sso: boolean;
}

// Integration Features
export interface IntegrationFeatures {
  social: SocialIntegrationConfig;
  payment: PaymentIntegrationConfig;
  communication: CommunicationIntegrationConfig;
  analytics: AnalyticsIntegrationConfig;
  storage: StorageIntegrationConfig;
}

export interface SocialIntegrationConfig {
  enabled: boolean;
  providers: string[];
  sharing: boolean;
  login: boolean;
}

export interface PaymentIntegrationConfig {
  enabled: boolean;
  providers: string[];
  currencies: string[];
  methods: string[];
}

export interface CommunicationIntegrationConfig {
  enabled: boolean;
  providers: string[];
  sms: boolean;
  email: boolean;
}

export interface AnalyticsIntegrationConfig {
  enabled: boolean;
  providers: string[];
  tracking: boolean;
  reporting: boolean;
}

export interface StorageIntegrationConfig {
  enabled: boolean;
  providers: string[];
  cdn: boolean;
  backup: boolean;
}

// Advanced Features
export interface AdvancedFeatures {
  performance: PerformanceConfig;
  scalability: ScalabilityConfig;
  reliability: ReliabilityConfig;
  monitoring: AdvancedMonitoringConfig;
  automation: AutomationConfig;
}

export interface PerformanceConfig {
  enabled: boolean;
  caching: boolean;
  optimization: boolean;
  lazyLoading: boolean;
}

export interface ScalabilityConfig {
  enabled: boolean;
  loadBalancing: boolean;
  sharding: boolean;
  replication: boolean;
}

export interface ReliabilityConfig {
  enabled: boolean;
  redundancy: boolean;
  failover: boolean;
  backup: boolean;
}

export interface AdvancedMonitoringConfig {
  enabled: boolean;
  metrics: boolean;
  tracing: boolean;
  profiling: boolean;
}

export interface AutomationConfig {
  enabled: boolean;
  ci_cd: boolean;
  deployment: boolean;
  testing: boolean;
}

// Feature Toggle System
export interface FeatureToggle {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  variant?: string;
  rolloutPercentage?: number; // 0-100
  conditions?: ToggleCondition[];
  experiments?: ExperimentConfig[];
  metadata?: ToggleMetadata;
}

export interface ToggleCondition {
  type:
    | "user"
    | "segment"
    | "location"
    | "device"
    | "version"
    | "time"
    | "custom";
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "in"
    | "not_in"
    | "greater_than"
    | "less_than"
    | "contains";
  value: any;
}

export interface ExperimentConfig {
  name: string;
  variants: ExperimentVariant[];
  traffic: number; // 0-100
  objectives: string[];
  duration?: number; // days
  status: "draft" | "running" | "completed" | "paused";
}

export interface ExperimentVariant {
  name: string;
  weight: number; // 0-100
  config: Record<string, any>;
}

export interface ToggleMetadata {
  owner: string;
  team: string;
  created: string;
  updated: string;
  tags: string[];
  dependencies: string[];
  impacts: string[];
}

// Feature Flag Provider Interface
export interface FeatureFlagProvider {
  isEnabled(key: string, context?: FeatureContext): boolean;
  getVariant(key: string, context?: FeatureContext): string | undefined;
  getConfig(
    key: string,
    context?: FeatureContext
  ): Record<string, any> | undefined;
  getAllFlags(context?: FeatureContext): Record<string, boolean>;
  track(key: string, event: string, properties?: Record<string, any>): void;
}

export interface FeatureContext {
  userId?: string;
  sessionId?: string;
  deviceId?: string;
  platform?: string;
  version?: string;
  location?: string;
  segment?: string;
  experiments?: string[];
  custom?: Record<string, any>;
}

// Runtime Feature Configuration
export interface RuntimeFeatureConfig {
  provider: FeatureFlagProvider;
  cache: boolean;
  cacheTTL: number; // seconds
  fallbackToDefaults: boolean;
  telemetry: boolean;
  refreshInterval: number; // seconds
  errorHandling: "silent" | "log" | "throw";
}

export default FeaturesConfig;
