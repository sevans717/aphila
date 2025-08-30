/**
 * Preferences Types
 * Defines user preferences, settings, privacy controls, and customization options
 */

export interface UserPreferences {
  userId: string;
  profile: ProfilePreferences;
  privacy: PrivacyPreferences;
  notifications: NotificationPreferences;
  matching: MatchingPreferences;
  communication: CommunicationPreferences;
  display: DisplayPreferences;
  content: ContentPreferences;
  location: LocationPreferences;
  subscription: SubscriptionPreferences;
  accessibility: AccessibilityPreferences;
  advanced: AdvancedPreferences;
  createdAt: string;
  updatedAt: string;
}

// Profile Preferences
export interface ProfilePreferences {
  visibility: ProfileVisibility;
  showAge: boolean;
  showDistance: boolean;
  showLastActive: boolean;
  showOnlineStatus: boolean;
  showCommonConnections: boolean;
  showEducation: boolean;
  showWork: boolean;
  showInterests: boolean;
  autoVerification: boolean;
  profilePhotoPrivacy: PhotoPrivacy;
  incognito: IncognitoSettings;
}

export type ProfileVisibility =
  | "public"
  | "matches_only"
  | "friends_only"
  | "private";
export type PhotoPrivacy =
  | "public"
  | "matches_only"
  | "premium_only"
  | "private";

export interface IncognitoSettings {
  enabled: boolean;
  hideFromSearch: boolean;
  hideProfile: boolean;
  anonymousViewing: boolean;
}

// Privacy Preferences
export interface PrivacyPreferences {
  dataCollection: DataCollectionPreferences;
  sharing: DataSharingPreferences;
  visibility: VisibilityPreferences;
  blocking: BlockingPreferences;
  reporting: ReportingPreferences;
  deleteAccount: DeleteAccountSettings;
}

export interface DataCollectionPreferences {
  analytics: boolean;
  performance: boolean;
  crashReporting: boolean;
  locationTracking: boolean;
  behaviorTracking: boolean;
  advertisingData: boolean;
  thirdPartyData: boolean;
  biometricData: boolean;
}

export interface DataSharingPreferences {
  partnerCompanies: boolean;
  advertisers: boolean;
  analytics: boolean;
  researchPurposes: boolean;
  lawEnforcement: boolean;
  aggregatedData: boolean;
  anonymizedData: boolean;
}

export interface VisibilityPreferences {
  profileSearchable: boolean;
  showInRecommendations: boolean;
  showInNearby: boolean;
  showInDirectory: boolean;
  allowScreenshots: boolean;
  watermarkPhotos: boolean;
}

export interface BlockingPreferences {
  autoBlock: AutoBlockSettings;
  reportAndBlock: boolean;
  blockDuration: BlockDuration;
  blockNotifications: boolean;
}

export interface AutoBlockSettings {
  enabled: boolean;
  criteria: BlockCriteria[];
  whitelist: string[];
}

export interface BlockCriteria {
  type: "age" | "distance" | "keywords" | "behavior" | "reports";
  condition: "less_than" | "greater_than" | "equals" | "contains";
  value: any;
  action: "block" | "hide" | "warn";
}

export type BlockDuration = "temporary" | "permanent" | "custom";

export interface ReportingPreferences {
  anonymousReporting: boolean;
  autoReportSuspicious: boolean;
  shareReportData: boolean;
  followUpContact: boolean;
}

export interface DeleteAccountSettings {
  dataRetention: DataRetentionSettings;
  downloadData: boolean;
  anonymizeData: boolean;
  notifyContacts: boolean;
}

export interface DataRetentionSettings {
  messages: RetentionPeriod;
  photos: RetentionPeriod;
  matches: RetentionPeriod;
  profile: RetentionPeriod;
  analytics: RetentionPeriod;
}

export type RetentionPeriod =
  | "immediate"
  | "30_days"
  | "90_days"
  | "1_year"
  | "indefinite";

