/**
 * Real-time Types
 * Defines WebSocket connections, real-time events, and live data synchronization
 */

export interface WebSocketConnection {
  id: string;
  userId?: string;
  sessionId: string;
  status: ConnectionStatus;
  type: ConnectionType;
  channels: string[];
  metadata: ConnectionMetadata;
  connectedAt: string;
  lastActivityAt: string;
  reconnectCount: number;
  latency?: number;
}

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "failed"
  | "error";
export type ConnectionType = "user" | "admin" | "system" | "anonymous" | "bot";

export interface ConnectionMetadata {
  clientVersion: string;
  platform: "ios" | "android" | "web" | "desktop";
  deviceId: string;
  userAgent?: string;
  ipAddress: string;
  location?: LocationInfo;
  capabilities: ConnectionCapability[];
}

export interface LocationInfo {
  country: string;
  region: string;
  city: string;
  timezone: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export type ConnectionCapability =
  | "typing_indicators"
  | "read_receipts"
  | "presence_updates"
  | "file_transfer"
  | "voice_chat"
  | "video_chat"
  | "screen_sharing"
  | "push_notifications";

// Real-time Events
export interface RealTimeEvent {
  id: string;
  type: EventType;
  channel: string;
  data: EventData;
  timestamp: string;
  senderId?: string;
  targetIds?: string[];
  priority: EventPriority;
  ttl?: number; // time to live in seconds
  retry?: RetryConfig;
}

export type EventType =
  // User events
  | "user_online"
  | "user_offline"
  | "user_typing"
  | "user_stopped_typing"
  | "user_joined"
  | "user_left"

  // Message events
  | "message_sent"
  | "message_received"
  | "message_read"
  | "message_delivered"
  | "message_deleted"
  | "message_edited"

  // Match events
  | "new_match"
  | "match_liked"
  | "match_passed"
  | "match_undone"
  | "super_like_received"

  // Activity events
  | "profile_viewed"
  | "photo_liked"
  | "post_created"
  | "comment_added"
  | "story_posted"

  // System events
  | "connection_established"
  | "connection_lost"
  | "server_maintenance"
  | "feature_updated"
  | "notification_received"

  // Custom events
  | "custom_event";

export interface EventData {
  [key: string]: any;
}

export type EventPriority = "low" | "normal" | "high" | "critical";

export interface RetryConfig {
  maxAttempts: number;
  backoffStrategy: "linear" | "exponential" | "fixed";
  initialDelay: number;
  maxDelay: number;
  multiplier?: number;
}

// Presence Management
export interface PresenceInfo {
  userId: string;
  status: PresenceStatus;
  activity?: UserActivity;
  lastSeen: string;
  location?: LocationInfo;
  devices: DevicePresence[];
  customStatus?: CustomStatus;
  visibility: PresenceVisibility;
}

export type PresenceStatus =
  | "online"
  | "away"
  | "busy"
  | "offline"
  | "invisible";

export interface UserActivity {
  type: ActivityType;
  description: string;
  startedAt: string;
  context?: ActivityContext;
}

export type ActivityType =
  | "browsing"
  | "chatting"
  | "swiping"
  | "posting"
  | "viewing_profile"
  | "editing_profile"
  | "in_call"
  | "idle"
  | "custom";

export interface ActivityContext {
  screenName?: string;
  chatId?: string;
  profileId?: string;
  categoryId?: string;
  metadata?: Record<string, any>;
}

export interface DevicePresence {
  deviceId: string;
  platform: "ios" | "android" | "web" | "desktop";
  status: PresenceStatus;
  lastActiveAt: string;
  pushToken?: string;
  capabilities: string[];
}

export interface CustomStatus {
  emoji?: string;
  text?: string;
  expiresAt?: string;
}

export type PresenceVisibility = "public" | "friends" | "matches" | "invisible";

// Live Data Synchronization
export interface SyncEvent {
  id: string;
  type: SyncType;
  entity: string;
  entityId: string;
  operation: SyncOperation;
  data: SyncData;
  version: number;
  timestamp: string;
  conflictResolution?: ConflictResolution;
}

export type SyncType = "create" | "update" | "delete" | "bulk_update";
export type SyncOperation = "add" | "modify" | "remove" | "replace" | "merge";

export interface SyncData {
  current: Record<string, any>;
  previous?: Record<string, any>;
  changes?: FieldChange[];
}

export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
  type: "add" | "modify" | "remove";
}

