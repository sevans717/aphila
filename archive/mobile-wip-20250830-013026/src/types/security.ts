/**
 * Security Types
 * Defines security protocols, authentication, authorization, and threat protection
 */

// Authentication & Authorization
export interface AuthenticationState {
  isAuthenticated: boolean;
  user: AuthenticatedUser | null;
  session: UserSession | null;
  permissions: Permission[];
  roles: Role[];
  lastActivity: string;
  deviceTrust: DeviceTrustStatus;
  securityLevel: SecurityLevel;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
  username?: string;
  profile: UserSecurityProfile;
  security: UserSecuritySettings;
  mfa: MFASettings;
  devices: TrustedDevice[];
  sessions: UserSession[];
  loginHistory: LoginHistoryEntry[];
  securityEvents: SecurityEvent[];
  riskScore: number; // 0-100
  verificationLevel: VerificationLevel;
}

export interface UserSecurityProfile {
  passwordStrength: PasswordStrength;
  lastPasswordChange: string;
  failedLoginAttempts: number;
  accountLocked: boolean;
  lockoutUntil?: string;
  securityQuestions: SecurityQuestion[];
  recoveryOptions: RecoveryOption[];
  compromiseIndicators: CompromiseIndicator[];
}

export interface UserSecuritySettings {
  twoFactorRequired: boolean;
  biometricEnabled: boolean;
  sessionTimeout: number; // minutes
  ipWhitelist: string[];
  deviceWhitelist: string[];
  locationRestrictions: LocationRestriction[];
  activityMonitoring: boolean;
  privacyMode: PrivacyMode;
  dataEncryption: boolean;
  auditLogging: boolean;
}

export interface MFASettings {
  enabled: boolean;
  primaryMethod: MFAMethod;
  backupMethods: MFAMethod[];
  trustedDevices: TrustedDevice[];
  backupCodes: BackupCode[];
  lastVerification: string;
  requireForActions: MFARequirement[];
}

export interface UserSession {
  id: string;
  userId: string;
  deviceId: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  location?: GeolocationInfo;
  userAgent: string;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  isActive: boolean;
  permissions: string[];
  securityFlags: SessionSecurityFlag[];
  riskAssessment: RiskAssessment;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  scope: PermissionScope;
  actions: string[];
  conditions: PermissionCondition[];
  granted: boolean;
  grantedBy?: string;
  grantedAt?: string;
  expiresAt?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  level: number;
  permissions: string[];
  inherits: string[];
  assignedAt: string;
  assignedBy: string;
}

// Security Levels & Trust
export type SecurityLevel = "low" | "medium" | "high" | "critical" | "maximum";
export type VerificationLevel =
  | "unverified"
  | "basic"
  | "enhanced"
  | "premium"
  | "verified";
export type DeviceTrustStatus =
  | "unknown"
  | "untrusted"
  | "pending"
  | "trusted"
  | "compromised";
export type PrivacyMode = "standard" | "enhanced" | "maximum" | "incognito";

// Multi-Factor Authentication
export interface MFAMethod {
  id: string;
  type: MFAType;
  name: string;
  enabled: boolean;
  primary: boolean;
  configured: boolean;
  lastUsed?: string;
  failureCount: number;
  settings: MFAMethodSettings;
}

export type MFAType =
  | "sms"
  | "email"
  | "totp_app"
  | "push_notification"
  | "hardware_key"
  | "biometric"
  | "backup_codes"
  | "phone_call";

export interface MFAMethodSettings {
  phone?: string;
  email?: string;
  appName?: string;
  deviceId?: string;
  publicKey?: string;
  biometricType?: BiometricType;
  customSettings?: Record<string, any>;
}

export type BiometricType =
  | "fingerprint"
  | "face"
  | "voice"
  | "iris"
  | "palm"
  | "retina";

export interface MFARequirement {
  action: string;
  required: boolean;
  methods: MFAType[];
  conditions: MFACondition[];
}

export interface MFACondition {
  type: "location" | "device" | "time" | "risk_score" | "session_age";
  operator:
    | "equals"
    | "not_equals"
    | "greater_than"
    | "less_than"
    | "in"
    | "not_in";
  value: any;
}