// Notification Preferences
export interface NotificationPreferences {
  push: PushNotificationPreferences;
  email: EmailNotificationPreferences;
  sms: SMSNotificationPreferences;
  inApp: InAppNotificationPreferences;
  quietHours: QuietHoursSettings;
  frequency: NotificationFrequency;
}

export interface PushNotificationPreferences {
  enabled: boolean;
  matches: boolean;
  messages: boolean;
  likes: boolean;
  superLikes: boolean;
  profileVisits: boolean;
  events: boolean;
  promotions: boolean;
  reminders: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeCount: boolean;
}

export interface EmailNotificationPreferences {
  enabled: boolean;
  digest: DigestSettings;
  matches: boolean;
  messages: boolean;
  events: boolean;
  tips: boolean;
  promotions: boolean;
  surveys: boolean;
  newsletters: boolean;
}

export interface DigestSettings {
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly";
  time: string; // HH:MM format
  timezone: string;
}

export interface SMSNotificationPreferences {
  enabled: boolean;
  securityAlerts: boolean;
  importantUpdates: boolean;
  emergencyContact: boolean;
}

export interface InAppNotificationPreferences {
  enabled: boolean;
  banner: boolean;
  sound: boolean;
  vibration: boolean;
  duration: number; // seconds
  position: "top" | "bottom" | "center";
}

export interface QuietHoursSettings {
  enabled: boolean;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  timezone: string;
  days: number[]; // 0-6, Sunday = 0
  emergencyOverride: boolean;
}

export interface NotificationFrequency {
  immediate: string[];
  hourly: string[];
  daily: string[];
  weekly: string[];
  never: string[];
}

// Matching Preferences
export interface MatchingPreferences {
  criteria: MatchingCriteria;
  discovery: DiscoverySettings;
  filters: MatchingFilters;
  dealbreakers: Dealbreaker[];
  boost: BoostSettings;
  rewind: RewindSettings;
}

export interface MatchingCriteria {
  ageRange: AgeRange;
  maxDistance: number;
  genderPreference: GenderPreference[];
  lookingFor: RelationshipType[];
  education: EducationLevel[];
  occupation: string[];
  interests: string[];
  lifestyle: LifestylePreference[];
}

export interface AgeRange {
  min: number;
  max: number;
}

export type GenderPreference = "men" | "women" | "non_binary" | "all";

export type RelationshipType =
  | "casual_dating"
  | "serious_relationship"
  | "marriage"
  | "friendship"
  | "networking"
  | "hookup"
  | "not_sure";

export type EducationLevel =
  | "high_school"
  | "some_college"
  | "bachelors"
  | "masters"
  | "phd"
  | "trade_school"
  | "other";

export interface LifestylePreference {
  category: LifestyleCategory;
  importance: ImportanceLevel;
  values: string[];
}

export type LifestyleCategory =
  | "smoking"
  | "drinking"
  | "drugs"
  | "religion"
  | "politics"
  | "fitness"
  | "diet"
  | "pets"
  | "children"
  | "travel";

export type ImportanceLevel =
  | "not_important"
  | "somewhat_important"
  | "very_important"
  | "dealbreaker";

export interface DiscoverySettings {
  showRecentlyActive: boolean;
  showNewUsers: boolean;
  showPopularUsers: boolean;
  showNearbyUsers: boolean;
  includeGlobalStack: boolean;
  smartRecommendations: boolean;
}

export interface MatchingFilters {
  basic: BasicFilters;
  premium: PremiumFilters;
  advanced: AdvancedFilters;
}

export interface BasicFilters {
  age: AgeRange;
  distance: number;
  lastActive: number; // days
}

export interface PremiumFilters {
  education: EducationLevel[];
  occupation: string[];
  height: HeightRange;
  bodyType: string[];
  ethnicity: string[];
  religion: string[];
}

