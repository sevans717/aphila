/**
 * Constants Configuration
 * Application-wide constants, configuration values, and enums
 */

// API Constants
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
  VERSION: "v1",
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  ENDPOINTS: {
    AUTH: "/auth",
    USERS: "/users",
    MATCHES: "/matches",
    MESSAGES: "/messages",
    MEDIA: "/media",
    COMMUNITY: "/community",
    NOTIFICATIONS: "/notifications",
    ANALYTICS: "/analytics",
    HEALTH: "/health",
  },
} as const;

// App Constants
export const APP_CONFIG = {
  NAME: "Sav3",
  VERSION: "1.0.0",
  BUILD: process.env.EXPO_PUBLIC_BUILD_NUMBER || "1",
  ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT || "development",
  DEEP_LINK_SCHEME: "sav3",
  BUNDLE_ID: "com.sav3.mobile",
  STORE_URL: {
    IOS: "https://apps.apple.com/app/sav3",
    ANDROID: "https://play.google.com/store/apps/details?id=com.sav3.mobile",
  },
  WEBSITE_URL: "https://aphila.io",
  SUPPORT_EMAIL: "support@aphila.io",
  PRIVACY_URL: "https://aphila.io/privacy",
  TERMS_URL: "https://aphila.io/terms",
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  // Authentication
  AUTH_TOKEN: "@sav3/auth_token",
  REFRESH_TOKEN: "@sav3/refresh_token",
  USER_SESSION: "@sav3/user_session",
  BIOMETRIC_ENABLED: "@sav3/biometric_enabled",

  // User Preferences
  THEME: "@sav3/theme",
  LANGUAGE: "@sav3/language",
  PUSH_NOTIFICATIONS: "@sav3/push_notifications",
  LOCATION_PERMISSIONS: "@sav3/location_permissions",

  // App State
  ONBOARDING_COMPLETED: "@sav3/onboarding_completed",
  LAST_SYNC: "@sav3/last_sync",
  OFFLINE_QUEUE: "@sav3/offline_queue",

  // Feature Flags
  FEATURE_FLAGS: "@sav3/feature_flags",
  EXPERIMENTS: "@sav3/experiments",

  // Cache
  USER_CACHE: "@sav3/user_cache",
  MATCHES_CACHE: "@sav3/matches_cache",
  MESSAGES_CACHE: "@sav3/messages_cache",
} as const;

// Screen Names
export const SCREEN_NAMES = {
  // Authentication
  SIGN_IN: "SignIn",
  SIGN_UP: "SignUp",
  FORGOT_PASSWORD: "ForgotPassword",
  RESET_PASSWORD: "ResetPassword",

  // Onboarding
  ONBOARDING: "Onboarding",
  PROFILE_SETUP: "ProfileSetup",
  PHOTO_UPLOAD: "PhotoUpload",
  PERMISSIONS: "Permissions",

  // Main Navigation
  INIT_HOME: "InitHome",
  MATCH: "Match",
  CATEGORY: "Category",
  MEDIA: "Media",
  HUB: "Hub",
  PROFILE: "Profile",

  // Match Sub-screens
  MATCH_MAIN: "MatchMain",
  MEET: "Meet",
  MESSAGE: "Message",

  // Category Sub-screens
  TILE_1: "Tile1",
  TILE_2: "Tile2",
  TILE_3: "Tile3",
  TILE_4: "Tile4",
  TILE_5: "Tile5",
  TILE_6: "Tile6",
  TILE_7: "Tile7",
  TILE_8: "Tile8",
  TILE_9: "Tile9",
  TILE_10: "Tile10",
  TILE_11: "Tile11",
  TILE_12: "Tile12",
  TILE_13: "Tile13",
  TILE_14: "Tile14",
  TILE_15: "Tile15",
  TILE_16: "Tile16",

  // Media Sub-screens
  CAMERA: "Camera",
  CONTENT: "Content",
  CREATE: "Create",

  // Hub Sub-screens
  CHAT_SPACE: "ChatSpace",
  BOOSTED: "Boosted",
  POPPED: "PoPpeD",

  // Profile Sub-screens
  PREFERENCES_SETTINGS: "PreferencesSettings",

  // Modal/Overlay screens
  USER_DETAIL: "UserDetail",
  CHAT_DETAIL: "ChatDetail",
  PHOTO_VIEWER: "PhotoViewer",
  VIDEO_PLAYER: "VideoPlayer",
  SETTINGS: "Settings",
  HELP: "Help",
  ABOUT: "About",
} as const;

