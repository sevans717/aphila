/**
 * App Configuration
 * Defines application-wide configuration, settings, and constants
 */

// Application Configuration
export interface AppConfig {
  app: AppInfo;
  build: BuildInfo;
  environment: EnvironmentConfig;
  features: FeatureFlags;
  performance: PerformanceConfig;
  security: AppSecurityConfig;
  ui: UIConfig;
  analytics: AnalyticsConfig;
  notifications: NotificationConfig;
  storage: AppStorageConfig;
  network: NetworkConfig;
  accessibility: AccessibilityConfig;
  localization: LocalizationConfig;
  debugging: DebuggingConfig;
  compliance: ComplianceConfig;
}

// App Information
export interface AppInfo {
  name: string;
  displayName: string;
  version: string;
  buildNumber: string;
  bundleId: string;
  description: string;
  author: string;
  website: string;
  supportEmail: string;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  appStoreUrl?: string;
  playStoreUrl?: string;
  minimumOSVersion: PlatformVersions;
  targetSDK: PlatformVersions;
}

export interface PlatformVersions {
  ios: string;
  android: string;
  web?: string;
}

// Build Information
export interface BuildInfo {
  buildDate: string;
  buildNumber: string;
  gitCommit: string;
  gitBranch: string;
  buildEnvironment: "development" | "staging" | "production";
  buildType: "debug" | "release";
  bundleAnalyzer: boolean;
  sourceMap: boolean;
  minified: boolean;
  obfuscated: boolean;
}

// Environment Configuration
export interface EnvironmentConfig {
  name: "development" | "staging" | "production";
  apiBaseUrl: string;
  wsBaseUrl: string;
  cdnBaseUrl: string;
  assetsBaseUrl: string;
  deepLinkScheme: string;
  appScheme: string;
  universalLinkDomain?: string;
  variables: Record<string, string | number | boolean>;
  secrets: Record<string, string>;
}

// Feature Flags
export interface FeatureFlags {
  authentication: AuthFeatures;
  social: SocialFeatures;
  matching: MatchingFeatures;
  messaging: MessagingFeatures;
  media: MediaFeatures;
  community: CommunityFeatures;
  monetization: MonetizationFeatures;
  gamification: GamificationFeatures;
  ai: AIFeatures;
  experimental: ExperimentalFeatures;
}

export interface AuthFeatures {
  socialLogin: boolean;
  biometricAuth: boolean;
  twoFactorAuth: boolean;
  passwordlessLogin: boolean;
  guestMode: boolean;
  accountDeletion: boolean;
  emailVerification: boolean;
  phoneVerification: boolean;
}

export interface SocialFeatures {
  facebookLogin: boolean;
  googleLogin: boolean;
  appleLogin: boolean;
  twitterLogin: boolean;
  linkedinLogin: boolean;
  instagramIntegration: boolean;
  spotifyIntegration: boolean;
  socialSharing: boolean;
}

export interface MatchingFeatures {
  swipeCards: boolean;
  advancedFilters: boolean;
  boostProfile: boolean;
  superLikes: boolean;
  rewind: boolean;
  passportMode: boolean;
  incognitoMode: boolean;
  readReceipts: boolean;
  aiRecommendations: boolean;
}

export interface MessagingFeatures {
  textMessages: boolean;
  mediaMessages: boolean;
  voiceMessages: boolean;
  videoMessages: boolean;
  voiceCalls: boolean;
  videoCalls: boolean;
  groupChats: boolean;
  messageReactions: boolean;
  messageThreads: boolean;
  messageEncryption: boolean;
  messageTranslation: boolean;
  typingIndicators: boolean;
  onlineStatus: boolean;
  messageScheduling: boolean;
}

export interface MediaFeatures {
  photoUpload: boolean;
  videoUpload: boolean;
  photoFilters: boolean;
  videoFilters: boolean;
  storiesMode: boolean;
  liveStreaming: boolean;
  screenshotDetection: boolean;
  mediaCompression: boolean;
  mediaBackup: boolean;
  mediaDownload: boolean;
}