export interface BackupCode {
  id: string;
  code: string;
  used: boolean;
  usedAt?: string;
  createdAt: string;
  expiresAt?: string;
}

// Device Security
export interface TrustedDevice {
  id: string;
  userId: string;
  name: string;
  deviceInfo: DeviceInfo;
  fingerprint: string;
  firstSeen: string;
  lastSeen: string;
  trustLevel: DeviceTrustLevel;
  status: DeviceStatus;
  location?: GeolocationInfo;
  securityFeatures: DeviceSecurityFeature[];
  riskIndicators: DeviceRiskIndicator[];
}

export interface DeviceInfo {
  platform: string;
  browser: string;
  version: string;
  os: string;
  osVersion: string;
  screenResolution: string;
  timezone: string;
  language: string;
  hardwareId?: string;
  modelName?: string;
  manufacturer?: string;
}

export type DeviceTrustLevel =
  | "unknown"
  | "low"
  | "medium"
  | "high"
  | "verified";
export type DeviceStatus =
  | "active"
  | "inactive"
  | "blocked"
  | "stolen"
  | "compromised";

export interface DeviceSecurityFeature {
  name: string;
  available: boolean;
  enabled: boolean;
  version?: string;
}

export interface DeviceRiskIndicator {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  detectedAt: string;
  resolved: boolean;
}

// Password Security
export interface PasswordStrength {
  score: number; // 0-100
  level: PasswordStrengthLevel;
  feedback: PasswordFeedback[];
  entropy: number;
  crackTime: string;
  commonPassword: boolean;
  breached: boolean;
  requirements: PasswordRequirement[];
}

export type PasswordStrengthLevel =
  | "very_weak"
  | "weak"
  | "fair"
  | "good"
  | "strong"
  | "very_strong";

export interface PasswordFeedback {
  type: "warning" | "suggestion" | "requirement";
  message: string;
  severity: "low" | "medium" | "high";
}

export interface PasswordRequirement {
  rule: string;
  description: string;
  met: boolean;
  required: boolean;
}

export interface SecurityQuestion {
  id: string;
  question: string;
  answerHash: string;
  createdAt: string;
  lastUsed?: string;
}

export interface RecoveryOption {
  type:
    | "email"
    | "phone"
    | "security_questions"
    | "trusted_contact"
    | "admin_override";
  value: string;
  verified: boolean;
  enabled: boolean;
  lastUsed?: string;
}

// Security Events & Monitoring
export interface SecurityEvent {
  id: string;
  userId: string;
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  description: string;
  metadata: SecurityEventMetadata;
  source: EventSource;
  detectedAt: string;
  resolvedAt?: string;
  status: SecurityEventStatus;
  actions: SecurityAction[];
  false_positive: boolean;
}

export type SecurityEventType =
  | "login_success"
  | "login_failure"
  | "password_change"
  | "mfa_enable"
  | "mfa_disable"
  | "device_added"
  | "device_removed"
  | "suspicious_activity"
  | "account_locked"
  | "account_unlocked"
  | "permission_change"
  | "data_access"
  | "data_export"
  | "privacy_change"
  | "breach_attempt"
  | "anomaly_detected"
  | "policy_violation";

export type SecurityEventSeverity =
  | "info"
  | "low"
  | "medium"
  | "high"
  | "critical"
  | "emergency";
export type SecurityEventStatus =
  | "new"
  | "investigating"
  | "confirmed"
  | "false_positive"
  | "resolved"
  | "archived";

export interface SecurityEventMetadata {
  ipAddress?: string;
  userAgent?: string;
  location?: GeolocationInfo;
  deviceId?: string;
  sessionId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  customFields?: Record<string, any>;
}

export interface EventSource {
  system: string;
  component: string;
  version: string;
  instance?: string;
}

export interface SecurityAction {
  type: SecurityActionType;
  description: string;
  automated: boolean;
  executedAt: string;
  executedBy?: string;
  result: ActionResult;
}

