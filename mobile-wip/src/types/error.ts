/**
 * Error Types
 * Defines error handling, validation, and exception management
 */

// Base Error Types
export interface BaseError {
  code: string;
  message: string;
  timestamp: string;
  correlationId?: string;
  traceId?: string;
  context?: ErrorContext;
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  operation?: string;
  component?: string;
  version?: string;
  environment?: string;
  retryAttempts?: number;
  field?: string;
  value?: any;
  resource?: string;
  action?: string;
  metadata?: Record<string, any>;
}

// Application Errors
export interface ApplicationError extends BaseError {
  type: "application";
  category: ApplicationErrorCategory;
  severity: ErrorSeverity;
  recoverable: boolean;
  userMessage?: string;
  technicalDetails?: string;
  suggestions?: string[];
  relatedErrors?: string[];
  stackTrace?: string;
}

export type ApplicationErrorCategory =
  | "validation"
  | "authentication"
  | "authorization"
  | "business_logic"
  | "data_access"
  | "external_service"
  | "configuration"
  | "resource"
  | "network"
  | "timeout"
  | "rate_limit"
  | "concurrent_access"
  | "data_integrity"
  | "security"
  | "unknown";

export type ErrorSeverity = "low" | "medium" | "high" | "critical" | "fatal";

// API Errors
export interface APIError extends BaseError {
  type: "api";
  status: number;
  statusText: string;
  endpoint: string;
  method: string;
  requestBody?: any;
  responseBody?: any;
  headers?: Record<string, string>;
  retryable: boolean;
  retryCount?: number;
  retryAfter?: number;
}

// Validation Errors
export interface ValidationError extends BaseError {
  type: "validation";
  field?: string;
  value?: any;
  constraint: ValidationConstraint;
  violations: ValidationViolation[];
  schema?: string;
  path?: string;
}

export interface ValidationConstraint {
  type: ValidationType;
  parameters: Record<string, any>;
  message: string;
  code: string;
}

export type ValidationType =
  | "required"
  | "type"
  | "format"
  | "length"
  | "range"
  | "pattern"
  | "enum"
  | "unique"
  | "reference"
  | "custom";

export interface ValidationViolation {
  field: string;
  value: any;
  constraint: string;
  message: string;
  code: string;
  path: string;
  index?: number;
}

// Authentication Errors
export interface AuthenticationError extends BaseError {
  type: "authentication";
  reason: AuthenticationFailureReason;
  attempts: number;
  locked: boolean;
  lockoutUntil?: string;
  mfaRequired: boolean;
  supportedMethods?: string[];
}

export type AuthenticationFailureReason =
  | "invalid_credentials"
  | "account_locked"
  | "account_disabled"
  | "account_expired"
  | "password_expired"
  | "mfa_required"
  | "mfa_failed"
  | "device_not_trusted"
  | "location_restricted"
  | "time_restricted"
  | "rate_limited"
  | "session_expired"
  | "token_invalid"
  | "token_expired"
  | "unknown";

// Authorization Errors
export interface AuthorizationError extends BaseError {
  type: "authorization";
  resource: string;
  action: string;
  requiredPermissions: string[];
  userPermissions: string[];
  reason: AuthorizationFailureReason;
}

export type AuthorizationFailureReason =
  | "insufficient_permissions"
  | "resource_not_found"
  | "resource_forbidden"
  | "action_not_allowed"
  | "role_mismatch"
  | "scope_exceeded"
  | "context_invalid"
  | "policy_violation";

// Network Errors
export interface NetworkError extends BaseError {
  type: "network";
  category: NetworkErrorCategory;
  url?: string;
  method?: string;
  timeout?: number;
  retryable: boolean;
  connectionInfo?: ConnectionInfo;
}

export type NetworkErrorCategory =
  | "connection_failed"
  | "timeout"
  | "dns_resolution"
  | "ssl_error"
  | "proxy_error"
  | "server_unreachable"
  | "bandwidth_exceeded"
  | "offline"
  | "unknown";

export interface ConnectionInfo {
  type: "wifi" | "cellular" | "ethernet" | "unknown";
  strength: number; // 0-100
  speed: number; // Mbps
  latency: number; // ms
  stable: boolean;
}

// Data Errors
export interface DataError extends BaseError {
  type: "data";
  category: DataErrorCategory;
  entity?: string;
  field?: string;
  operation?: string;
  constraint?: string;
  conflictResolution?: ConflictResolution;
}