export interface CommunityFeatures {
  groups: boolean;
  events: boolean;
  forums: boolean;
  polls: boolean;
  contests: boolean;
  leaderboards: boolean;
  achievements: boolean;
  userReviews: boolean;
  mentorship: boolean;
  networking: boolean;
}

export interface MonetizationFeatures {
  premiumSubscription: boolean;
  inAppPurchases: boolean;
  virtualGifts: boolean;
  paidFeatures: boolean;
  advertisements: boolean;
  referralProgram: boolean;
  loyaltyProgram: boolean;
  affiliateProgram: boolean;
}

export interface GamificationFeatures {
  achievements: boolean;
  badges: boolean;
  points: boolean;
  levels: boolean;
  streaks: boolean;
  challenges: boolean;
  rewards: boolean;
  competitions: boolean;
  socialChallenges: boolean;
}

export interface AIFeatures {
  smartRecommendations: boolean;
  chatbotSupport: boolean;
  contentModeration: boolean;
  imageRecognition: boolean;
  sentimentAnalysis: boolean;
  languageDetection: boolean;
  translationService: boolean;
  personalizedContent: boolean;
  predictiveAnalytics: boolean;
}

export interface ExperimentalFeatures {
  betaTesting: boolean;
  alphaFeatures: boolean;
  experimentTracking: boolean;
  featureToggling: boolean;
  abTesting: boolean;
  canaryReleases: boolean;
  rolloutStrategy: boolean;
}

// Performance Configuration
export interface PerformanceConfig {
  caching: CachingConfig;
  prefetching: PrefetchingConfig;
  lazyLoading: LazyLoadingConfig;
  optimization: OptimizationConfig;
  monitoring: PerformanceMonitoringConfig;
  limits: PerformanceLimits;
}

export interface CachingConfig {
  enabled: boolean;
  strategy: "memory" | "disk" | "hybrid";
  maxMemorySize: number; // MB
  maxDiskSize: number; // MB
  defaultTTL: number; // seconds
  preloadCache: boolean;
  cacheWarmup: boolean;
}

export interface PrefetchingConfig {
  enabled: boolean;
  strategy: "aggressive" | "conservative" | "adaptive";
  prefetchDistance: number; // items ahead to prefetch
  prefetchOnIdle: boolean;
  prefetchOnWifi: boolean;
  prefetchImages: boolean;
  prefetchVideos: boolean;
}

export interface LazyLoadingConfig {
  enabled: boolean;
  threshold: number; // pixels from viewport
  fadeInDuration: number; // ms
  placeholderColor: string;
  errorFallback: string;
  retryAttempts: number;
}

export interface OptimizationConfig {
  imageOptimization: ImageOptimizationConfig;
  bundleOptimization: BundleOptimizationConfig;
  renderOptimization: RenderOptimizationConfig;
  networkOptimization: NetworkOptimizationConfig;
}

export interface ImageOptimizationConfig {
  enabled: boolean;
  quality: number; // 0-100
  format: "webp" | "jpeg" | "png" | "auto";
  sizes: ImageSize[];
  placeholderType: "blur" | "solid" | "skeleton" | "none";
}

export interface ImageSize {
  name: string;
  width: number;
  height?: number;
  quality?: number;
}

export interface BundleOptimizationConfig {
  enabled: boolean;
  splitChunks: boolean;
  treeShaking: boolean;
  minification: boolean;
  compression: boolean;
  codeElimination: boolean;
}

export interface RenderOptimizationConfig {
  enabled: boolean;
  virtualization: boolean;
  memoization: boolean;
  shouldComponentUpdate: boolean;
  pureComponents: boolean;
  lazyComponents: boolean;
}

export interface NetworkOptimizationConfig {
  enabled: boolean;
  requestBatching: boolean;
  requestDeduplication: boolean;
  compression: boolean;
  keepAlive: boolean;
  http2Push: boolean;
}