export interface HeightRange {
  min: number; // cm
  max: number; // cm
}

export interface AdvancedFilters {
  personality: PersonalityFilters;
  compatibility: CompatibilityFilters;
  verification: VerificationFilters;
  social: SocialFilters;
}

export interface PersonalityFilters {
  traits: PersonalityTrait[];
  types: PersonalityType[];
}

export interface PersonalityTrait {
  name: string;
  range: [number, number]; // 1-10 scale
  importance: ImportanceLevel;
}

export type PersonalityType =
  | "introvert"
  | "extrovert"
  | "ambivert"
  | "analytical"
  | "creative"
  | "adventurous"
  | "homebody";

export interface CompatibilityFilters {
  minimumScore: number; // 0-100
  factors: CompatibilityFactor[];
}

export interface CompatibilityFactor {
  name: string;
  weight: number; // 0-1
  enabled: boolean;
}

export interface VerificationFilters {
  phoneVerified: boolean;
  emailVerified: boolean;
  photoVerified: boolean;
  socialConnected: boolean;
  backgroundChecked: boolean;
}

export interface SocialFilters {
  mutualFriends: boolean;
  mutualInterests: boolean;
  mutualConnections: boolean;
  commonNetworks: boolean;
}

export interface Dealbreaker {
  category: LifestyleCategory;
  condition: "must_have" | "must_not_have" | "range";
  value: any;
  priority: number;
}

export interface BoostSettings {
  autoBoost: AutoBoostSettings;
  timing: BoostTiming;
  frequency: BoostFrequency;
}

export interface AutoBoostSettings {
  enabled: boolean;
  conditions: BoostCondition[];
  maxPerWeek: number;
}

export interface BoostCondition {
  type: "low_activity" | "peak_hours" | "special_events" | "custom";
  threshold?: number;
  priority: number;
}

export interface BoostTiming {
  preferredDays: number[]; // 0-6
  preferredHours: number[]; // 0-23
  timezone: string;
  avoidQuietHours: boolean;
}

export type BoostFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "manual"
  | "never";

export interface RewindSettings {
  autoSave: boolean;
  confirmBeforeUndo: boolean;
  maxRewinds: number;
  resetPeriod: "daily" | "weekly" | "monthly";
}

// Communication Preferences
export interface CommunicationPreferences {
  messaging: MessagingSettings;
  calls: CallSettings;
  language: LanguageSettings;
  translation: TranslationSettings;
}

export interface MessagingSettings {
  readReceipts: boolean;
  typingIndicators: boolean;
  onlineStatus: boolean;
  messageExpiration: MessageExpiration;
  mediaSharing: MediaSharingSettings;
  linkPreviews: boolean;
  autoReply: AutoReplySettings;
}

export interface MessageExpiration {
  enabled: boolean;
  defaultDuration: number; // hours
  allowRecipientExtension: boolean;
}

export interface MediaSharingSettings {
  photos: boolean;
  videos: boolean;
  audio: boolean;
  documents: boolean;
  location: boolean;
  contacts: boolean;
  maxFileSize: number; // MB
}

export interface AutoReplySettings {
  enabled: boolean;
  message: string;
  conditions: AutoReplyCondition[];
  schedule: AutoReplySchedule;
}

export interface AutoReplyCondition {
  type: "away" | "busy" | "offline" | "custom";
  duration: number; // minutes
}

export interface AutoReplySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
  days: number[];
  timezone: string;
}

export interface CallSettings {
  voiceCalls: boolean;
  videoCalls: boolean;
  screenSharing: boolean;
  recordCalls: boolean;
  callWaiting: boolean;
  missedCallNotifications: boolean;
  qualitySettings: CallQualitySettings;
}

export interface CallQualitySettings {
  preferredResolution: VideoResolution;
  autoAdjustQuality: boolean;
  dataUsageMode: "low" | "medium" | "high" | "unlimited";
  echoCanellation: boolean;
  noiseSuppression: boolean;
}

