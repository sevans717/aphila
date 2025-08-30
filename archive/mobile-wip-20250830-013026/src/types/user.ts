/**
 * User Profile and Account Types
 * Defines user data structures, preferences, and profile management
 */

export interface User {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  displayName: string;
  dateOfBirth: string;
  age: number;
  gender: Gender;
  bio?: string;
  tagline?: string;
  profileImages: ProfileImage[];
  interests: Interest[];
  location: UserLocation;
  preferences: UserPreferences;
  stats: UserStats;
  verification: VerificationStatus;
  subscription: SubscriptionInfo;
  privacy: PrivacySettings;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export type Gender =
  | "male"
  | "female"
  | "non_binary"
  | "other"
  | "prefer_not_to_say";

export interface ProfileImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  isMain: boolean;
  order: number;
  isVerified: boolean;
  uploadedAt: string;
  metadata: {
    width: number;
    height: number;
    size: number;
    mimeType: string;
  };
}

export interface Interest {
  id: string;
  name: string;
  category: InterestCategory;
  subcategory?: string;
  isSelected: boolean;
  weight: number; // importance for matching algorithm
}

export type InterestCategory =
  | "sports"
  | "music"
  | "movies"
  | "books"
  | "travel"
  | "food"
  | "technology"
  | "art"
  | "gaming"
  | "fitness"
  | "outdoors"
  | "lifestyle"
  | "career"
  | "education"
  | "other";

export interface UserLocation {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address: {
    street?: string;
    city: string;
    state: string;
    country: string;
    zipCode?: string;
  };
  isVisible: boolean;
  accuracy: number; // in meters
  lastUpdated: string;
}

export interface UserPreferences {
  dating: DatingPreferences;
  discovery: DiscoveryPreferences;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  display: DisplayPreferences;
}

export interface DatingPreferences {
  ageRange: {
    min: number;
    max: number;
  };
  distanceRange: number; // in kilometers
  genderPreference: Gender[];
  relationshipType: RelationshipType[];
  dealBreakers: string[];
  mustHaves: string[];
}

export type RelationshipType =
  | "casual"
  | "serious"
  | "friendship"
  | "hookup"
  | "long_term"
  | "marriage"
  | "open_relationship";

export interface DiscoveryPreferences {
  showMe: "everyone" | "new_people" | "popular" | "nearby";
  discoveryMode: "standard" | "boost" | "super_boost";
  hideProfile: boolean;
  showOnlineStatus: boolean;
  globalMode: boolean; // discover people worldwide
}

export interface NotificationPreferences {
  push: PushNotificationSettings;
  email: EmailNotificationSettings;
  inApp: InAppNotificationSettings;
}

export interface PushNotificationSettings {
  enabled: boolean;
  matches: boolean;
  messages: boolean;
  likes: boolean;
  superLikes: boolean;
  boosts: boolean;
  promotions: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
  };
}

export interface EmailNotificationSettings {
  enabled: boolean;
  matches: boolean;
  messages: boolean;
  newsletter: boolean;
  promotions: boolean;
  security: boolean;
}

export interface InAppNotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  badge: boolean;
}

export interface PrivacyPreferences {
  profileVisibility: "public" | "private" | "friends_only";
  showDistance: boolean;
  showAge: boolean;
  showLastSeen: boolean;
  allowMessages: "everyone" | "matches_only" | "premium_only";
  shareAnalytics: boolean;
  shareLocation: boolean;
}

export interface DisplayPreferences {
  theme: "light" | "dark" | "auto";
  language: string;
  units: "metric" | "imperial";
  timeFormat: "12h" | "24h";
  autoPlay: boolean;
  highQualityImages: boolean;
}

export interface UserStats {
  profileViews: number;
  likes: number;
  superLikes: number;
  matches: number;
  messages: number;
  connections: number;
  activeDays: number;
  averageResponseTime: number; // in minutes
  compatibilityScore: number;
  popularityRank: number;
}

export interface VerificationStatus {
  phone: boolean;
  email: boolean;
  photo: boolean;
  identity: boolean;
  social: boolean;
  verificationLevel: VerificationLevel;
  badges: VerificationBadge[];
}

export type VerificationLevel =
  | "unverified"
  | "basic"
  | "verified"
  | "premium_verified";

export interface VerificationBadge {
  type: "phone" | "email" | "photo" | "identity" | "social" | "premium";
  isVerified: boolean;
  verifiedAt?: string;
  expiresAt?: string;
}

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  features: SubscriptionFeature[];
  paymentMethod: PaymentMethod;
}

export type SubscriptionPlan = "free" | "premium" | "premium_plus" | "platinum";
export type SubscriptionStatus =
  | "active"
  | "inactive"
  | "cancelled"
  | "expired"
  | "suspended";

export interface SubscriptionFeature {
  name: string;
  enabled: boolean;
  limit?: number;
  used?: number;
}

export interface PaymentMethod {
  type: "credit_card" | "debit_card" | "paypal" | "apple_pay" | "google_pay";
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface PrivacySettings {
  profileVisibility: "public" | "private" | "custom";
  showOnlineStatus: boolean;
  showDistance: boolean;
  showAge: boolean;
  allowMessages: "everyone" | "matches_only" | "none";
  blockList: string[]; // user IDs
  reportedUsers: string[]; // user IDs
  dataSharing: {
    analytics: boolean;
    advertising: boolean;
    partners: boolean;
  };
}

export interface UserActivity {
  loginHistory: LoginActivity[];
  swipeHistory: SwipeActivity[];
  messageHistory: MessageActivity[];
  profileUpdates: ProfileUpdate[];
}

export interface LoginActivity {
  id: string;
  deviceInfo: {
    platform: string;
    browser?: string;
    location?: string;
  };
  ipAddress: string;
  timestamp: string;
}

export interface SwipeActivity {
  id: string;
  action: "like" | "dislike" | "super_like";
  targetUserId: string;
  timestamp: string;
}

export interface MessageActivity {
  id: string;
  conversationId: string;
  messagesSent: number;
  timestamp: string;
}

export interface ProfileUpdate {
  id: string;
  field: string;
  oldValue?: any;
  newValue: any;
  timestamp: string;
}

// Additional type alias needed by stores
export type Location = UserLocation;