export interface ConflictResolution {
  strategy: ConflictStrategy;
  winner: "client" | "server" | "merge";
  reason: string;
  metadata?: Record<string, any>;
}

export type ConflictStrategy =
  | "last_write_wins"
  | "first_write_wins"
  | "merge"
  | "user_decision";

// Typing Indicators
export interface TypingIndicator {
  chatId: string;
  userId: string;
  isTyping: boolean;
  timestamp: string;
  expiresAt: string;
}

// Read Receipts
export interface ReadReceipt {
  messageId: string;
  userId: string;
  readAt: string;
  delivered: boolean;
}

// Live Updates
export interface LiveUpdate {
  id: string;
  type: UpdateType;
  scope: UpdateScope;
  data: UpdateData;
  timestamp: string;
  priority: EventPriority;
  targetAudience: TargetAudience;
}

export type UpdateType =
  | "user_count"
  | "new_matches"
  | "messages_count"
  | "likes_count"
  | "online_friends"
  | "trending_topics"
  | "featured_profiles"
  | "system_announcement";

export type UpdateScope =
  | "global"
  | "regional"
  | "category"
  | "user_specific"
  | "group_specific";

export interface UpdateData {
  count?: number;
  items?: LiveUpdateItem[];
  message?: string;
  metadata?: Record<string, any>;
}

export interface LiveUpdateItem {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: string;
}

export interface TargetAudience {
  type: AudienceType;
  filters: AudienceFilter[];
  excludeIds?: string[];
}

export type AudienceType =
  | "all"
  | "authenticated"
  | "premium"
  | "segment"
  | "custom";

export interface AudienceFilter {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "in"
    | "not_in"
    | "greater_than"
    | "less_than";
  value: any;
}

// Chat Real-time
export interface ChatChannel {
  id: string;
  type: ChannelType;
  participants: ChannelParticipant[];
  settings: ChannelSettings;
  state: ChannelState;
  metadata?: Record<string, any>;
}

export type ChannelType =
  | "direct"
  | "group"
  | "category"
  | "public"
  | "broadcast";

export interface ChannelParticipant {
  userId: string;
  role: ParticipantRole;
  joinedAt: string;
  lastReadAt?: string;
  permissions: ParticipantPermission[];
  status: ParticipantStatus;
}

export type ParticipantRole =
  | "owner"
  | "admin"
  | "moderator"
  | "member"
  | "guest";
export type ParticipantStatus = "active" | "muted" | "banned" | "left";

export type ParticipantPermission =
  | "send_messages"
  | "send_media"
  | "mention_all"
  | "manage_members"
  | "manage_settings"
  | "delete_messages";

export interface ChannelSettings {
  allowGuests: boolean;
  requireApproval: boolean;
  muteNotifications: boolean;
  retentionDays?: number;
  maxMembers?: number;
  slowMode?: SlowModeConfig;
}

export interface SlowModeConfig {
  enabled: boolean;
  interval: number; // seconds between messages
  exemptRoles: ParticipantRole[];
}

export interface ChannelState {
  messageCount: number;
  lastMessageAt?: string;
  lastActivityAt: string;
  unreadCount: Record<string, number>; // userId -> count
  typingUsers: string[];
  onlineUsers: string[];
}

// Voice/Video Chat
export interface VoiceChannel {
  id: string;
  chatId?: string;
  type: "voice" | "video" | "screen_share";
  status: CallStatus;
  participants: VoiceParticipant[];
  settings: CallSettings;
  quality: CallQuality;
  startedAt: string;
  endedAt?: string;
}

export type CallStatus =
  | "initiating"
  | "ringing"
  | "connecting"
  | "connected"
  | "ended"
  | "failed";