export interface VideoResolution {
  width: number;
  height: number;
  fps: number;
}

export interface LanguageSettings {
  primary: string;
  secondary?: string[];
  detectLanguage: boolean;
  showTranslation: boolean;
  translateIncoming: boolean;
  translateOutgoing: boolean;
}

export interface TranslationSettings {
  enabled: boolean;
  autoDetect: boolean;
  preferredServices: string[];
  confidence_threshold: number;
  cacheTranslations: boolean;
}

// Display Preferences
export interface DisplayPreferences {
  theme: ThemeSettings;
  layout: LayoutSettings;
  animation: AnimationSettings;
  cards: CardDisplaySettings;
  lists: ListDisplaySettings;
}

export interface ThemeSettings {
  mode: "light" | "dark" | "auto" | "custom";
  accentColor: string;
  customColors?: CustomColorScheme;
  systemSync: boolean;
}

export interface CustomColorScheme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  border: string;
  accent: string;
}

export interface LayoutSettings {
  density: "compact" | "comfortable" | "spacious";
  cardSize: "small" | "medium" | "large";
  navigation: NavigationStyle;
  toolbar: ToolbarSettings;
}

export type NavigationStyle =
  | "tabs"
  | "drawer"
  | "bottom_navigation"
  | "custom";

export interface ToolbarSettings {
  position: "top" | "bottom" | "floating";
  style: "minimal" | "standard" | "detailed";
  showLabels: boolean;
  showBadges: boolean;
}

export interface AnimationSettings {
  enabled: boolean;
  speed: "slow" | "normal" | "fast" | "off";
  effects: AnimationEffect[];
  reduceMotion: boolean;
}

export type AnimationEffect =
  | "page_transitions"
  | "card_animations"
  | "button_press"
  | "hover_effects"
  | "loading_spinners"
  | "parallax_scrolling";

export interface CardDisplaySettings {
  style: "standard" | "compact" | "detailed";
  showPreview: boolean;
  autoPlay: boolean;
  showIndicators: boolean;
  swipeGestures: SwipeGestureSettings;
}

export interface SwipeGestureSettings {
  enabled: boolean;
  sensitivity: number; // 1-10
  hapticFeedback: boolean;
  confirmActions: boolean;
}

export interface ListDisplaySettings {
  itemsPerPage: number;
  infiniteScroll: boolean;
  showThumbnails: boolean;
  groupBy: GroupingOption;
  sortBy: SortingOption;
}

export type GroupingOption =
  | "none"
  | "date"
  | "category"
  | "distance"
  | "activity";
export type SortingOption =
  | "newest"
  | "oldest"
  | "closest"
  | "most_active"
  | "random";

// Content Preferences
export interface ContentPreferences {
  filtering: ContentFiltering;
  recommendations: RecommendationSettings;
  feed: FeedSettings;
  search: SearchSettings;
}

export interface ContentFiltering {
  level: FilterLevel;
  categories: ContentCategory[];
  keywords: string[];
  customRules: ContentRule[];
  reportInapropriate: boolean;
}

export type FilterLevel = "off" | "low" | "medium" | "high" | "strict";

export interface ContentCategory {
  name: string;
  enabled: boolean;
  severity: "mild" | "moderate" | "severe";
}

export interface ContentRule {
  id: string;
  condition: string;
  action: "hide" | "warn" | "blur" | "report";
  priority: number;
}

export interface RecommendationSettings {
  algorithm: "collaborative" | "content_based" | "hybrid" | "manual";
  factors: RecommendationFactor[];
  diversity: number; // 0-1
  novelty: number; // 0-1
  recency: number; // 0-1
}

export interface RecommendationFactor {
  name: string;
  weight: number; // 0-1
  enabled: boolean;
}

export interface FeedSettings {
  algorithm: FeedAlgorithm;
  sources: FeedSource[];
  updateFrequency: UpdateFrequency;
  autoRefresh: boolean;
  showTimestamps: boolean;
}