// User Constants
export const USER_CONFIG = {
  MIN_AGE: 18,
  MAX_AGE: 99,
  DEFAULT_DISTANCE: 50, // km
  MAX_DISTANCE: 1000, // km
  MAX_PHOTOS: 6,
  MAX_VIDEOS: 3,
  MAX_BIO_LENGTH: 500,
  MAX_INTERESTS: 10,
  VERIFICATION_TYPES: ["photo", "phone", "email", "id"] as const,
  PROFILE_COMPLETENESS_THRESHOLD: 80, // percentage
} as const;

// Matching Constants
export const MATCHING_CONFIG = {
  DAILY_LIKES_LIMIT: 100,
  DAILY_SUPER_LIKES_LIMIT: 5,
  SWIPE_VELOCITY_THRESHOLD: 0.8,
  SWIPE_DISTANCE_THRESHOLD: 100,
  REWIND_TIME_LIMIT: 300, // 5 minutes in seconds
  BOOST_DURATION: 1800, // 30 minutes in seconds
  DISCOVERY_RADIUS: {
    MIN: 1, // km
    MAX: 1000, // km
    DEFAULT: 50, // km
  },
  AGE_RANGE: {
    MIN_SPAN: 5,
    MAX_SPAN: 50,
    DEFAULT: [25, 35] as const,
  },
} as const;

// Messaging Constants
export const MESSAGING_CONFIG = {
  MAX_MESSAGE_LENGTH: 2000,
  MAX_ATTACHMENT_SIZE: 25 * 1024 * 1024, // 25MB
  TYPING_INDICATOR_TIMEOUT: 3000, // 3 seconds
  MESSAGE_RETRY_ATTEMPTS: 3,
  MESSAGE_DELIVERY_TIMEOUT: 30000, // 30 seconds
  READ_RECEIPT_DELAY: 500, // ms
  SUPPORTED_FILE_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "video/mp4",
    "video/quicktime",
    "audio/mpeg",
    "audio/wav",
    "audio/m4a",
  ] as const,
  MAX_VOICE_MESSAGE_DURATION: 300, // 5 minutes in seconds
} as const;

// Media Constants
export const MEDIA_CONFIG = {
  IMAGE: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_DIMENSION: 2048,
    QUALITY: 0.8,
    FORMATS: ["jpeg", "png", "webp"] as const,
  },
  VIDEO: {
    MAX_SIZE: 100 * 1024 * 1024, // 100MB
    MAX_DURATION: 60, // seconds
    MAX_DIMENSION: 1920,
    FORMATS: ["mp4", "mov", "avi"] as const,
  },
  AUDIO: {
    MAX_SIZE: 25 * 1024 * 1024, // 25MB
    MAX_DURATION: 300, // 5 minutes
    FORMATS: ["mp3", "wav", "m4a"] as const,
  },
  THUMBNAIL: {
    SIZE: 300,
    QUALITY: 0.6,
  },
} as const;

// Location Constants
export const LOCATION_CONFIG = {
  UPDATE_INTERVAL: 300000, // 5 minutes
  MIN_ACCURACY: 100, // meters
  MAX_AGE: 600000, // 10 minutes
  TIMEOUT: 15000, // 15 seconds
  SIGNIFICANT_DISTANCE: 1000, // 1km
  GEOFENCE_RADIUS: 500, // meters
} as const;