export interface VoiceParticipant {
  userId: string;
  connectionId: string;
  role: CallRole;
  status: CallParticipantStatus;
  audio: AudioState;
  video?: VideoState;
  joinedAt: string;
  leftAt?: string;
}

export type CallRole = "host" | "participant" | "observer";
export type CallParticipantStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export interface AudioState {
  enabled: boolean;
  muted: boolean;
  volume: number;
  quality: "poor" | "fair" | "good" | "excellent";
}

export interface VideoState {
  enabled: boolean;
  muted: boolean;
  resolution: VideoResolution;
  fps: number;
  quality: "poor" | "fair" | "good" | "excellent";
}

export interface VideoResolution {
  width: number;
  height: number;
}

export interface CallSettings {
  maxParticipants: number;
  recordingEnabled: boolean;
  screenShareEnabled: boolean;
  chatEnabled: boolean;
  requireApproval: boolean;
  endCallOnHostLeave: boolean;
}

export interface CallQuality {
  overall: "poor" | "fair" | "good" | "excellent";
  latency: number; // ms
  jitter: number; // ms
  packetLoss: number; // percentage
  bandwidth: BandwidthInfo;
}

export interface BandwidthInfo {
  upload: number; // kbps
  download: number; // kbps
  available: number; // kbps
}

// Push Notifications Real-time
export interface PushNotificationStatus {
  notificationId: string;
  userId: string;
  status: NotificationDeliveryStatus;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  error?: NotificationError;
}

export type NotificationDeliveryStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "failed"
  | "expired";

export interface NotificationError {
  code: string;
  message: string;
  retryable: boolean;
  retryAfter?: number;
}

// Real-time Analytics Events
export interface AnalyticsEvent {
  id: string;
  userId?: string;
  sessionId: string;
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  properties: Record<string, any>;
  context: EventContext;
  timestamp: string;
}

export interface EventContext {
  page: string;
  referrer?: string;
  userAgent: string;
  ip: string;
  location: LocationInfo;
  device: DeviceInfo;
  session: SessionInfo;
}

export interface DeviceInfo {
  type: "mobile" | "tablet" | "desktop";
  os: string;
  osVersion: string;
  browser?: string;
  browserVersion?: string;
  screenResolution: string;
}

export interface SessionInfo {
  id: string;
  startTime: string;
  pageViews: number;
  duration: number;
  isNew: boolean;
}

// WebSocket Message Format
export interface WebSocketMessage {
  id: string;
  type: MessageType;
  event: string;
  data: any;
  timestamp: string;
  acknowledgment?: AckConfig;
}

export type MessageType =
  | "event"
  | "ack"
  | "error"
  | "ping"
  | "pong"
  | "subscribe"
  | "unsubscribe";

export interface AckConfig {
  required: boolean;
  timeout: number; // ms
  retries: number;
}

// Error Handling
export interface WebSocketError {
  code: number;
  message: string;
  type: ErrorType;
  recoverable: boolean;
  timestamp: string;
  context?: Record<string, any>;
}

export type ErrorType =
  | "connection_failed"
  | "authentication_failed"
  | "rate_limited"
  | "message_too_large"
  | "invalid_format"
  | "server_error"
  | "client_error";

// Connection Pool Management
export interface ConnectionPool {
  maxConnections: number;
  currentConnections: number;
  availableConnections: number;
  connectionsByType: Record<ConnectionType, number>;
  connectionsByChannel: Record<string, number>;
  healthStatus: PoolHealthStatus;
}

export interface PoolHealthStatus {
  status: "healthy" | "degraded" | "critical";
  metrics: PoolMetrics;
  alerts: PoolAlert[];
}

export interface PoolMetrics {
  averageLatency: number;
  errorRate: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface PoolAlert {
  type: string;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  timestamp: string;
}

// Additional types needed by services
export interface RealtimeMessage {
  id: string;
  type: string;
  channel: string;
  data: any;
  timestamp: string;
  userId?: string;
}

export interface PresenceData {
  userId: string;
  status: "online" | "away" | "busy" | "offline";
  lastSeen: string;
  metadata?: Record<string, any>;
}

// Export alias for backwards compatibility
export type RealtimeEvent = RealTimeEvent;