export type FeedAlgorithm =
  | "chronological"
  | "relevance"
  | "engagement"
  | "mixed"
  | "custom";

export interface FeedSource {
  type: string;
  enabled: boolean;
  weight: number; // 0-1
  filters: string[];
}

export type UpdateFrequency =
  | "real_time"
  | "every_minute"
  | "every_5_minutes"
  | "every_15_minutes"
  | "manual";

export interface SearchSettings {
  suggestions: boolean;
  history: boolean;
  trending: boolean;
  autocomplete: boolean;
  typoTolerance: boolean;
  semanticSearch: boolean;
  filters: SearchFilter[];
}

export interface SearchFilter {
  name: string;
  type: "text" | "number" | "date" | "boolean" | "select";
  enabled: boolean;
  default?: any;
  options?: FilterOption[];
}

export interface FilterOption {
  label: string;
  value: any;
  count?: number;
}

// Location Preferences
export interface LocationPreferences {
  sharing: LocationSharing;
  accuracy: LocationAccuracy;
  services: LocationService[];
  privacy: LocationPrivacy;
}

export interface LocationSharing {
  enabled: boolean;
  precision: "exact" | "approximate" | "city" | "region" | "country";
  updateFrequency: LocationUpdateFrequency;
  shareWithMatches: boolean;
  shareInProfile: boolean;
}

export type LocationUpdateFrequency =
  | "real_time"
  | "hourly"
  | "daily"
  | "manual"
  | "never";

export type LocationAccuracy = "high" | "medium" | "low" | "battery_saving";

export interface LocationService {
  name: string;
  enabled: boolean;
  permissions: LocationPermission[];
}

export type LocationPermission =
  | "always"
  | "when_in_use"
  | "ask_every_time"
  | "never";

export interface LocationPrivacy {
  hideExactLocation: boolean;
  fakeLocation: boolean;
  vpnDetection: boolean;
  locationHistory: LocationHistorySettings;
}

export interface LocationHistorySettings {
  enabled: boolean;
  retention: number; // days
  shareWithApp: boolean;
  downloadable: boolean;
}

// Subscription Preferences
export interface SubscriptionPreferences {
  billing: BillingPreferences;
  renewals: RenewalPreferences;
  notifications: SubscriptionNotifications;
  features: FeaturePreferences;
}

export interface BillingPreferences {
  currency: string;
  paymentMethod: string;
  billingAddress: BillingAddress;
  invoiceDelivery: "email" | "app" | "both";
  autoRenew: boolean;
}

