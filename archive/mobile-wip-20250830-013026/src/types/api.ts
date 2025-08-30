/**
 * Core API Types and Interfaces
 * Defines request/response structures for all API endpoints
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode: number;
  status: number; // HTTP status code
  statusText?: string;
}

export interface RequestConfig {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  retries?: number;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  retries?: number;
  cache?: RequestCache;
  priority?: "low" | "normal" | "high";
  signal?: AbortSignal;
}

// Authentication API Types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "non_binary" | "other";
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: UserProfile;
  expiresAt: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// User API Types
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bio?: string;
  location?: LocationData;
  profileImages: ProfileImage[];
  interests: Interest[];
  isVerified: boolean;
  isOnline: boolean;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileImage {
  id: string;
  url: string;
  isMain: boolean;
  order: number;
  createdAt: string;
}

export interface Interest {
  id: string;
  name: string;
  category: string;
  isSelected: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
}

// Matching API Types
export interface MatchProfile {
  id: string;
  user: UserProfile;
  compatibility: number;
  distance: number;
  lastActive: string;
  mutualInterests: Interest[];
  mutualFriends?: number;
}

export interface SwipeAction {
  targetUserId: string;
  action: "like" | "dislike" | "superlike";
  timestamp: string;
}

export interface Match {
  id: string;
  users: UserProfile[];
  matchedAt: string;
  lastMessage?: Message;
  unreadCount: number;
  isActive: boolean;
}

// Messaging API Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "video" | "voice" | "gif";
  mediaUrl?: string;
  readAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: UserProfile[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

// Media API Types
export interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
  mimeType: string;
  size: number;
  width: number;
  height: number;
  duration?: number; // for videos
  thumbnail?: string;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
}

export interface MediaUploadRequest {
  file: File | Blob;
  type: "image" | "video";
  isPublic?: boolean;
  tags?: string[];
}

// Category API Types
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  memberCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface CategoryMembership {
  id: string;
  categoryId: string;
  userId: string;
  joinedAt: string;
  isActive: boolean;
}

// Community API Types
export interface CommunityChannel {
  id: string;
  name: string;
  description: string;
  type: "public" | "private";
  memberCount: number;
  createdAt: string;
}

export interface CommunityMessage {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "video";
  mediaUrl?: string;
  mentions: string[];
  reactions: MessageReaction[];
  replyTo?: string;
  createdAt: string;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  createdAt: string;
}

// Analytics API Types
export interface UserAnalytics {
  profileViews: number;
  matches: number;
  messages: number;
  swipesGiven: number;
  swipesReceived: number;
  period: "daily" | "weekly" | "monthly";
  date: string;
}

export interface AppUsageAnalytics {
  screenViews: Record<string, number>;
  featureUsage: Record<string, number>;
  sessionDuration: number;
  timestamp: string;
}