// Push Notification Constants
export const NOTIFICATION_CONFIG = {
  CHANNELS: {
    MATCHES: "matches",
    MESSAGES: "messages",
    SOCIAL: "social",
    PROMOTIONS: "promotions",
    SYSTEM: "system",
  },
  PRIORITIES: {
    LOW: "low",
    NORMAL: "normal",
    HIGH: "high",
    MAX: "max",
  },
  ACTIONS: {
    LIKE: "like",
    PASS: "pass",
    MESSAGE: "message",
    VIEW_PROFILE: "view_profile",
  },
} as const;

// Animation Constants
export const ANIMATION_CONFIG = {
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    SPRING: 800,
  },
  EASING: {
    LINEAR: [0, 0, 1, 1] as const,
    EASE_IN: [0.42, 0, 1, 1] as const,
    EASE_OUT: [0, 0, 0.58, 1] as const,
    EASE_IN_OUT: [0.42, 0, 0.58, 1] as const,
    SPRING: [0.68, -0.55, 0.265, 1.55] as const,
  },
  SWIPE: {
    THRESHOLD: 0.5,
    VELOCITY: 0.8,
    ROTATION_FACTOR: 0.1,
    SCALE_FACTOR: 0.95,
  },
} as const;

// Validation Constants
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]+$/,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  USERNAME_REGEX: /^[a-zA-Z0-9_]{3,30}$/,
  NAME_MAX_LENGTH: 50,
  BIO_MAX_LENGTH: 500,
  COMPANY_MAX_LENGTH: 100,
  SCHOOL_MAX_LENGTH: 100,
  JOB_TITLE_MAX_LENGTH: 100,
} as const;

// Error Constants
export const ERROR_CODES = {
  // Network
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  SERVER_ERROR: "SERVER_ERROR",

  // Authentication
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",

  // User
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_BLOCKED: "USER_BLOCKED",
  USER_SUSPENDED: "USER_SUSPENDED",
  PROFILE_INCOMPLETE: "PROFILE_INCOMPLETE",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  REQUIRED_FIELD: "REQUIRED_FIELD",
  INVALID_FORMAT: "INVALID_FORMAT",
  VALUE_TOO_LONG: "VALUE_TOO_LONG",
  VALUE_TOO_SHORT: "VALUE_TOO_SHORT",

  // File Upload
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  UNSUPPORTED_FILE_TYPE: "UNSUPPORTED_FILE_TYPE",
  UPLOAD_FAILED: "UPLOAD_FAILED",

  // Location
  LOCATION_DENIED: "LOCATION_DENIED",
  LOCATION_UNAVAILABLE: "LOCATION_UNAVAILABLE",
  LOCATION_TIMEOUT: "LOCATION_TIMEOUT",

  // Push Notifications
  NOTIFICATION_DENIED: "NOTIFICATION_DENIED",
  NOTIFICATION_FAILED: "NOTIFICATION_FAILED",

  // General
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  MAINTENANCE_MODE: "MAINTENANCE_MODE",
  FEATURE_DISABLED: "FEATURE_DISABLED",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: "Profile updated successfully",
  PASSWORD_CHANGED: "Password changed successfully",
  EMAIL_VERIFIED: "Email verified successfully",
  PHOTO_UPLOADED: "Photo uploaded successfully",
  MESSAGE_SENT: "Message sent successfully",
  MATCH_CREATED: "It's a match!",
  SETTINGS_SAVED: "Settings saved successfully",
  REPORT_SUBMITTED: "Report submitted successfully",
  ACCOUNT_DELETED: "Account deleted successfully",
} as const;

// Loading States
export const LOADING_STATES = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
  REFRESHING: "refreshing",
} as const;

// Subscription Tiers
export const SUBSCRIPTION_TIERS = {
  FREE: "free",
  PREMIUM: "premium",
  PREMIUM_PLUS: "premium_plus",
  VIP: "vip",
} as const;