export interface PerformanceMonitoringConfig {
  enabled: boolean;
  metricsCollection: boolean;
  performanceMarks: boolean;
  memoryMonitoring: boolean;
  fpsMonitoring: boolean;
  crashReporting: boolean;
  anrDetection: boolean; // Android Not Responding
}

export interface PerformanceLimits {
  maxMemoryUsage: number; // MB
  maxCpuUsage: number; // percentage
  maxNetworkRequests: number; // per minute
  maxCacheSize: number; // MB
  maxImageSize: number; // MB
  maxVideoSize: number; // MB
  maxFileSize: number; // MB
}

// Security Configuration
export interface AppSecurityConfig {
  encryption: EncryptionConfig;
  authentication: SecurityAuthConfig;
  dataProtection: DataProtectionConfig;
  networkSecurity: NetworkSecurityConfig;
  deviceSecurity: DeviceSecurityConfig;
  compliance: SecurityComplianceConfig;
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: "AES-256-GCM" | "ChaCha20-Poly1305";
  keyDerivation: "PBKDF2" | "scrypt" | "Argon2";
  saltRounds: number;
  keyRotation: boolean;
  keyRotationInterval: number; // days
}

export interface SecurityAuthConfig {
  sessionTimeout: number; // minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  passwordPolicy: PasswordPolicy;
  mfaEnforcement: MFAEnforcementConfig;
}

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  preventCommon: boolean;
  preventReuse: number; // last N passwords
  expirationDays?: number;
}

export interface MFAEnforcementConfig {
  required: boolean;
  gracePeriod: number; // days
  allowedMethods: string[];
  backupCodes: boolean;
}

export interface DataProtectionConfig {
  encryptAtRest: boolean;
  encryptInTransit: boolean;
  dataClassification: boolean;
  dlpEnabled: boolean; // Data Loss Prevention
  piiDetection: boolean;
  dataRetention: DataRetentionConfig;
}

export interface DataRetentionConfig {
  enabled: boolean;
  policies: RetentionPolicy[];
  autoCleanup: boolean;
  userControlled: boolean;
}

export interface RetentionPolicy {
  dataType: string;
  retentionPeriod: number; // days
  archivalPeriod?: number; // days
  deletionMethod: "soft" | "hard" | "anonymize";
}

export interface NetworkSecurityConfig {
  certificatePinning: boolean;
  hsts: boolean; // HTTP Strict Transport Security
  certificateTransparency: boolean;
  allowInsecureConnections: boolean;
  trustedDomains: string[];
  blockedDomains: string[];
}

export interface DeviceSecurityConfig {
  jailbreakDetection: boolean;
  debuggerDetection: boolean;
  emulatorDetection: boolean;
  hookDetection: boolean;
  screenRecordingDetection: boolean;
  screenshotBlocking: boolean;
  appIntegrityCheck: boolean;
}

export interface SecurityComplianceConfig {
  gdprCompliant: boolean;
  ccpaCompliant: boolean;
  coppaCompliant: boolean;
  hipaaCompliant: boolean;
  sox404Compliant: boolean;
  iso27001Compliant: boolean;
  auditLogging: boolean;
  rightToBeforgotten: boolean;
  consentManagement: boolean;
}

// UI Configuration
export interface UIConfig {
  theme: UIThemeConfig;
  layout: UILayoutConfig;
  animation: UIAnimationConfig;
  typography: TypographyConfig;
  colors: ColorConfig;
  spacing: SpacingConfig;
  components: ComponentConfig;
}

export interface UIThemeConfig {
  default: "light" | "dark" | "auto";
  allowUserChange: boolean;
  systemSync: boolean;
  themes: ThemeDefinition[];
}

export interface ThemeDefinition {
  id: string;
  name: string;
  colors: Record<string, string>;
  fonts: Record<string, string>;
  spacing: Record<string, number>;
}