export type DataErrorCategory =
  | "not_found"
  | "duplicate"
  | "constraint_violation"
  | "foreign_key_violation"
  | "data_corruption"
  | "schema_mismatch"
  | "migration_failed"
  | "backup_failed"
  | "sync_conflict"
  | "version_mismatch";

export interface ConflictResolution {
  strategy: "merge" | "overwrite" | "manual" | "ignore";
  localVersion: any;
  remoteVersion: any;
  resolvedVersion?: any;
  conflictFields: string[];
}

// Business Logic Errors
export interface BusinessLogicError extends BaseError {
  type: "business_logic";
  rule: string;
  description: string;
  violatedConstraints: string[];
  suggestedActions: string[];
  bypassable: boolean;
  warningLevel: "info" | "warning" | "error" | "critical";
}

// System Errors
export interface SystemError extends BaseError {
  type: "system";
  category: SystemErrorCategory;
  component: string;
  resource?: string;
  threshold?: number;
  current?: number;
  impact: SystemImpact;
}

export type SystemErrorCategory =
  | "memory_exhausted"
  | "disk_full"
  | "cpu_overload"
  | "service_unavailable"
  | "dependency_failure"
  | "configuration_error"
  | "startup_failure"
  | "shutdown_error"
  | "health_check_failed"
  | "monitoring_alert";

export interface SystemImpact {
  severity: ErrorSeverity;
  scope: "user" | "feature" | "service" | "system" | "global";
  affectedUsers?: number;
  estimatedDowntime?: number; // minutes
  dataLoss: boolean;
  rollbackPossible: boolean;
}

// External Service Errors
export interface ExternalServiceError extends BaseError {
  type: "external_service";
  service: string;
  endpoint?: string;
  provider: string;
  category: ExternalServiceErrorCategory;
  status?: number;
  responseTime?: number;
  circuitBreakerState?: "closed" | "open" | "half_open";
}

export type ExternalServiceErrorCategory =
  | "service_unavailable"
  | "timeout"
  | "rate_limited"
  | "authentication_failed"
  | "quota_exceeded"
  | "bad_request"
  | "server_error"
  | "maintenance_mode"
  | "deprecated_api"
  | "configuration_error";

// Error Collection and Reporting
export interface ErrorReport {
  id: string;
  errors: AppError[];
  context: ErrorReportContext;
  timestamp: string;
  reportedBy?: string;
  severity: ErrorSeverity;
  category: string;
  resolved: boolean;
  resolvedAt?: string;
  resolution?: ErrorResolution;
  metrics: ErrorMetrics;
}

export type AppError =
  | ApplicationError
  | APIError
  | ValidationError
  | AuthenticationError
  | AuthorizationError
  | NetworkError
  | DataError
  | BusinessLogicError
  | SystemError
  | ExternalServiceError;

export interface ErrorReportContext {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
  session?: {
    id: string;
    duration: number;
    actions: string[];
  };
  device?: {
    type: string;
    os: string;
    browser?: string;
    version: string;
  };
  application?: {
    version: string;
    build: string;
    environment: string;
    feature: string;
  };
  request?: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
  };
}

export interface ErrorResolution {
  strategy: ResolutionStrategy;
  description: string;
  implementedBy: string;
  implementedAt: string;
  tested: boolean;
  rollbackPlan?: string;
  preventionMeasures: string[];
}

export type ResolutionStrategy =
  | "fix_deployed"
  | "configuration_change"
  | "workaround"
  | "user_guidance"
  | "service_restart"
  | "data_correction"
  | "rollback"
  | "escalated"
  | "wont_fix"
  | "duplicate";

export interface ErrorMetrics {
  frequency: number;
  affectedUsers: number;
  firstOccurrence: string;
  lastOccurrence: string;
  averageResolutionTime?: number; // minutes
  businessImpact: BusinessImpact;
  technicalMetrics: TechnicalMetrics;
}

export interface BusinessImpact {
  revenue: number;
  users: number;
  reputation: "none" | "minimal" | "moderate" | "significant" | "severe";
  sla_breach: boolean;
}

export interface TechnicalMetrics {
  responseTime: number; // ms
  throughput: number; // requests/second
  errorRate: number; // percentage
  availability: number; // percentage
  resourceUsage: ResourceUsage;
}