// Premium Features
export const PREMIUM_FEATURES = {
  UNLIMITED_LIKES: "unlimited_likes",
  SUPER_LIKES: "super_likes",
  BOOSTS: "boosts",
  REWIND: "rewind",
  PASSPORT: "passport",
  READ_RECEIPTS: "read_receipts",
  ADVANCED_FILTERS: "advanced_filters",
  INCOGNITO_MODE: "incognito_mode",
  PRIORITY_LIKES: "priority_likes",
  MESSAGE_BEFORE_MATCH: "message_before_match",
} as const;

// Social Platforms
export const SOCIAL_PLATFORMS = {
  INSTAGRAM: "instagram",
  SPOTIFY: "spotify",
  FACEBOOK: "facebook",
  TWITTER: "twitter",
  LINKEDIN: "linkedin",
  SNAPCHAT: "snapchat",
  TIKTOK: "tiktok",
} as const;

// Interest Categories
export const INTEREST_CATEGORIES = {
  SPORTS: "sports",
  MUSIC: "music",
  TRAVEL: "travel",
  FOOD: "food",
  FITNESS: "fitness",
  TECHNOLOGY: "technology",
  ART: "art",
  BOOKS: "books",
  MOVIES: "movies",
  GAMING: "gaming",
  FASHION: "fashion",
  PHOTOGRAPHY: "photography",
  COOKING: "cooking",
  OUTDOORS: "outdoors",
  PETS: "pets",
  WELLNESS: "wellness",
  BUSINESS: "business",
  EDUCATION: "education",
  VOLUNTEERING: "volunteering",
  NIGHTLIFE: "nightlife",
} as const;

// Education Levels
export const EDUCATION_LEVELS = {
  HIGH_SCHOOL: "high_school",
  SOME_COLLEGE: "some_college",
  BACHELORS: "bachelors",
  MASTERS: "masters",
  PHD: "phd",
  TRADE_SCHOOL: "trade_school",
  OTHER: "other",
} as const;

// Relationship Types
export const RELATIONSHIP_TYPES = {
  CASUAL: "casual",
  SERIOUS: "serious",
  FRIENDSHIP: "friendship",
  NETWORKING: "networking",
  UNSURE: "unsure",
} as const;

// Body Types
export const BODY_TYPES = {
  SLIM: "slim",
  AVERAGE: "average",
  ATHLETIC: "athletic",
  CURVY: "curvy",
  PLUS_SIZE: "plus_size",
  MUSCULAR: "muscular",
  PREFER_NOT_TO_SAY: "prefer_not_to_say",
} as const;

// Drinking Habits
export const DRINKING_HABITS = {
  NEVER: "never",
  RARELY: "rarely",
  SOCIALLY: "socially",
  REGULARLY: "regularly",
  PREFER_NOT_TO_SAY: "prefer_not_to_say",
} as const;

// Smoking Habits
export const SMOKING_HABITS = {
  NEVER: "never",
  SOCIALLY: "socially",
  REGULARLY: "regularly",
  TRYING_TO_QUIT: "trying_to_quit",
  PREFER_NOT_TO_SAY: "prefer_not_to_say",
} as const;

// Drug Usage
export const DRUG_USAGE = {
  NEVER: "never",
  SOMETIMES: "sometimes",
  PREFER_NOT_TO_SAY: "prefer_not_to_say",
} as const;

// Exercise Habits
export const EXERCISE_HABITS = {
  NEVER: "never",
  RARELY: "rarely",
  SOMETIMES: "sometimes",
  OFTEN: "often",
  DAILY: "daily",
} as const;

// Pets
export const PET_TYPES = {
  DOG: "dog",
  CAT: "cat",
  BIRD: "bird",
  FISH: "fish",
  REPTILE: "reptile",
  SMALL_MAMMAL: "small_mammal",
  OTHER: "other",
  NONE: "none",
  WANT_PETS: "want_pets",
  ALLERGIC: "allergic",
} as const;

// Children
export const CHILDREN_STATUS = {
  NONE: "none",
  HAVE_KIDS: "have_kids",
  WANT_KIDS: "want_kids",
  DONT_WANT_KIDS: "dont_want_kids",
  OPEN_TO_KIDS: "open_to_kids",
  PREFER_NOT_TO_SAY: "prefer_not_to_say",
} as const;