export interface UILayoutConfig {
  orientation: "portrait" | "landscape" | "auto";
  safeArea: boolean;
  statusBar: StatusBarConfig;
  navigationBar: NavigationBarConfig;
  tabBar: TabBarConfig;
}

export interface StatusBarConfig {
  style: "default" | "light" | "dark";
  hidden: boolean;
  translucent: boolean;
  animated: boolean;
}

export interface NavigationBarConfig {
  style: "default" | "compact" | "large";
  tintColor: string;
  backgroundColor: string;
  titleColor: string;
  backButtonEnabled: boolean;
}

export interface TabBarConfig {
  style: "default" | "compact";
  position: "bottom" | "top";
  backgroundColor: string;
  tintColor: string;
  inactiveTintColor: string;
  showLabels: boolean;
  showBadges: boolean;
}

export interface UIAnimationConfig {
  enabled: boolean;
  duration: AnimationDurations;
  easing: AnimationEasing;
  transitions: TransitionConfig;
  gestures: GestureConfig;
}

export interface AnimationDurations {
  fast: number; // ms
  normal: number; // ms
  slow: number; // ms
  pageTransition: number; // ms
  modalTransition: number; // ms
}

export interface AnimationEasing {
  linear: string;
  easeIn: string;
  easeOut: string;
  easeInOut: string;
  spring: string;
  bounce: string;
}

export interface TransitionConfig {
  pageTransition: string;
  modalTransition: string;
  slideTransition: string;
  fadeTransition: string;
  scaleTransition: string;
}

export interface GestureConfig {
  swipeGestures: boolean;
  pinchGestures: boolean;
  longPressGestures: boolean;
  doubleTapGestures: boolean;
  swipeThreshold: number; // pixels
  longPressDelay: number; // ms
}

export interface TypographyConfig {
  fontFamily: FontFamilyConfig;
  fontSizes: FontSizeConfig;
  fontWeights: FontWeightConfig;
  lineHeights: LineHeightConfig;
  letterSpacing: LetterSpacingConfig;
}

export interface FontFamilyConfig {
  primary: string;
  secondary?: string;
  monospace: string;
  system: boolean;
}

export interface FontSizeConfig {
  xs: number;
  sm: number;
  base: number;
  lg: number;
  xl: number;
  "2xl": number;
  "3xl": number;
  "4xl": number;
}

export interface FontWeightConfig {
  thin: number;
  light: number;
  normal: number;
  medium: number;
  semibold: number;
  bold: number;
  extrabold: number;
  black: number;
}

export interface LineHeightConfig {
  tight: number;
  normal: number;
  relaxed: number;
  loose: number;
}

export interface LetterSpacingConfig {
  tight: number;
  normal: number;
  wide: number;
}

export interface ColorConfig {
  primary: ColorPalette;
  secondary: ColorPalette;
  accent: ColorPalette;
  neutral: ColorPalette;
  success: ColorPalette;
  warning: ColorPalette;
  error: ColorPalette;
  info: ColorPalette;
}

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface SpacingConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  "2xl": number;
  "3xl": number;
  "4xl": number;
}

export interface ComponentConfig {
  buttons: ButtonConfig;
  inputs: InputConfig;
  cards: CardConfig;
  modals: ModalConfig;
  lists: ListConfig;
}

export interface ButtonConfig {
  borderRadius: number;
  minHeight: number;
  paddingHorizontal: number;
  paddingVertical: number;
  fontSize: number;
  fontWeight: string;
}

export interface InputConfig {
  borderRadius: number;
  minHeight: number;
  paddingHorizontal: number;
  paddingVertical: number;
  fontSize: number;
  borderWidth: number;
}

export interface CardConfig {
  borderRadius: number;
  padding: number;
  margin: number;
  elevation: number;
  shadowOpacity: number;
}

export interface ModalConfig {
  backdropOpacity: number;
  animationType: "slide" | "fade" | "none";
  presentationStyle:
    | "fullScreen"
    | "pageSheet"
    | "formSheet"
    | "overFullScreen";
}