export interface BillingAddress {
  name: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface RenewalPreferences {
  autoRenew: boolean;
  reminderDays: number[];
  downgradeGracePeriod: number; // days
  cancelationSurvey: boolean;
}

export interface SubscriptionNotifications {
  renewalReminders: boolean;
  paymentFailures: boolean;
  upgrades: boolean;
  downgrades: boolean;
  cancellations: boolean;
  refunds: boolean;
}

export interface FeaturePreferences {
  priorities: FeaturePriority[];
  suggestions: boolean;
  betaProgram: boolean;
  usageAnalytics: boolean;
}

export interface FeaturePriority {
  feature: string;
  importance: ImportanceLevel;
  usage: "high" | "medium" | "low" | "none";
}

// Accessibility Preferences
export interface AccessibilityPreferences {
  visual: VisualAccessibility;
  motor: MotorAccessibility;
  cognitive: CognitiveAccessibility;
  hearing: HearingAccessibility;
  assistive: AssistiveTechnology;
}

export interface VisualAccessibility {
  largeText: boolean;
  highContrast: boolean;
  colorBlindSupport: ColorBlindSettings;
  screenReader: boolean;
  voiceOver: boolean;
  magnification: number; // 1-5
}

export interface ColorBlindSettings {
  enabled: boolean;
  type: "protanopia" | "deuteranopia" | "tritanopia" | "monochromacy";
  severity: "mild" | "moderate" | "severe";
}

export interface MotorAccessibility {
  oneHandedMode: boolean;
  gestureAlternatives: boolean;
  buttonSize: "small" | "medium" | "large" | "extra_large";
  touchAssistance: boolean;
  dwellControl: boolean;
  switchControl: boolean;
}

export interface CognitiveAccessibility {
  simplifiedInterface: boolean;
  reducedAnimations: boolean;
  focusIndicators: boolean;
  readingGuide: boolean;
  consistentNavigation: boolean;
  timeoutWarnings: boolean;
}

export interface HearingAccessibility {
  captions: boolean;
  visualAlerts: boolean;
  soundVisualization: boolean;
  hapticFeedback: boolean;
  tty: boolean;
  signLanguage: boolean;
}

export interface AssistiveTechnology {
  screenReader: string;
  voiceControl: boolean;
  eyeTracking: boolean;
  brailleDisplay: boolean;
  customKeyboard: boolean;
}

// Advanced Preferences
export interface AdvancedPreferences {
  developer: DeveloperSettings;
  experimental: ExperimentalFeatures;
  performance: PerformanceSettings;
  security: SecuritySettings;
  backup: BackupSettings;
}

export interface DeveloperSettings {
  debugMode: boolean;
  verboseLogging: boolean;
  showPerformanceMetrics: boolean;
  enableDevTools: boolean;
  apiTesting: boolean;
}

export interface ExperimentalFeatures {
  betaFeatures: boolean;
  features: ExperimentalFeature[];
  feedback: boolean;
  crashReporting: boolean;
}

export interface ExperimentalFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  riskLevel: "low" | "medium" | "high";
}

export interface PerformanceSettings {
  dataUsage: DataUsageSettings;
  battery: BatterySettings;
  memory: MemorySettings;
  network: NetworkSettings;
}

export interface DataUsageSettings {
  mode: "unlimited" | "standard" | "data_saver" | "custom";
  monthlyLimit?: number; // MB
  warnings: boolean;
  backgroundSync: boolean;
}

export interface BatterySettings {
  optimization: boolean;
  backgroundActivity: boolean;
  refreshFrequency: "normal" | "reduced" | "minimal";
  darkMode: boolean;
}

export interface MemorySettings {
  cacheSize: number; // MB
  preloadContent: boolean;
  compressionLevel: "none" | "low" | "medium" | "high";
  garbageCollection: "automatic" | "manual" | "aggressive";
}

export interface NetworkSettings {
  timeout: number; // seconds
  retries: number;
  compression: boolean;
  keepAlive: boolean;
  ipVersion: "ipv4" | "ipv6" | "dual_stack";
}

export interface SecuritySettings {
  twoFactor: TwoFactorSettings;
  biometrics: BiometricSettings;
  sessions: SessionSettings;
  deviceTrust: DeviceTrustSettings;
}

export interface TwoFactorSettings {
  enabled: boolean;
  method: "sms" | "app" | "email" | "hardware";
  backupCodes: boolean;
  requireForSensitive: boolean;
}

export interface BiometricSettings {
  enabled: boolean;
  types: BiometricType[];
  fallbackToPin: boolean;
  maxAttempts: number;
}

export type BiometricType = "fingerprint" | "face" | "voice" | "iris" | "palm";

export interface SessionSettings {
  timeout: number; // minutes
  multipleDevices: boolean;
  showActiveSessions: boolean;
  logoutOtherSessions: boolean;
}

export interface DeviceTrustSettings {
  rememberDevice: boolean;
  trustDuration: number; // days
  notifications: boolean;
  locationVerification: boolean;
}

export interface BackupSettings {
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly" | "manual";
  destination: "cloud" | "local" | "both";
  encryption: boolean;
  retention: number; // days
  verification: boolean;
}
