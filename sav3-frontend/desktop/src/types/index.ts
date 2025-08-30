// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    retryable?: boolean;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    version: string;
    responseTime?: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Auth Types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  preferences: UserPreferences;
  stats: UserStats;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: "light" | "dark" | "auto";
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisibility: "public" | "friends" | "private";
    locationSharing: boolean;
    activityStatus: boolean;
  };
  content: {
    language: string;
    contentFilter: boolean;
    autoPlay: boolean;
  };
}

export interface UserStats {
  posts: number;
  followers: number;
  following: number;
  likes: number;
  views: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Post Types
export interface Post {
  id: string;
  authorId: string;
  author: User;
  content: string;
  mediaUrls?: string[];
  categories: Category[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  stats: PostStats;
  interactions: {
    liked: boolean;
    bookmarked: boolean;
    shared: boolean;
  };
  visibility: "public" | "friends" | "community";
  createdAt: string;
  updatedAt: string;
}

export interface PostStats {
  likes: number;
  comments: number;
  shares: number;
  views: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: User;
  content: string;
  parentId?: string;
  replies?: Comment[];
  likes: number;
  createdAt: string;
  updatedAt: string;
}

// Media Types
export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
  };
  uploadedBy: string;
  createdAt: string;
}

// Community Types
export interface Community {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  banner?: string;
  category: string;
  memberCount: number;
  isPrivate: boolean;
  rules: string[];
  moderators: User[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  subcategories?: Category[];
  postCount: number;
}

// Messaging Types
export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  type: "direct" | "group";
  name?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  content: string;
  type: "text" | "image" | "file" | "audio";
  mediaUrl?: string;
  reactions: MessageReaction[];
  status: "sent" | "delivered" | "read";
  replyTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  user: User;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export type NotificationType =
  | "like"
  | "comment"
  | "follow"
  | "message"
  | "community_join"
  | "post_mention"
  | "system";

// Geospatial Types
export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface NearbyUser {
  user: User;
  distance: number;
  lastSeen: string;
}

// Search Types
export interface SearchResult<T = any> {
  type: "user" | "post" | "community" | "category";
  item: T;
  relevanceScore: number;
  highlights?: string[];
}

export interface SearchFilters {
  type?: ("user" | "post" | "community" | "category")[];
  dateRange?: {
    start: string;
    end: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  categories?: string[];
  sortBy?: "relevance" | "date" | "popularity";
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  firstName: string;
  lastName: string;
  agreeToTerms: boolean;
}

export interface PostForm {
  content: string;
  mediaFiles?: File[];
  categories?: string[];
  location?: Location;
  visibility: "public" | "friends" | "community";
  communityId?: string;
}

// Store Types
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  theme: "light" | "dark" | "auto";
  notifications: Notification[];
  unreadCount: number;
}

export interface PostsState {
  feed: Post[];
  userPosts: Post[];
  communityPosts: Post[];
  bookmarkedPosts: Post[];
  loading: boolean;
  hasMore: boolean;
  lastFetch: string | null;
}

export interface MessagingState {
  conversations: Conversation[];
  activeConversation: string | null;
  messages: Record<string, Message[]>;
  typing: Record<string, string[]>;
  onlineUsers: string[];
}

// Component Props Types
export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

export interface ButtonProps extends BaseProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export interface InputProps extends BaseProps {
  type?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  label?: string;
  helper?: string;
}

// Settings Types
export interface SettingsTab {
  id: string;
  name: string;
  icon: string;
}

export interface UserSettings {
  profile: ProfileSettings;
  account: AccountSettings;
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
}

export interface ProfileSettings {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  bio: string;
  avatar?: string;
  location?: Location;
}

export interface AccountSettings {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
  downloadData: boolean;
  deleteAccount: boolean;
}

export interface PrivacySettings {
  profileVisibility: "public" | "friends" | "private";
  locationSharing: boolean;
  activityStatus: boolean;
  dataCollection: boolean;
  personalization: boolean;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  likes: boolean;
  comments: boolean;
  follows: boolean;
  messages: boolean;
  mentions: boolean;
  communities: boolean;
  marketing: boolean;
}

export interface AppearanceSettings {
  theme: "light" | "dark" | "auto";
  fontSize: "small" | "medium" | "large";
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
}

// Electron API Types
export interface ElectronAPI {
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  openExternal: (url: string) => Promise<void>;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  selectFile: (options?: FileDialogOptions) => Promise<FileResult>;
  showNotification: (options: NotificationOptions) => void;
  onWindowStateChange: (callback: (state: WindowState) => void) => void;
  removeAllListeners: (channel: string) => void;
}

export interface FileDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: FileFilter[];
  multiSelect?: boolean;
  directory?: boolean;
}

export interface FileFilter {
  name: string;
  extensions: string[];
}

export interface FileResult {
  canceled: boolean;
  filePaths: string[];
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
  urgency?: "low" | "normal" | "critical";
}

export type WindowState = "minimized" | "maximized" | "restored" | "fullscreen";

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  userId?: string;
  context?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Utility Types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;
export type EventHandler<T = any> = (event: T) => void;
export type Callback<T = void> = () => T;

// API Types
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  requireAuth?: boolean;
  rateLimit?: {
    requests: number;
    window: number;
  };
}