export interface ListConfig {
  itemSeparatorHeight: number;
  refreshControlColor: string;
  emptyStateEnabled: boolean;
  virtualization: boolean;
  getItemLayout: boolean;
}

// Analytics Configuration
export interface AnalyticsConfig {
  enabled: boolean;
  providers: AnalyticsProvider[];
  events: EventTrackingConfig;
  userProperties: UserPropertyConfig;
  privacy: AnalyticsPrivacyConfig;
}

export interface AnalyticsProvider {
  name: string;
  enabled: boolean;
  config: Record<string, any>;
  events: string[];
  sampling?: number; // 0-1
}

export interface EventTrackingConfig {
  autoTrack: AutoTrackingConfig;
  customEvents: CustomEventConfig[];
  sessionTracking: SessionTrackingConfig;
}

export interface AutoTrackingConfig {
  screenViews: boolean;
  buttonClicks: boolean;
  formSubmissions: boolean;
  navigationEvents: boolean;
  errorEvents: boolean;
  performanceEvents: boolean;
}

export interface CustomEventConfig {
  name: string;
  properties: string[];
  conditions?: EventCondition[];
  sampling?: number; // 0-1
}

export interface EventCondition {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
  value: any;
}

export interface SessionTrackingConfig {
  enabled: boolean;
  timeout: number; // minutes
  trackDuration: boolean;
  trackEngagement: boolean;
}

export interface UserPropertyConfig {
  autoSet: string[];
  customProperties: string[];
  piiHandling: "hash" | "encrypt" | "exclude";
}

export interface AnalyticsPrivacyConfig {
  optOut: boolean;
  dataRetention: number; // days
  anonymization: boolean;
  consentRequired: boolean;
  cookieConsent: boolean;
}

// Notification Configuration
export interface NotificationConfig {
  push: PushNotificationConfig;
  local: LocalNotificationConfig;
  inApp: InAppNotificationConfig;
  email: EmailNotificationConfig;
}

export interface PushNotificationConfig {
  enabled: boolean;
  providers: string[];
  sound: boolean;
  badge: boolean;
  alert: boolean;
  categories: NotificationCategory[];
}

export interface LocalNotificationConfig {
  enabled: boolean;
  categories: NotificationCategory[];
  scheduling: boolean;
  recurring: boolean;
  actions: NotificationAction[];
}

export interface InAppNotificationConfig {
  enabled: boolean;
  position: "top" | "bottom" | "center";
  duration: number; // ms
  interactive: boolean;
  sound: boolean;
}

export interface EmailNotificationConfig {
  enabled: boolean;
  templates: string[];
  frequency: "immediate" | "hourly" | "daily" | "weekly";
  unsubscribe: boolean;
}

export interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  actions: NotificationAction[];
  sound?: string;
  critical?: boolean;
}

export interface NotificationAction {
  id: string;
  title: string;
  type: "foreground" | "background" | "destructive";
  authenticationRequired?: boolean;
  textInput?: boolean;
}

// Storage Configuration
export interface AppStorageConfig {
  defaultStorage: "async" | "secure" | "mmkv";
  encryption: boolean;
  compression: boolean;
  quota: StorageQuota;
  cleanup: StorageCleanupConfig;
}

export interface StorageQuota {
  maxSize: number; // MB
  warningThreshold: number; // percentage
  errorThreshold: number; // percentage
  autoCleanup: boolean;
}

export interface StorageCleanupConfig {
  enabled: boolean;
  strategy: "lru" | "fifo" | "size" | "ttl";
  interval: number; // hours
  batchSize: number;
}

// Network Configuration
export interface NetworkConfig {
  timeout: NetworkTimeouts;
  retry: NetworkRetryConfig;
  caching: NetworkCachingConfig;
  offline: OfflineConfig;
}

export interface NetworkTimeouts {
  request: number; // ms
  response: number; // ms
  upload: number; // ms
  download: number; // ms
}

