/**
 * Authentication Types and Interfaces
 * Defines authentication states, user sessions, and security-related types
 */

export type AuthStatus =
  | "authenticated"
  | "unauthenticated"
  | "loading"
  | "error";

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  isVerified: boolean;
  role: UserRole;
  permissions: Permission[];
  lastLoginAt: string;
  createdAt: string;
}

export type UserRole = "user" | "premium" | "moderator" | "admin";

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export interface BiometricAuthConfig {
  isEnabled: boolean;
  isAvailable: boolean;
  supportedTypes: BiometricType[];
  fallbackToPin: boolean;
}

export type BiometricType = "fingerprint" | "faceId" | "touchId" | "voiceId";

export interface TwoFactorAuth {
  isEnabled: boolean;
  method: "2fa_sms" | "2fa_email" | "2fa_app";
  backupCodes: string[];
  lastUsedAt?: string;
}

export interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  timestamp: string;
  location?: {
    city: string;
    country: string;
    coordinates: [number, number];
  };
}

export interface SecuritySettings {
  twoFactorAuth: TwoFactorAuth;
  biometricAuth: BiometricAuthConfig;
  sessionTimeout: number; // in minutes
  allowMultipleSessions: boolean;
  requirePasswordChange: boolean;
  passwordExpiryDays: number;
  loginNotifications: boolean;
}

export interface DeviceInfo {
  id: string;
  deviceId: string;
  deviceName: string;
  platform: "ios" | "android" | "web";
  osVersion: string;
  appVersion: string;
  isCurrentDevice: boolean;
  lastLoginAt: string;
  location?: {
    city: string;
    country: string;
  };
  pushTokens: string[];
}

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, any>;
}

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_VERIFIED"
  | "ACCOUNT_LOCKED"
  | "ACCOUNT_SUSPENDED"
  | "TOKEN_EXPIRED"
  | "REFRESH_TOKEN_INVALID"
  | "TWO_FACTOR_REQUIRED"
  | "BIOMETRIC_NOT_AVAILABLE"
  | "BIOMETRIC_FAILED"
  | "NETWORK_ERROR"
  | "SERVER_ERROR"
  | "UNKNOWN_ERROR"
  | "LOGIN_FAILED"
  | "REGISTRATION_FAILED"
  | "NO_REFRESH_TOKEN"
  | "TOKEN_REFRESH_FAILED"
  | "FORGOT_PASSWORD_FAILED"
  | "PASSWORD_RESET_FAILED"
  | "PASSWORD_CHANGE_FAILED"
  | "EMAIL_VERIFICATION_FAILED"
  | "RESEND_VERIFICATION_FAILED"
  | "PROFILE_UPDATE_FAILED"
  | "PROFILE_REFRESH_FAILED"
  | "ACCOUNT_DELETION_FAILED"
  | "NOT_AUTHENTICATED";

export interface OAuthProvider {
  name: "google" | "facebook" | "apple" | "twitter";
  clientId: string;
  isEnabled: boolean;
  scopes: string[];
}

export interface SocialAuthData {
  provider: string;
  providerId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  profile: {
    email: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  bannedPasswords: string[];
  historyCount: number; // how many previous passwords to remember
}

export interface AuthConfiguration {
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  oauthProviders: OAuthProvider[];
  biometricConfig: BiometricAuthConfig;
  twoFactorRequired: boolean;
}

// Additional interfaces needed by services
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tokenType: "Bearer";
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceId?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  acceptTerms: boolean;
  marketingOptIn?: boolean;
}

// AuthError class for creating error instances
export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "AuthError";
  }
}
