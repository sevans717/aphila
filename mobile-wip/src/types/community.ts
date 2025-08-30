/**
 * Community and Category Types
 * Defines community structures, categories, events, and social features
 */

export interface Community {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  banner?: string;
  type: CommunityType;
  visibility: CommunityVisibility;
  memberCount: number;
  activeMembers: number;
  categories: Category[];
  rules: CommunityRule[];
  moderators: string[]; // user IDs
  settings: CommunitySettings;
  stats: CommunityStats;
  createdAt: string;
  updatedAt: string;
}

export type CommunityType =
  | "dating"
  | "interest"
  | "location"
  | "hobby"
  | "professional"
  | "support";
export type CommunityVisibility =
  | "public"
  | "private"
  | "invite_only"
  | "restricted";

export interface Category {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  parentId?: string;
  subcategories: Category[];
  memberCount: number;
  postCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isPremium: boolean;
  tags: string[];
  metadata: CategoryMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryMetadata {
  averageAge: number;
  genderRatio: {
    male: number;
    female: number;
    other: number;
  };
  activityLevel: ActivityLevel;
  popularTimes: PopularTime[];
  topInterests: string[];
  locationDistribution: Record<string, number>;
}

export type ActivityLevel = "low" | "medium" | "high" | "very_high";

export interface PopularTime {
  dayOfWeek: number; // 0-6
  hour: number; // 0-23
  activity: number; // 0-100
}

export interface CommunityRule {
  id: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  consequences: string[];
  isActive: boolean;
  order: number;
}

export type RuleSeverity = "warning" | "minor" | "major" | "severe";

export interface CommunitySettings {
  joinPolicy: JoinPolicy;
  postingPermissions: PostingPermissions;
  moderationLevel: ModerationLevel;
  contentFilters: ContentFilter[];
  notifications: CommunityNotificationSettings;
  features: CommunityFeature[];
}

export type JoinPolicy = "open" | "approval_required" | "invite_only";

export interface PostingPermissions {
  whoCanPost: "everyone" | "members" | "moderators" | "admins";
  whoCanComment: "everyone" | "members" | "moderators" | "admins";
  requireApproval: boolean;
  allowMedia: boolean;
  allowLinks: boolean;
  allowPolls: boolean;
}

export type ModerationLevel = "relaxed" | "standard" | "strict" | "automated";

export interface ContentFilter {
  type: FilterType;
  keywords: string[];
  isEnabled: boolean;
  action: FilterAction;
}

export type FilterType =
  | "profanity"
  | "spam"
  | "harassment"
  | "inappropriate"
  | "custom";
export type FilterAction = "flag" | "hide" | "remove" | "quarantine";

export interface CommunityNotificationSettings {
  newMembers: boolean;
  newPosts: boolean;
  newComments: boolean;
  moderationNeeded: boolean;
  reportedContent: boolean;
}

export interface CommunityFeature {
  name: string;
  isEnabled: boolean;
  isPremium: boolean;
  settings: Record<string, any>;
}

export interface CommunityStats {
  totalMembers: number;
  activeMembers: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  totalPosts: number;
  totalComments: number;
  avgSessionDuration: number;
  topContributors: ContributorStats[];
  growthRate: GrowthStats;
  engagement: EngagementStats;
}

export interface ContributorStats {
  userId: string;
  posts: number;
  comments: number;
  likes: number;
  score: number;
}

export interface GrowthStats {
  daily: number;
  weekly: number;
  monthly: number;
  trend: "growing" | "stable" | "declining";
}

export interface EngagementStats {
  avgPostLikes: number;
  avgPostComments: number;
  avgPostShares: number;
  responseRate: number;
  activeDiscussions: number;
}

export interface CategoryMembership {
  id: string;
  userId: string;
  categoryId: string;
  role: MemberRole;
  status: MembershipStatus;
  joinedAt: string;
  lastActiveAt: string;
  preferences: MembershipPreferences;
  stats: MemberStats;
}

export type MemberRole =
  | "member"
  | "contributor"
  | "moderator"
  | "admin"
  | "owner";
export type MembershipStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "banned"
  | "pending";

export interface MembershipPreferences {
  notifications: boolean;
  visibility: MemberVisibility;
  allowDirectMessages: boolean;
  showOnlineStatus: boolean;
  autoJoinDiscussions: boolean;
}

export type MemberVisibility = "public" | "members_only" | "private";

export interface MemberStats {
  postsCreated: number;
  commentsCreated: number;
  likesReceived: number;
  likesGiven: number;
  reportsReceived: number;
  reportsGiven: number;
  reputation: number;
}

export interface CommunityPost {
  id: string;
  categoryId: string;
  authorId: string;
  title?: string;
  content: string;
  type: PostType;
  media: PostMedia[];
  tags: string[];
  mentions: string[]; // user IDs
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  views: number;
  isSticky: boolean;
  isLocked: boolean;
  isNSFW: boolean;
  moderationStatus: ModerationStatus;
  createdAt: string;
  updatedAt: string;
}

export type PostType =
  | "text"
  | "image"
  | "video"
  | "link"
  | "poll"
  | "event"
  | "discussion";

export interface PostMedia {
  id: string;
  type: "image" | "video" | "audio" | "document";
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  alt?: string;
}

export type ModerationStatus =
  | "pending"
  | "approved"
  | "flagged"
  | "removed"
  | "quarantined";

export interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentId?: string; // for threaded comments
  likes: number;
  dislikes: number;
  replies: number;
  mentions: string[];
  moderationStatus: ModerationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityEvent {
  id: string;
  categoryId: string;
  organizerId: string;
  title: string;
  description: string;
  type: EventType;
  startDate: string;
  endDate: string;
  location?: EventLocation;
  capacity?: number;
  attendees: EventAttendee[];
  isVirtual: boolean;
  isFree: boolean;
  price?: number;
  currency?: string;
  tags: string[];
  media: EventMedia[];
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export type EventType =
  | "meetup"
  | "workshop"
  | "conference"
  | "social"
  | "sports"
  | "cultural"
  | "educational";

export interface EventLocation {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  venue?: string;
}

export interface EventAttendee {
  userId: string;
  status: AttendeeStatus;
  registeredAt: string;
  checkedInAt?: string;
  role: AttendeeRole;
}

export type AttendeeStatus =
  | "interested"
  | "going"
  | "maybe"
  | "not_going"
  | "checked_in";
export type AttendeeRole = "attendee" | "speaker" | "organizer" | "volunteer";

export interface EventMedia {
  id: string;
  type: "image" | "video" | "document";
  url: string;
  description?: string;
  order: number;
}

export type EventStatus =
  | "draft"
  | "published"
  | "cancelled"
  | "completed"
  | "postponed";

export interface CategoryChat {
  id: string;
  categoryId: string;
  type: ChatType;
  participants: ChatParticipant[];
  messages: CategoryChatMessage[];
  settings: CategoryChatSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ChatType = "general" | "topic" | "event" | "voice" | "video";

export interface ChatParticipant {
  userId: string;
  role: ChatRole;
  joinedAt: string;
  lastSeenAt: string;
  isMuted: boolean;
  canSendMessages: boolean;
  canSendMedia: boolean;
}

export type ChatRole = "participant" | "moderator" | "admin";

export interface CategoryChatMessage {
  id: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "video" | "voice" | "system";
  replyTo?: string;
  mentions: string[];
  reactions: MessageReaction[];
  isDeleted: boolean;
  sentAt: string;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  addedAt: string;
}

export interface CategoryChatSettings {
  slowMode: boolean;
  slowModeInterval: number; // seconds
  allowLinks: boolean;
  allowMedia: boolean;
  allowMentions: boolean;
  maxMessageLength: number;
  autoModeration: boolean;
}

export interface TrendingCategory {
  categoryId: string;
  name: string;
  memberGrowth: number;
  postGrowth: number;
  engagementGrowth: number;
  trendScore: number;
  trendDirection: "up" | "down" | "stable";
  timeframe: "1h" | "1d" | "7d" | "30d";
}

export interface CategoryRecommendation {
  categoryId: string;
  score: number;
  reasons: RecommendationReason[];
  similarCategories: string[];
  estimatedInterest: number;
}

export interface RecommendationReason {
  type: ReasonType;
  weight: number;
  explanation: string;
}

export type ReasonType =
  | "similar_interests"
  | "friends_joined"
  | "location_based"
  | "activity_pattern"
  | "content_engagement"
  | "demographic_match";

export interface CategoryAnalytics {
  categoryId: string;
  period: AnalyticsPeriod;
  metrics: CategoryMetrics;
  demographics: DemographicData;
  engagement: EngagementData;
  content: ContentData;
}

export type AnalyticsPeriod = "1d" | "7d" | "30d" | "90d" | "1y";

export interface CategoryMetrics {
  memberCount: number;
  activeMembers: number;
  newMembers: number;
  postCount: number;
  commentCount: number;
  likeCount: number;
  shareCount: number;
  avgSessionDuration: number;
}

export interface DemographicData {
  ageGroups: Record<string, number>;
  genderDistribution: Record<string, number>;
  locationDistribution: Record<string, number>;
  deviceTypes: Record<string, number>;
}

export interface EngagementData {
  avgPostsPerUser: number;
  avgCommentsPerPost: number;
  avgLikesPerPost: number;
  retentionRate: number;
  churRate: number;
}

export interface ContentData {
  topTags: TagStats[];
  topPosts: PostStats[];
  contentTypes: Record<string, number>;
  moderationActions: Record<string, number>;
}

export interface TagStats {
  tag: string;
  count: number;
  growth: number;
}

export interface PostStats {
  postId: string;
  engagement: number;
  reach: number;
  viral: boolean;
}

// Additional types needed by stores
export interface UserPool {
  id: string;
  categoryId: string;
  users: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryEvent {
  id: string;
  categoryId: string;
  type: string;
  data: Record<string, any>;
  userId: string;
  timestamp: string;
}

export interface CommunityChannel {
  id: string;
  communityId: string;
  name: string;
  description?: string;
  type: "text" | "voice" | "video";
  isPrivate: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  role: "admin" | "moderator" | "member";
  joinedAt: string;
  isActive: boolean;
}

export interface BoostedContent {
  id: string;
  type: "profile" | "post" | "community";
  targetId: string;
  userId: string;
  boostLevel: number;
  expiresAt: string;
  createdAt: string;
}

export interface TrendingItem {
  id: string;
  type: "profile" | "post" | "community";
  targetId: string;
  score: number;
  category?: string;
  createdAt: string;
}