// Religion
export const RELIGIONS = {
  AGNOSTIC: "agnostic",
  ATHEIST: "atheist",
  BUDDHIST: "buddhist",
  CHRISTIAN: "christian",
  HINDU: "hindu",
  JEWISH: "jewish",
  MUSLIM: "muslim",
  SPIRITUAL: "spiritual",
  OTHER: "other",
  PREFER_NOT_TO_SAY: "prefer_not_to_say",
} as const;

// Political Views
export const POLITICAL_VIEWS = {
  LIBERAL: "liberal",
  MODERATE: "moderate",
  CONSERVATIVE: "conservative",
  APOLITICAL: "apolitical",
  OTHER: "other",
  PREFER_NOT_TO_SAY: "prefer_not_to_say",
} as const;

// Star Signs
export const STAR_SIGNS = {
  ARIES: "aries",
  TAURUS: "taurus",
  GEMINI: "gemini",
  CANCER: "cancer",
  LEO: "leo",
  VIRGO: "virgo",
  LIBRA: "libra",
  SCORPIO: "scorpio",
  SAGITTARIUS: "sagittarius",
  CAPRICORN: "capricorn",
  AQUARIUS: "aquarius",
  PISCES: "pisces",
  PREFER_NOT_TO_SAY: "prefer_not_to_say",
} as const;

// Languages
export const LANGUAGES = {
  ENGLISH: "en",
  SPANISH: "es",
  FRENCH: "fr",
  GERMAN: "de",
  ITALIAN: "it",
  PORTUGUESE: "pt",
  RUSSIAN: "ru",
  CHINESE: "zh",
  JAPANESE: "ja",
  KOREAN: "ko",
  ARABIC: "ar",
  HINDI: "hi",
  DUTCH: "nl",
  SWEDISH: "sv",
  NORWEGIAN: "no",
  DANISH: "da",
  FINNISH: "fi",
  POLISH: "pl",
  CZECH: "cs",
  HUNGARIAN: "hu",
  GREEK: "el",
  TURKISH: "tr",
  HEBREW: "he",
  THAI: "th",
  VIETNAMESE: "vi",
  INDONESIAN: "id",
  MALAY: "ms",
  FILIPINO: "fil",
} as const;

// Time Constants
export const TIME_FORMATS = {
  ISO: "YYYY-MM-DDTHH:mm:ss.SSSZ",
  DATE_ONLY: "YYYY-MM-DD",
  TIME_ONLY: "HH:mm:ss",
  HUMAN_READABLE: "MMMM Do, YYYY",
  RELATIVE: "relative", // "2 hours ago"
} as const;

// Export all constants as a single object for convenience
export const CONSTANTS = {
  API_CONFIG,
  APP_CONFIG,
  STORAGE_KEYS,
  SCREEN_NAMES,
  USER_CONFIG,
  MATCHING_CONFIG,
  MESSAGING_CONFIG,
  MEDIA_CONFIG,
  LOCATION_CONFIG,
  NOTIFICATION_CONFIG,
  ANIMATION_CONFIG,
  VALIDATION,
  ERROR_CODES,
  SUCCESS_MESSAGES,
  LOADING_STATES,
  SUBSCRIPTION_TIERS,
  PREMIUM_FEATURES,
  SOCIAL_PLATFORMS,
  INTEREST_CATEGORIES,
  EDUCATION_LEVELS,
  RELATIONSHIP_TYPES,
  BODY_TYPES,
  DRINKING_HABITS,
  SMOKING_HABITS,
  DRUG_USAGE,
  EXERCISE_HABITS,
  PET_TYPES,
  CHILDREN_STATUS,
  RELIGIONS,
  POLITICAL_VIEWS,
  STAR_SIGNS,
  LANGUAGES,
  TIME_FORMATS,
} as const;

export default CONSTANTS;