export interface ResourceUsage {
  cpu: number; // percentage
  memory: number; // MB
  disk: number; // MB
  network: number; // Mbps
}

// Error Handling Configuration
export interface ErrorHandlingConfig {
  global: GlobalErrorConfig;
  categories: CategoryErrorConfig[];
  reporting: ErrorReportingConfig;
  recovery: ErrorRecoveryConfig;
  monitoring: ErrorMonitoringConfig;
}

export interface GlobalErrorConfig {
  enabled: boolean;
  logLevel: LogLevel;
  includeStackTrace: boolean;
  includeSensitiveData: boolean;
  maskFields: string[];
  maxErrorsPerMinute: number;
  circuitBreakerThreshold: number;
}

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal" | "off";

export interface CategoryErrorConfig {
  category: string;
  enabled: boolean;
  logLevel: LogLevel;
  retryPolicy?: RetryPolicy;
  fallbackStrategy?: FallbackStrategy;
  userNotification: UserNotificationConfig;
}

export interface RetryPolicy {
  enabled: boolean;
  maxAttempts: number;
  backoffStrategy: "fixed" | "exponential" | "linear";
  initialDelay: number; // ms
  maxDelay: number; // ms
  jitter: boolean;
  retryableErrors: string[];
  nonRetryableErrors: string[];
}

export interface FallbackStrategy {
  type:
    | "default_value"
    | "cached_value"
    | "alternative_service"
    | "graceful_degradation"
    | "none";
  config: Record<string, any>;
  timeout: number; // ms
}

export interface UserNotificationConfig {
  enabled: boolean;
  showTechnicalDetails: boolean;
  customMessage?: string;
  actionButtons: UserActionButton[];
  dismissible: boolean;
  autoHide: boolean;
  hideDelay?: number; // ms
}

export interface UserActionButton {
  label: string;
  action:
    | "retry"
    | "report"
    | "contact_support"
    | "go_home"
    | "refresh"
    | "custom";
  config?: Record<string, any>;
  primary: boolean;
}

export interface ErrorReportingConfig {
  enabled: boolean;
  endpoints: ReportingEndpoint[];
  sampling: SamplingConfig;
  filters: ReportingFilter[];
  enrichment: EnrichmentConfig;
  privacy: PrivacyConfig;
}

export interface ReportingEndpoint {
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  timeout: number; // ms
  retries: number;
  batchSize?: number;
  flushInterval?: number; // ms
}

export interface SamplingConfig {
  enabled: boolean;
  rate: number; // 0-1
  strategyType: "random" | "deterministic" | "adaptive";
  rules: SamplingRule[];
}

export interface SamplingRule {
  condition: string;
  rate: number; // 0-1
  priority: number;
}

export interface ReportingFilter {
  type: "include" | "exclude";
  field: string;
  operator: "equals" | "contains" | "matches" | "greater_than" | "less_than";
  value: any;
  caseSensitive: boolean;
}

export interface EnrichmentConfig {
  enabled: boolean;
  includeUserInfo: boolean;
  includeDeviceInfo: boolean;
  includeSessionInfo: boolean;
  includePerformanceMetrics: boolean;
  customEnrichers: CustomEnricher[];
}

export interface CustomEnricher {
  name: string;
  function: string;
  async: boolean;
  timeout: number; // ms
}

export interface PrivacyConfig {
  enabled: boolean;
  anonymizeUsers: boolean;
  maskSensitiveFields: boolean;
  sensitiveFields: string[];
  dataRetention: number; // days
  consentRequired: boolean;
}

export interface ErrorRecoveryConfig {
  autoRecovery: AutoRecoveryConfig;
  manualRecovery: ManualRecoveryConfig;
  preventionMeasures: PreventionMeasure[];
}

export interface AutoRecoveryConfig {
  enabled: boolean;
  strategies: RecoveryStrategy[];
  maxAttempts: number;
  cooldownPeriod: number; // minutes
  successThreshold: number;
}

export interface RecoveryStrategy {
  name: string;
  conditions: string[];
  actions: RecoveryAction[];
  timeout: number; // ms
  priority: number;
}

export interface RecoveryAction {
  type:
    | "restart_service"
    | "clear_cache"
    | "reset_connection"
    | "fallback_mode"
    | "custom";
  config: Record<string, any>;
  timeout: number; // ms
}

export interface ManualRecoveryConfig {
  enabled: boolean;
  escalationRules: EscalationRule[];
  notifications: NotificationRule[];
  runbooks: Runbook[];
}

