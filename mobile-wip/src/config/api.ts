/**
 * API Configuration
 * Defines API client configuration, endpoints, and request/response handling
 */

// API Configuration
export interface ApiConfig {
  baseURL: string;
  version: string;
  timeout: number;
  retryPolicy: RetryPolicy;
  authentication: AuthConfig;
  headers: Record<string, string>;
  interceptors: InterceptorConfig;
  cache: CacheConfig;
  logging: LoggingConfig;
  endpoints: EndpointConfig;
  rateLimiting: RateLimitConfig;
  circuitBreaker: CircuitBreakerConfig;
}

export interface RetryPolicy {
  enabled: boolean;
  maxAttempts: number;
  baseDelay: number; // ms
  maxDelay: number; // ms
  backoffStrategy: "linear" | "exponential" | "fixed";
  jitter: boolean;
  retryableStatuses: number[];
  retryableErrors: string[];
}

export interface AuthConfig {
  type: "bearer" | "basic" | "api_key" | "oauth" | "custom";
  tokenRefresh: TokenRefreshConfig;
  storage: TokenStorageConfig;
  validation: TokenValidationConfig;
}

export interface TokenRefreshConfig {
  enabled: boolean;
  endpoint: string;
  thresholdMinutes: number;
  maxRetries: number;
  onFailure: "logout" | "prompt" | "redirect";
}

export interface TokenStorageConfig {
  type: "memory" | "secure_storage" | "keychain" | "encrypted_storage";
  key: string;
  encrypted: boolean;
  expirationKey?: string;
}

export interface TokenValidationConfig {
  validateExpiry: boolean;
  validateSignature: boolean;
  clockSkewTolerance: number; // seconds
}

export interface InterceptorConfig {
  request: RequestInterceptor[];
  response: ResponseInterceptor[];
  error: ErrorInterceptor[];
}

