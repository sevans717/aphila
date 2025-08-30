/**
 * Media Management Types
 * Defines media handling, processing, storage, and content creation
 */

export interface MediaItem {
  id: string;
  userId: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  originalUrl?: string;
  fileName: string;
  mimeType: string;
  size: number; // bytes
  dimensions: MediaDimensions;
  duration?: number; // seconds for video/audio
  metadata: MediaMetadata;
  processing: ProcessingStatus;
  privacy: MediaPrivacy;
  analytics: MediaAnalytics;
  tags: string[];
  categories: MediaCategory[];
  createdAt: string;
  updatedAt: string;
}

export type MediaType =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "gif"
  | "sticker";

export interface MediaDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface MediaMetadata {
  originalFileName: string;
  uploadSource: UploadSource;
  deviceInfo?: DeviceInfo;
  location?: LocationData;
  exif?: ExifData;
  colorPalette?: string[];
  dominantColor?: string;
  isHDR: boolean;
  hasTransparency: boolean;
  frameRate?: number; // for videos
  codec?: string;
  bitrate?: number;
}

export type UploadSource =
  | "camera"
  | "gallery"
  | "file_picker"
  | "url"
  | "import";

export interface DeviceInfo {
  platform: "ios" | "android" | "web";
  model: string;
  osVersion: string;
  appVersion: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  city?: string;
  state?: string;
  country?: string;
}

export interface ExifData {
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  iso?: number;
  shutterSpeed?: string;
  flash?: boolean;
  dateTaken?: string;
  orientation?: number;
}

export interface ProcessingStatus {
  status: ProcessingState;
  progress: number; // 0-100
  stages: ProcessingStage[];
  error?: ProcessingError;
  startedAt: string;
  completedAt?: string;
}

export type ProcessingState =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface ProcessingStage {
  name: string;
  status: ProcessingState;
  progress: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface ProcessingError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface MediaPrivacy {
  visibility: MediaVisibility;
  allowDownload: boolean;
  allowShare: boolean;
  allowEmbed: boolean;
  watermark: boolean;
  expiresAt?: string;
  password?: string;
}

export type MediaVisibility =
  | "public"
  | "private"
  | "unlisted"
  | "friends_only";

export interface MediaAnalytics {
  views: number;
  uniqueViews: number;
  likes: number;
  shares: number;
  downloads: number;
  comments: number;
  avgViewDuration?: number; // seconds for video
  completionRate?: number; // 0-1 for video
  engagement: EngagementMetrics;
}

export interface EngagementMetrics {
  totalEngagements: number;
  engagementRate: number;
  topReferrers: string[];
  viewsByCountry: Record<string, number>;
  viewsByDevice: Record<string, number>;
}

export interface MediaCategory {
  id: string;
  name: string;
  parentId?: string;
  isSystem: boolean;
}

export interface MediaCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  mediaItems: string[]; // media IDs
  privacy: CollectionPrivacy;
  isShared: boolean;
  collaborators: string[]; // user IDs
  createdAt: string;
  updatedAt: string;
}

export interface CollectionPrivacy {
  visibility: MediaVisibility;
  allowCollaboration: boolean;
  allowComments: boolean;
}

export interface MediaFilter {
  id: string;
  name: string;
  category: FilterCategory;
  thumbnailUrl: string;
  isPremium: boolean;
  parameters: FilterParameters;
}

export type FilterCategory =
  | "color"
  | "vintage"
  | "artistic"
  | "portrait"
  | "landscape"
  | "custom";

export interface FilterParameters {
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  exposure: number;
  highlights: number;
  shadows: number;
  vibrance: number;
  clarity: number;
  vignette: number;
  grain: number;
  customSettings?: Record<string, any>;
}

export interface MediaEditor {
  tools: EditorTool[];
  history: EditAction[];
  currentIndex: number;
  maxHistory: number;
  autoSave: boolean;
}

export interface EditorTool {
  id: string;
  name: string;
  category: ToolCategory;
  icon: string;
  isEnabled: boolean;
  isPremium: boolean;
  settings: ToolSettings;
}

export type ToolCategory =
  | "basic"
  | "filters"
  | "effects"
  | "text"
  | "stickers"
  | "crop"
  | "advanced";