export interface EscalationRule {
  condition: string;
  delay: number; // minutes
  escalateTo: string[];
  message: string;
}

export interface NotificationRule {
  condition: string;
  channels: string[];
  severity: ErrorSeverity;
  template: string;
}

export interface Runbook {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  steps: RunbookStep[];
  automatable: boolean;
}

export interface RunbookStep {
  order: number;
  title: string;
  description: string;
  command?: string;
  checkpointType: "validation" | "rollback_point" | "decision" | "none";
  timeoutMinutes?: number;
}

export interface PreventionMeasure {
  type: "validation" | "monitoring" | "testing" | "configuration" | "training";
  description: string;
  implementation: string;
  effectiveness: number; // 0-10
  cost: "low" | "medium" | "high";
}

export interface ErrorMonitoringConfig {
  enabled: boolean;
  metrics: MonitoringMetric[];
  alerts: AlertRule[];
  dashboards: DashboardConfig[];
  thresholds: ThresholdConfig[];
}

export interface MonitoringMetric {
  name: string;
  type: "counter" | "gauge" | "histogram" | "summary";
  description: string;
  labels: string[];
  buckets?: number[];
  objectives?: Record<string, number>;
}

export interface AlertRule {
  name: string;
  condition: string;
  severity: "info" | "warning" | "critical";
  duration: string;
  channels: string[];
  runbook?: string;
  annotations: Record<string, string>;
}

export interface DashboardConfig {
  name: string;
  description: string;
  panels: DashboardPanel[];
  refreshInterval: string;
  timeRange: string;
}

export interface DashboardPanel {
  title: string;
  type: "graph" | "stat" | "table" | "heatmap" | "logs";
  query: string;
  visualization: Record<string, any>;
}

export interface ThresholdConfig {
  metric: string;
  warning: number;
  critical: number;
  operator: "greater_than" | "less_than" | "equals";
  window: string; // time window
  minSamples?: number;
}

// Error State Management
export interface ErrorState {
  hasError: boolean;
  errors: AppError[];
  lastError?: AppError;
  errorHistory: AppError[];
  retryCount: number;
  maxRetries: number;
  recovering: boolean;
  fallbackActive: boolean;
  userNotified: boolean;
  reportSent: boolean;
  contextPreserved: boolean;
}

export interface ErrorBoundaryInfo {
  componentStack: string;
  errorBoundary: string;
  eventId: string;
  originalError: Error;
  errorInfo: any;
}

// Utility Types for Error Handling
export type ErrorHandler<T = any> = (
  error: AppError,
  context?: ErrorContext
) => T;

export type ErrorMapper<TInput, TOutput> = (error: TInput) => TOutput;

export type ErrorValidator = (error: AppError) => boolean;

export type ErrorEnricher = (
  error: AppError,
  context: ErrorContext
) => AppError;

export interface ErrorHandlerRegistry {
  register(type: string, handler: ErrorHandler): void;
  unregister(type: string): void;
  handle(error: AppError): void;
  getHandler(type: string): ErrorHandler | undefined;
}

export interface ErrorTransformer {
  transform(error: Error): AppError;
  canTransform(error: Error): boolean;
  priority: number;
}

// Error Analytics
export interface ErrorAnalytics {
  totalErrors: number;
  errorRate: number;
  topErrors: ErrorSummary[];
  trends: ErrorTrend[];
  impacts: ImpactAnalysis[];
  recommendations: AnalyticsRecommendation[];
  timeRange: string;
  lastUpdated: string;
}

export interface ErrorSummary {
  code: string;
  message: string;
  count: number;
  percentage: number;
  affectedUsers: number;
  firstSeen: string;
  lastSeen: string;
  trend: "increasing" | "decreasing" | "stable";
}

export interface ErrorTrend {
  period: string;
  count: number;
  rate: number;
  change: number; // percentage change from previous period
  significant: boolean;
}

export interface ImpactAnalysis {
  category: string;
  severity: ErrorSeverity;
  userImpact: number;
  businessImpact: number;
  technicalDebt: number;
  priorityScore: number;
}

export interface AnalyticsRecommendation {
  type: "fix" | "monitoring" | "prevention" | "process";
  priority: "low" | "medium" | "high" | "critical";
  description: string;
  expectedImpact: string;
  effort: string;
  resources: string[];
}