export interface RequestInterceptor {
  name: string;
  order: number;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface ResponseInterceptor {
  name: string;
  order: number;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface ErrorInterceptor {
  name: string;
  order: number;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface CacheConfig {
  enabled: boolean;
  storage: CacheStorage;
  defaultTTL: number; // seconds
  maxSize: number; // MB
  strategy: CacheStrategy;
  rules: CacheRule[];
}

export type CacheStorage =
  | "memory"
  | "async_storage"
  | "secure_storage"
  | "disk";
export type CacheStrategy =
  | "cache_first"
  | "network_first"
  | "cache_only"
  | "network_only"
  | "stale_while_revalidate";

export interface CacheRule {
  pattern: string;
  ttl: number; // seconds
  strategy: CacheStrategy;
  conditions?: CacheCondition[];
}

export interface CacheCondition {
  type: "method" | "status" | "header" | "param" | "custom";
  field?: string;
  value: any;
  operator: "equals" | "contains" | "regex" | "custom";
}

export interface LoggingConfig {
  enabled: boolean;
  level: "debug" | "info" | "warn" | "error";
  requestLogging: RequestLoggingConfig;
  responseLogging: ResponseLoggingConfig;
  sensitiveFields: string[];
  maxBodySize: number; // bytes
}

export interface RequestLoggingConfig {
  enabled: boolean;
  includeHeaders: boolean;
  includeBody: boolean;
  includeParams: boolean;
}

export interface ResponseLoggingConfig {
  enabled: boolean;
  includeHeaders: boolean;
  includeBody: boolean;
  includeStatus: boolean;
  includeTiming: boolean;
}

export interface EndpointConfig {
  auth: AuthEndpoints;
  user: UserEndpoints;
  matching: MatchingEndpoints;
  messaging: MessagingEndpoints;
  media: MediaEndpoints;
  community: CommunityEndpoints;
  notifications: NotificationEndpoints;
  analytics: AnalyticsEndpoints;
  admin: AdminEndpoints;
}

// Endpoint Definitions
export interface AuthEndpoints {
  login: string;
  logout: string;
  register: string;
  forgotPassword: string;
  resetPassword: string;
  verifyEmail: string;
  verifyPhone: string;
  refreshToken: string;
  profile: string;
  updateProfile: string;
  changePassword: string;
  enable2FA: string;
  disable2FA: string;
  verify2FA: string;
  socialLogin: SocialLoginEndpoints;
}

export interface SocialLoginEndpoints {
  google: string;
  facebook: string;
  apple: string;
  twitter: string;
  linkedin: string;
  github: string;
}

export interface UserEndpoints {
  profile: string;
  updateProfile: string;
  uploadAvatar: string;
  deleteAvatar: string;
  preferences: string;
  updatePreferences: string;
  privacy: string;
  updatePrivacy: string;
  block: string;
  unblock: string;
  report: string;
  delete: string;
  export: string;
}

export interface MatchingEndpoints {
  discover: string;
  like: string;
  pass: string;
  superLike: string;
  matches: string;
  matchDetails: string;
  unmatch: string;
  rewind: string;
  boost: string;
  filters: string;
  updateFilters: string;
}

export interface MessagingEndpoints {
  conversations: string;
  conversation: string;
  messages: string;
  sendMessage: string;
  editMessage: string;
  deleteMessage: string;
  markAsRead: string;
  typing: string;
  upload: string;
}

export interface MediaEndpoints {
  upload: string;
  download: string;
  delete: string;
  gallery: string;
  posts: string;
  createPost: string;
  updatePost: string;
  deletePost: string;
  likePost: string;
  commentPost: string;
  sharePost: string;
}

export interface CommunityEndpoints {
  groups: string;
  group: string;
  createGroup: string;
  joinGroup: string;
  leaveGroup: string;
  groupMembers: string;
  groupMessages: string;
  events: string;
  createEvent: string;
  joinEvent: string;
}

export interface NotificationEndpoints {
  list: string;
  markAsRead: string;
  markAllAsRead: string;
  delete: string;
  settings: string;
  updateSettings: string;
  subscribe: string;
  unsubscribe: string;
}

export interface AnalyticsEndpoints {
  events: string;
  track: string;
  metrics: string;
  funnel: string;
  cohort: string;
  retention: string;
}

export interface AdminEndpoints {
  users: string;
  reports: string;
  moderation: string;
  analytics: string;
  system: string;
  health: string;
}

// Rate Limiting
export interface RateLimitConfig {
  enabled: boolean;
  global: RateLimitRule;
  endpoints: Record<string, RateLimitRule>;
  storage: RateLimitStorage;
  headers: RateLimitHeaders;
}

export interface RateLimitRule {
  requests: number;
  window: number; // seconds
  burst?: number;
  strategy: "sliding_window" | "fixed_window" | "token_bucket";
}

export type RateLimitStorage = "memory" | "redis" | "database";

export interface RateLimitHeaders {
  limit: string; // header name for limit
  remaining: string; // header name for remaining
  reset: string; // header name for reset time
}

// Circuit Breaker
export interface CircuitBreakerConfig {
  enabled: boolean;
  global: CircuitBreakerSettings;
  endpoints: Record<string, CircuitBreakerSettings>;
}

export interface CircuitBreakerSettings {
  enabled: boolean;
  failureThreshold: number;
  timeoutMs: number;
  resetTimeoutMs: number;
  monitoringPeriodMs: number;
  expectedExceptionTypes?: string[];
  ignoreExceptionTypes?: string[];
}

// Request/Response Types
export interface ApiRequest<T = any> {
  endpoint: string;
  method: HttpMethod;
  data?: T;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  retry?: boolean;
  cache?: CacheOptions;
  metadata?: RequestMetadata;
}

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export interface CacheOptions {
  enabled: boolean;
  ttl?: number; // seconds
  strategy?: CacheStrategy;
  key?: string;
  tags?: string[];
}

export interface RequestMetadata {
  correlationId?: string;
  traceId?: string;
  userId?: string;
  sessionId?: string;
  deviceId?: string;
  source?: string;
  version?: string;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: ApiRequest;
  cached: boolean;
  timing: ResponseTiming;
  metadata?: ResponseMetadata;
}

export interface ResponseTiming {
  start: number;
  end: number;
  duration: number; // ms
  network: number; // ms
  processing: number; // ms
}

export interface ResponseMetadata {
  correlationId?: string;
  traceId?: string;
  server?: string;
  version?: string;
  cache?: CacheMetadata;
  rateLimit?: RateLimitInfo;
}

export interface CacheMetadata {
  hit: boolean;
  ttl: number;
  age: number;
  tags: string[];
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // timestamp
  retryAfter?: number; // seconds
}

// Error Handling
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  request: ApiRequest;
  response?: Partial<ApiResponse>;
  retryable: boolean;
  category: ApiErrorCategory;
}

export type ApiErrorCategory =
  | "network"
  | "timeout"
  | "authentication"
  | "authorization"
  | "validation"
  | "not_found"
  | "conflict"
  | "rate_limit"
  | "server_error"
  | "unavailable"
  | "unknown";

// Client Configuration
export interface ApiClientConfig {
  api: ApiConfig;
  storage: StorageConfig;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
  offline: OfflineConfig;
}

export interface StorageConfig {
  type: "async_storage" | "secure_storage" | "keychain" | "memory";
  encryption: EncryptionConfig;
  compression: CompressionConfig;
  quotas: StorageQuotas;
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: "AES-256-GCM" | "AES-128-GCM" | "ChaCha20-Poly1305";
  keyDerivation: "PBKDF2" | "scrypt" | "Argon2";
  iterations?: number;
  saltLength?: number;
}

export interface CompressionConfig {
  enabled: boolean;
  algorithm: "gzip" | "deflate" | "brotli";
  level: number; // 1-9
  threshold: number; // bytes
}

export interface StorageQuotas {
  maxSize: number; // MB
  maxItems: number;
  warningThreshold: number; // percentage
  cleanupStrategy: "lru" | "fifo" | "ttl" | "manual";
}

export interface SecurityConfig {
  certificatePinning: CertificatePinningConfig;
  requestSigning: RequestSigningConfig;
  dataValidation: DataValidationConfig;
}

export interface CertificatePinningConfig {
  enabled: boolean;
  pins: CertificatePin[];
  backup: boolean;
  reportURI?: string;
}

export interface CertificatePin {
  hostname: string;
  pins: string[];
  includeSubdomains: boolean;
  maxAge: number; // seconds
}

export interface RequestSigningConfig {
  enabled: boolean;
  algorithm: "HMAC-SHA256" | "HMAC-SHA512" | "RSA-SHA256";
  key: string;
  includeHeaders: string[];
  includeBody: boolean;
  timestamp: boolean;
  nonce: boolean;
}

export interface DataValidationConfig {
  enabled: boolean;
  schemas: Record<string, any>;
  strict: boolean;
  stripUnknown: boolean;
  validateResponses: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: MetricConfig[];
  events: EventConfig[];
  performance: PerformanceConfig;
  errors: ErrorMonitoringConfig;
}

export interface MetricConfig {
  name: string;
  type: "counter" | "gauge" | "histogram" | "timer";
  labels: string[];
  enabled: boolean;
  samplingRate?: number; // 0-1
}

export interface EventConfig {
  name: string;
  properties: string[];
  enabled: boolean;
  samplingRate?: number; // 0-1
  persistent?: boolean;
}

export interface PerformanceConfig {
  enabled: boolean;
  trackTiming: boolean;
  trackSize: boolean;
  trackRetries: boolean;
  trackCacheHits: boolean;
  slowRequestThreshold: number; // ms
}

export interface ErrorMonitoringConfig {
  enabled: boolean;
  reportErrors: boolean;
  includeStackTrace: boolean;
  includeRequestDetails: boolean;
  samplingRate: number; // 0-1
}

export interface OfflineConfig {
  enabled: boolean;
  storage: OfflineStorageConfig;
  queue: OfflineQueueConfig;
  sync: OfflineSyncConfig;
  detection: OfflineDetectionConfig;
}

export interface OfflineStorageConfig {
  maxSize: number; // MB
  ttl: number; // seconds
  strategy: "read_only" | "read_write" | "queue_only";
  endpoints: string[]; // cacheable endpoints
}

export interface OfflineQueueConfig {
  enabled: boolean;
  maxSize: number;
  persistence: boolean;
  retryInterval: number; // ms
  maxRetries: number;
  deduplicate: boolean;
}

export interface OfflineSyncConfig {
  enabled: boolean;
  strategy: "immediate" | "periodic" | "manual";
  interval: number; // seconds
  batchSize: number;
  conflictResolution: "client_wins" | "server_wins" | "merge" | "manual";
}

export interface OfflineDetectionConfig {
  methods: ("network_info" | "ping" | "request_timeout")[];
  pingEndpoint?: string;
  pingInterval: number; // ms
  timeout: number; // ms
}

// Response Transformers
export interface ResponseTransformer<TInput, TOutput> {
  name: string;
  transform: (data: TInput) => TOutput;
  condition?: (response: ApiResponse<TInput>) => boolean;
  order: number;
}

// Request Builders
export interface RequestBuilder {
  endpoint(endpoint: string): RequestBuilder;
  method(method: HttpMethod): RequestBuilder;
  data(data: any): RequestBuilder;
  params(params: Record<string, any>): RequestBuilder;
  headers(headers: Record<string, string>): RequestBuilder;
  timeout(timeout: number): RequestBuilder;
  retry(enabled: boolean): RequestBuilder;
  cache(options: CacheOptions): RequestBuilder;
  build(): ApiRequest;
}

// Pagination
export interface PaginationConfig {
  type: "offset" | "cursor" | "page";
  defaultPageSize: number;
  maxPageSize: number;
  pageParam: string;
  sizeParam: string;
  cursorParam?: string;
  offsetParam?: string;
}

export interface PaginatedRequest {
  page?: number;
  size?: number;
  cursor?: string;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page?: number;
  size: number;
  total: number;
  totalPages?: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

// Batch Operations
export interface BatchRequest {
  requests: ApiRequest[];
  parallel: boolean;
  maxConcurrency?: number;
  stopOnError: boolean;
  transaction: boolean;
}

export interface BatchResponse<T = any> {
  responses: Array<ApiResponse<T> | ApiError>;
  success: boolean;
  errors: ApiError[];
  timing: ResponseTiming;
}

// WebSocket Configuration
export interface WebSocketConfig {
  enabled: boolean;
  url: string;
  protocols?: string[];
  reconnect: ReconnectConfig;
  heartbeat: HeartbeatConfig;
  authentication: WSAuthConfig;
  messageQueue: MessageQueueConfig;
}

export interface ReconnectConfig {
  enabled: boolean;
  maxAttempts: number;
  initialDelay: number; // ms
  maxDelay: number; // ms
  backoffFactor: number;
  jitter: boolean;
}

export interface HeartbeatConfig {
  enabled: boolean;
  interval: number; // ms
  timeout: number; // ms
  message: string;
}

export interface WSAuthConfig {
  type: "token" | "header" | "query" | "message";
  field: string;
  refresh: boolean;
}

export interface MessageQueueConfig {
  enabled: boolean;
  maxSize: number;
  persistence: boolean;
  ordering: boolean;
}

// Upload Configuration
export interface UploadConfig {
  maxFileSize: number; // MB
  allowedTypes: string[];
  chunkSize: number; // MB
  parallel: boolean;
  maxConcurrency: number;
  resumable: boolean;
  validation: UploadValidation;
  progress: ProgressConfig;
  fallback: UploadFallback;
}

export interface UploadValidation {
  enabled: boolean;
  checkMimeType: boolean;
  checkFileExtension: boolean;
  scanForViruses: boolean;
  validateDimensions: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

export interface ProgressConfig {
  enabled: boolean;
  throttle: number; // ms
  includeSpeed: boolean;
  includeETA: boolean;
}

export interface UploadFallback {
  enabled: boolean;
  method: "form_data" | "base64" | "url";
  endpoint: string;
  chunkSize?: number;
}

// Realtime Configuration
export interface RealtimeConfig {
  enabled: boolean;
  url: string;
  path: string;
  autoConnect: boolean;
  reconnection: boolean;
  reconnectionAttempts: number;
  reconnectionDelay: number;
  maxReconnectionDelay: number;
  timeout: number;
  forceNew: boolean;
  transports: string[];
  upgrade: boolean;
  socketURL: string;
  connectionTimeout: number;
  heartbeatInterval: number;
}

// Simple ApiConfig object for apiClient usage
export const ApiConfig = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001",
  appName: "Sav3Mobile",
  version: "1.0.0",
};
