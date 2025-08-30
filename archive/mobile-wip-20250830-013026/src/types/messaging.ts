/**
 * Messaging and Chat Types
 * Defines real-time messaging, conversations, and communication features
 */

export interface Conversation {
  id: string;
  type: ConversationType;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  isActive: boolean;
  isMuted: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  metadata: ConversationMetadata;
}

export type ConversationType = "direct" | "group" | "community" | "support";

export interface ConversationParticipant {
  userId: string;
  role: ParticipantRole;
  joinedAt: string;
  lastReadAt?: string;
  isTyping: boolean;
  isOnline: boolean;
  permissions: ParticipantPermissions;
}

export type ParticipantRole = "member" | "admin" | "moderator" | "owner";

export interface ParticipantPermissions {
  canSendMessages: boolean;
  canSendMedia: boolean;
  canDeleteMessages: boolean;
  canInviteUsers: boolean;
  canRemoveUsers: boolean;
  canManageSettings: boolean;
}

export interface ConversationMetadata {
  isEncrypted: boolean;
  autoDeleteEnabled: boolean;
  autoDeleteDuration?: number; // hours
  customEmojis: CustomEmoji[];
  pinnedMessages: string[]; // message IDs
  sharedMedia: SharedMediaSummary;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  replyTo?: string; // parent message ID
  mentions: string[]; // user IDs
  reactions: MessageReaction[];
  attachments: MessageAttachment[];
  metadata: MessageMetadata;
  editHistory: MessageEdit[];
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  updatedAt?: string;
}

export type MessageType =
  | "text"
  | "image"
  | "video"
  | "voice"
  | "file"
  | "gif"
  | "sticker"
  | "location"
  | "contact"
  | "system"
  | "call_invite"
  | "call_end";

export type MessageStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "deleted";

export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  createdAt: string;
}

export interface MessageAttachment {
  id: string;
  type: AttachmentType;
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration?: number; // for audio/video
  dimensions?: {
    width: number;
    height: number;
  };
}

export type AttachmentType =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "voice_note";

export interface MessageMetadata {
  isEdited: boolean;
  isForwarded: boolean;
  forwardedFrom?: string;
  isEncrypted: boolean;
  priority: MessagePriority;
  customData?: Record<string, any>;
}

export type MessagePriority = "low" | "normal" | "high" | "urgent";

export interface MessageEdit {
  content: string;
  editedAt: string;
  reason?: string;
}

export interface CustomEmoji {
  id: string;
  name: string;
  url: string;
  category: string;
  isAnimated: boolean;
}

export interface SharedMediaSummary {
  images: number;
  videos: number;
  files: number;
  links: number;
  totalSize: number; // bytes
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  startedAt?: string;
}

export interface MessageDeliveryStatus {
  messageId: string;
  deliveredTo: DeliveryReceipt[];
  readBy: ReadReceipt[];
}

export interface DeliveryReceipt {
  userId: string;
  deliveredAt: string;
}

export interface ReadReceipt {
  userId: string;
  readAt: string;
}

export interface ConversationSettings {
  notifications: ConversationNotificationSettings;
  privacy: ConversationPrivacySettings;
  media: MediaSettings;
  security: SecuritySettings;
}

export interface ConversationNotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  showPreview: boolean;
  muteUntil?: string;
  customSound?: string;
}

export interface ConversationPrivacySettings {
  readReceipts: boolean;
  typingIndicators: boolean;
  onlineStatus: boolean;
  blockScreenshots: boolean;
  disappearingMessages: boolean;
  disappearingDuration?: number; // hours
}

export interface MediaSettings {
  autoDownload: boolean;
  highQuality: boolean;
  compression: CompressionLevel;
  allowedTypes: AttachmentType[];
  maxFileSize: number; // bytes
}

export type CompressionLevel = "none" | "low" | "medium" | "high";

export interface SecuritySettings {
  endToEndEncryption: boolean;
  verificationRequired: boolean;
  allowScreenshots: boolean;
  allowForwarding: boolean;
  allowCopyPaste: boolean;
}

export interface VoiceMessage {
  id: string;
  url: string;
  duration: number; // seconds
  waveform: number[]; // amplitude values for visualization
  isPlaying: boolean;
  playbackPosition: number; // seconds
  playbackSpeed: number; // 1.0 = normal speed
}

export interface GifData {
  id: string;
  url: string;
  previewUrl: string;
  title: string;
  tags: string[];
  dimensions: {
    width: number;
    height: number;
  };
  provider: string;
}

export interface StickerPack {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  stickers: Sticker[];
  isPremium: boolean;
  isOwned: boolean;
  price?: number;
}

export interface Sticker {
  id: string;
  url: string;
  keywords: string[];
  isAnimated: boolean;
}

export interface MessageDraft {
  conversationId: string;
  content: string;
  attachments: MessageAttachment[];
  replyTo?: string;
  mentions: string[];
  lastUpdated: string;
}

export interface ConversationInvite {
  id: string;
  conversationId: string;
  inviterId: string;
  inviteeId: string;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
}

export type InviteStatus = "pending" | "accepted" | "declined" | "expired";

export interface CallSession {
  id: string;
  conversationId: string;
  initiatorId: string;
  participants: CallParticipant[];
  type: CallType;
  status: CallStatus;
  startedAt: string;
  endedAt?: string;
  duration?: number; // seconds
  quality: CallQuality;
}

export type CallType = "voice" | "video";
export type CallStatus =
  | "initiating"
  | "ringing"
  | "active"
  | "ended"
  | "failed";

export interface CallParticipant {
  userId: string;
  joinedAt?: string;
  leftAt?: string;
  isMuted: boolean;
  isVideoEnabled: boolean;
  connectionQuality: ConnectionQuality;
}

export type ConnectionQuality = "poor" | "fair" | "good" | "excellent";

export interface CallQuality {
  overall: ConnectionQuality;
  video: VideoQuality;
  audio: AudioQuality;
}

export interface VideoQuality {
  resolution: string;
  frameRate: number;
  bitrate: number;
  packetsLost: number;
}

export interface AudioQuality {
  bitrate: number;
  packetsLost: number;
  jitter: number;
  latency: number;
}

// Additional type alias needed by stores
export type ChatMessage = Message;