export type SecurityActionType =
  | "block_ip"
  | "lock_account"
  | "revoke_session"
  | "require_mfa"
  | "send_alert"
  | "log_event"
  | "quarantine_device"
  | "escalate_incident"
  | "notify_admin";

export interface ActionResult {
  success: boolean;
  error?: string;
  details?: Record<string, any>;
}

// Risk Assessment & Threat Detection
export interface RiskAssessment {
  score: number; // 0-100
  level: RiskLevel;
  factors: RiskFactor[];
  indicators: ThreatIndicator[];
  timestamp: string;
  validUntil: string;
  recommendations: SecurityRecommendation[];
}

export type RiskLevel =
  | "minimal"
  | "low"
  | "moderate"
  | "high"
  | "severe"
  | "critical";

export interface RiskFactor {
  name: string;
  category: RiskCategory;
  weight: number; // 0-1
  score: number; // 0-100
  description: string;
  evidence: string[];
  confidence: number; // 0-1
}

export type RiskCategory =
  | "authentication"
  | "device"
  | "location"
  | "behavior"
  | "network"
  | "temporal"
  | "reputation"
  | "context";

export interface ThreatIndicator {
  type: ThreatType;
  source: string;
  confidence: number; // 0-1
  severity: ThreatSeverity;
  description: string;
  evidence: Evidence[];
  firstSeen: string;
  lastSeen: string;
  active: boolean;
}

export type ThreatType =
  | "malware"
  | "phishing"
  | "brute_force"
  | "credential_stuffing"
  | "session_hijacking"
  | "man_in_middle"
  | "sql_injection"
  | "xss"
  | "csrf"
  | "ddos"
  | "social_engineering"
  | "account_takeover";

export type ThreatSeverity =
  | "informational"
  | "low"
  | "medium"
  | "high"
  | "critical";

export interface Evidence {
  type: string;
  value: string;
  timestamp: string;
  source: string;
  metadata?: Record<string, any>;
}

export interface SecurityRecommendation {
  id: string;
  title: string;
  description: string;
  priority: RecommendationPriority;
  category: string;
  actions: RecommendationAction[];
  impact: ImpactAssessment;
  effort: EffortEstimate;
}

export type RecommendationPriority =
  | "low"
  | "medium"
  | "high"
  | "urgent"
  | "critical";

export interface RecommendationAction {
  type: string;
  description: string;
  required: boolean;
  automated: boolean;
  parameters?: Record<string, any>;
}

export interface ImpactAssessment {
  security: number; // 0-10
  usability: number; // 0-10
  performance: number; // 0-10
  cost: number; // 0-10
}

export interface EffortEstimate {
  complexity: "low" | "medium" | "high";
  timeRequired: string;
  skillsRequired: string[];
  resourcesNeeded: string[];
}

// Geolocation & Access Control
export interface GeolocationInfo {
  latitude: number;
  longitude: number;
  accuracy: number;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  timezone?: string;
  isp?: string;
  organization?: string;
  asn?: string;
  vpn?: boolean;
  proxy?: boolean;
  tor?: boolean;
}

export interface LocationRestriction {
  type: "allow" | "deny";
  countries?: string[];
  regions?: string[];
  cities?: string[];
  coordinates?: GeofenceArea;
  timeRestriction?: TimeRestriction;
}

export interface GeofenceArea {
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number; // meters
  shape?: "circle" | "polygon";
  coordinates?: Array<[number, number]>;
}

export interface TimeRestriction {
  days: number[]; // 0-6, Sunday = 0
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  timezone: string;
}

// Compromise Detection
export interface CompromiseIndicator {
  type: CompromiseType;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number; // 0-1
  description: string;
  detectedAt: string;
  source: string;
  indicators: string[];
  resolved: boolean;
  resolvedAt?: string;
  actions: string[];
}

export type CompromiseType =
  | "credential_leak"
  | "data_breach"
  | "account_takeover"
  | "unusual_activity"
  | "malware_detection"
  | "phishing_attempt"
  | "identity_theft"
  | "fraud_pattern";