export interface NetworkRetryConfig {
  enabled: boolean;
  maxAttempts: number;
  baseDelay: number; // ms
  maxDelay: number; // ms
  backoffStrategy: "linear" | "exponential";
  retryableStatuses: number[];
}

export interface NetworkCachingConfig {
  enabled: boolean;
  maxAge: number; // seconds
  maxSize: number; // MB
  strategy: "cache_first" | "network_first" | "stale_while_revalidate";
}

export interface OfflineConfig {
  enabled: boolean;
  storage: number; // MB
  syncOnConnect: boolean;
  queueSize: number;
}

// Accessibility Configuration
export interface AccessibilityConfig {
  enabled: boolean;
  announcements: boolean;
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  voiceOver: boolean;
  talkBack: boolean;
  minimumTouchTarget: number; // dp
  focusIndicator: boolean;
}

// Localization Configuration
export interface LocalizationConfig {
  enabled: boolean;
  defaultLocale: string;
  fallbackLocale: string;
  supportedLocales: string[];
  rtlSupport: boolean;
  numberFormat: boolean;
  dateFormat: boolean;
  currencyFormat: boolean;
  pluralization: boolean;
  interpolation: boolean;
  namespaces: string[];
  loadPath: string;
  detection: LocaleDetectionConfig;
}

export interface LocaleDetectionConfig {
  order: ("localStorage" | "navigator" | "htmlTag" | "path" | "subdomain")[];
  lookupLocalStorage?: string;
  lookupFromPathIndex?: number;
  lookupFromSubdomainIndex?: number;
  caches?: string[];
}

// Debugging Configuration
export interface DebuggingConfig {
  enabled: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
  remoteLogging: boolean;
  crashReporting: boolean;
  performanceMonitoring: boolean;
  networkLogging: boolean;
  reactotron: boolean;
  flipper: boolean;
  devMenu: boolean;
  inspectorEnabled: boolean;
  hotReload: boolean;
  liveReload: boolean;
}

// Compliance Configuration
export interface ComplianceConfig {
  dataPrivacy: DataPrivacyConfig;
  accessibility: ComplianceAccessibilityConfig;
  security: ComplianceSecurityConfig;
  advertising: AdvertisingComplianceConfig;
}

export interface DataPrivacyConfig {
  gdprCompliance: boolean;
  ccpaCompliance: boolean;
  coppaCompliance: boolean;
  consentManagement: boolean;
  dataProcessingPurposes: string[];
  dataRetentionPolicies: string[];
  rightToBeForgotten: boolean;
  dataPortability: boolean;
}

export interface ComplianceAccessibilityConfig {
  wcagCompliance: "A" | "AA" | "AAA";
  section508Compliance: boolean;
  adaCompliance: boolean;
  accessibilityTesting: boolean;
}

export interface ComplianceSecurityConfig {
  owasp: boolean;
  nistFramework: boolean;
  iso27001: boolean;
  sox: boolean;
  pciDss: boolean;
  hipaa: boolean;
  ferpa: boolean;
}

export interface AdvertisingComplianceConfig {
  coppaCompliance: boolean;
  gdprConsent: boolean;
  ccpaOptOut: boolean;
  iosTrackingTransparency: boolean;
  limitedDataUse: boolean;
}

// Build-time configuration constants
export const BUILD_CONFIG = {
  DEVELOPMENT: __DEV__,
  PRODUCTION: !__DEV__,
  VERSION: "1.0.0", // This would be injected at build time
  BUILD_NUMBER: "1", // This would be injected at build time
  BUNDLE_ID: "com.sav3.app", // This would be injected at build time
} as const;

// Runtime configuration constants
export const RUNTIME_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  MAX_RETRY_ATTEMPTS: 3,
  CACHE_TTL: 300, // 5 minutes
  SESSION_TIMEOUT: 30 * 60, // 30 minutes
} as const;

// Type for complete configuration
export interface CompleteAppConfig extends AppConfig {
  build: BuildInfo & typeof BUILD_CONFIG;
  runtime: typeof RUNTIME_CONFIG;
}