export interface ToolSettings {
  intensity: number;
  blend: BlendMode;
  opacity: number;
  parameters: Record<string, any>;
}

export type BlendMode =
  | "normal"
  | "overlay"
  | "multiply"
  | "screen"
  | "soft_light"
  | "hard_light";

export interface EditAction {
  id: string;
  type: EditActionType;
  tool: string;
  parameters: Record<string, any>;
  timestamp: string;
}

export type EditActionType =
  | "filter"
  | "adjustment"
  | "crop"
  | "resize"
  | "rotate"
  | "text"
  | "sticker"
  | "effect";

export interface MediaUpload {
  id: string;
  file: File | Blob;
  progress: number; // 0-100
  status: UploadStatus;
  error?: UploadError;
  result?: MediaItem;
  options: UploadOptions;
}

export type UploadStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface UploadError {
  code: UploadErrorCode;
  message: string;
  retryable: boolean;
}

export type UploadErrorCode =
  | "FILE_TOO_LARGE"
  | "INVALID_FORMAT"
  | "NETWORK_ERROR"
  | "SERVER_ERROR"
  | "QUOTA_EXCEEDED"
  | "PROCESSING_FAILED";

export interface UploadOptions {
  quality: number; // 0-1
  compression: CompressionSettings;
  resize?: ResizeOptions;
  watermark?: WatermarkOptions;
  privacy: MediaPrivacy;
  generateThumbnail: boolean;
  extractMetadata: boolean;
}

export interface CompressionSettings {
  enabled: boolean;
  quality: number; // 0-1
  maxSize: number; // bytes
  preserveMetadata: boolean;
}

export interface ResizeOptions {
  width?: number;
  height?: number;
  maintainAspectRatio: boolean;
  resizeMode: ResizeMode;
}

export type ResizeMode = "fit" | "fill" | "crop" | "scale";

export interface WatermarkOptions {
  enabled: boolean;
  type: WatermarkType;
  text?: string;
  image?: string;
  position: WatermarkPosition;
  opacity: number;
  size: number;
}

export type WatermarkType = "text" | "image" | "logo";
export type WatermarkPosition =
  | "top_left"
  | "top_right"
  | "bottom_left"
  | "bottom_right"
  | "center";

export interface CameraSettings {
  mode: CameraMode;
  quality: CameraQuality;
  flashMode: FlashMode;
  focusMode: FocusMode;
  aspectRatio: AspectRatio;
  timer: number; // seconds
  gridLines: boolean;
  mirrorFrontCamera: boolean;
  geotagging: boolean;
  stabilization: boolean;
}

export type CameraMode =
  | "photo"
  | "video"
  | "portrait"
  | "panorama"
  | "square"
  | "story";
export type CameraQuality = "low" | "medium" | "high" | "max";
export type FlashMode = "auto" | "on" | "off" | "torch";
export type FocusMode = "auto" | "manual" | "infinity" | "macro";
export type AspectRatio = "1:1" | "4:3" | "16:9" | "3:4" | "9:16";

export interface MediaStream {
  id: string;
  type: StreamType;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  streamUrl: string;
  isLive: boolean;
  viewerCount: number;
  startedAt?: string;
  endedAt?: string;
  quality: StreamQuality;
  settings: StreamSettings;
}

export type StreamType = "live" | "recorded" | "scheduled";
export type StreamQuality = "480p" | "720p" | "1080p" | "4k";

export interface StreamSettings {
  isPublic: boolean;
  allowChat: boolean;
  allowRecording: boolean;
  moderationEnabled: boolean;
  ageRestriction?: number;
}

export interface MediaStatistics {
  totalItems: number;
  totalSize: number; // bytes
  mediaByType: Record<MediaType, number>;
  mediaByMonth: Record<string, number>;
  topCategories: CategoryStats[];
  storageUsed: StorageInfo;
}

export interface CategoryStats {
  category: string;
  count: number;
  size: number;
}

export interface StorageInfo {
  used: number; // bytes
  available: number;
  total: number;
  percentage: number;
}

// Additional types needed by stores
export interface MediaProcessingSettings {
  autoResize: boolean;
  quality: number;
  format?: string;
  watermark?: boolean;
  compression: boolean;
}