// Login History
export interface LoginHistoryEntry {
  id: string;
  userId: string;
  timestamp: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  location?: GeolocationInfo;
  mfaUsed: boolean;
  mfaMethod?: MFAType;
  riskScore: number;
  sessionId?: string;
  failureReason?: string;
  blocked: boolean;
  suspicious: boolean;
}

// Session Security
export interface SessionSecurityFlag {
  type: SessionFlagType;
  severity: "low" | "medium" | "high";
  description: string;
  timestamp: string;
  resolved: boolean;
}

export type SessionFlagType =
  | "concurrent_sessions"
  | "location_mismatch"
  | "device_change"
  | "suspicious_activity"
  | "privilege_escalation"
  | "unusual_timing"
  | "ip_change"
  | "user_agent_change";

// Permission System
export type PermissionScope =
  | "global"
  | "organization"
  | "project"
  | "resource"
  | "personal";

export interface PermissionCondition {
  type: "time" | "location" | "device" | "mfa" | "approval" | "custom";
  parameters: Record<string, any>;
  required: boolean;
}

// Encryption & Data Protection
export interface EncryptionInfo {
  algorithm: string;
  keySize: number;
  mode: string;
  version: string;
  keyId: string;
  encrypted: boolean;
  integrity: boolean;
  authenticity: boolean;
}

export interface DataProtectionSettings {
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  dataClassification: DataClassification[];
  retentionPolicies: RetentionPolicy[];
  accessLogging: boolean;
  anonymization: AnonymizationSettings;
}

export interface DataClassification {
  type: string;
  level: "public" | "internal" | "confidential" | "restricted" | "top_secret";
  handling: string[];
  retention: string;
  encryption: boolean;
}

export interface RetentionPolicy {
  dataType: string;
  retention: string;
  autoDelete: boolean;
  archival: boolean;
  legalHold: boolean;
}

export interface AnonymizationSettings {
  enabled: boolean;
  method: "pseudonymization" | "anonymization" | "synthetic";
  keyRotation: string;
  reversible: boolean;
}

// Security Compliance
export interface ComplianceFramework {
  name: string;
  version: string;
  requirements: ComplianceRequirement[];
  status: ComplianceStatus;
  lastAudit: string;
  nextAudit: string;
  certifications: Certification[];
}

export interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  category: string;
  mandatory: boolean;
  implemented: boolean;
  evidence: string[];
  lastReview: string;
}

export type ComplianceStatus =
  | "compliant"
  | "partial"
  | "non_compliant"
  | "pending"
  | "exempt";

export interface Certification {
  name: string;
  issuer: string;
  validFrom: string;
  validUntil: string;
  scope: string[];
  status: "valid" | "expired" | "revoked" | "suspended";
}

// Incident Response
export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: SecurityEventSeverity;
  category: IncidentCategory;
  status: IncidentStatus;
  assignee?: string;
  reporter: string;
  reportedAt: string;
  detectedAt: string;
  respondedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  affectedUsers: string[];
  affectedSystems: string[];
  timeline: IncidentTimelineEntry[];
  actions: IncidentAction[];
  lessons: string[];
  cost?: IncidentCost;
}

export type IncidentCategory =
  | "data_breach"
  | "service_disruption"
  | "malware"
  | "unauthorized_access"
  | "denial_of_service"
  | "phishing"
  | "insider_threat"
  | "system_compromise"
  | "policy_violation";

export type IncidentStatus =
  | "new"
  | "acknowledged"
  | "investigating"
  | "containing"
  | "eradicating"
  | "recovering"
  | "resolved"
  | "closed"
  | "reopened";

export interface IncidentTimelineEntry {
  timestamp: string;
  actor: string;
  action: string;
  description: string;
  automated: boolean;
}

export interface IncidentAction {
  id: string;
  type: string;
  description: string;
  assignee: string;
  dueDate?: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  completedAt?: string;
  result?: string;
}

export interface IncidentCost {
  direct: number;
  indirect: number;
  regulatory: number;
  reputation: number;
  total: number;
  currency: string;
}
