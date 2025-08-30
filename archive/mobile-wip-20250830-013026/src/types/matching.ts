/**
 * Matching System Types and Interfaces
 * Defines matching algorithms, compatibility, and discovery features
 */

export interface MatchingProfile {
  id: string;
  user: MatchingUser;
  compatibility: CompatibilityScore;
  distance: number;
  lastActive: string;
  matchPotential: MatchPotential;
  discoveryReason: DiscoveryReason;
}

export interface MatchingUser {
  id: string;
  firstName: string;
  age: number;
  profileImages: MatchingProfileImage[];
  interests: MatchingInterest[];
  location: MatchingLocation;
  bio: string;
  isOnline: boolean;
  isVerified: boolean;
  subscriptionLevel: string;
}

export interface MatchingProfileImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  isMain: boolean;
  order: number;
}

export interface MatchingInterest {
  id: string;
  name: string;
  category: string;
  isCommon: boolean;
}

export interface MatchingLocation {
  city: string;
  state: string;
  country: string;
  distance: number;
}

export interface CompatibilityScore {
  overall: number; // 0-100
  breakdown: {
    interests: number;
    location: number;
    activity: number;
    preferences: number;
    personality: number;
  };
  reasons: string[];
}

export interface MatchPotential {
  score: number; // 0-1
  factors: {
    mutualInterests: number;
    locationProximity: number;
    activityLevel: number;
    responseRate: number;
    profileCompleteness: number;
  };
}

export type DiscoveryReason =
  | "new_user"
  | "nearby"
  | "common_interests"
  | "high_compatibility"
  | "mutual_friends"
  | "similar_activity"
  | "boosted_profile"
  | "recently_active"
  | "popular_profile";

export interface SwipeAction {
  id: string;
  targetUserId: string;
  action: SwipeActionType;
  timestamp: string;
  context: SwipeContext;
}

export type SwipeActionType = "like" | "dislike" | "super_like" | "boost";

export interface SwipeContext {
  source: "discovery" | "boost" | "super_boost" | "category" | "nearby";
  position: number; // position in stack
  viewDuration: number; // seconds spent viewing profile
  imagesSeen: number;
  bioRead: boolean;
}

export interface Match {
  id: string;
  users: MatchUser[];
  matchedAt: string;
  matchType: MatchType;
  compatibility: CompatibilityScore;
  status: MatchStatus;
  lastMessage?: MatchMessage;
  unreadCount: number;
  isActive: boolean;
  expiresAt?: string; // for time-limited matches
}

export interface MatchUser {
  id: string;
  firstName: string;
  profileImage: string;
  lastSeen: string;
  isOnline: boolean;
}

export type MatchType =
  | "mutual_like"
  | "super_like"
  | "boost_match"
  | "category_match";
export type MatchStatus =
  | "active"
  | "expired"
  | "archived"
  | "blocked"
  | "reported";

export interface MatchMessage {
  id: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "gif" | "sticker";
  sentAt: string;
  readAt?: string;
}

export interface MatchingPreferences {
  discovery: DiscoverySettings;
  filters: MatchingFilters;
  algorithm: AlgorithmSettings;
  limits: MatchingLimits;
}

export interface DiscoverySettings {
  mode: DiscoveryMode;
  range: number; // kilometers
  showOnlyActive: boolean;
  includeRecentlyJoined: boolean;
  prioritizeCompatibility: boolean;
  enableSmartDiscovery: boolean;
}

export type DiscoveryMode = "standard" | "nearby" | "global" | "category_based";

export interface MatchingFilters {
  ageRange: {
    min: number;
    max: number;
  };
  distanceRange: number;
  verifiedOnly: boolean;
  activeUsersOnly: boolean;
  premiumUsersOnly: boolean;
  excludeSeenProfiles: boolean;
  interests: string[];
  education?: EducationLevel[];
  occupation?: string[];
  lifestyle?: LifestylePreference[];
}

export type EducationLevel =
  | "high_school"
  | "bachelor"
  | "master"
  | "phd"
  | "other";

export interface LifestylePreference {
  category: string;
  values: string[];
}

export interface AlgorithmSettings {
  compatibilityWeight: number; // 0-1
  distanceWeight: number;
  activityWeight: number;
  popularityWeight: number;
  freshnessWeight: number;
  learningEnabled: boolean;
}

export interface MatchingLimits {
  dailyLikes: number;
  dailySuperLikes: number;
  maxMatches: number;
  messageLimit: number;
  boostCredits: number;
}

export interface MatchingStats {
  totalSwipes: number;
  likes: number;
  dislikes: number;
  superLikes: number;
  matches: number;
  conversations: number;
  responseRate: number;
  averageResponseTime: number; // minutes
  popularityScore: number;
  compatibilityAverage: number;
}

export interface DiscoveryQueue {
  profiles: MatchingProfile[];
  currentIndex: number;
  hasMore: boolean;
  lastUpdated: string;
  preloadCount: number;
}

export interface BoostSession {
  id: string;
  userId: string;
  type: BoostType;
  startTime: string;
  duration: number; // minutes
  isActive: boolean;
  stats: BoostStats;
}

export type BoostType = "standard" | "super" | "premium";

export interface BoostStats {
  impressions: number;
  likes: number;
  superLikes: number;
  matches: number;
  profileViews: number;
}

export interface SuperLike {
  id: string;
  senderId: string;
  targetId: string;
  message?: string;
  sentAt: string;
  viewedAt?: string;
  respondedAt?: string;
  response?: "like" | "dislike";
}

export interface MatchingEvent {
  id: string;
  type: MatchingEventType;
  userId: string;
  targetId?: string;
  data: Record<string, any>;
  timestamp: string;
}

export type MatchingEventType =
  | "profile_viewed"
  | "profile_liked"
  | "profile_disliked"
  | "super_like_sent"
  | "match_created"
  | "match_expired"
  | "boost_activated"
  | "algorithm_updated";

// Additional types needed by stores
export type User = MatchingUser;
export type MatchPreferences = MatchingPreferences;
