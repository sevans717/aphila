import { logger } from "../utils/logger";

/**
 * Security event types for audit logging
 */
export enum SecurityEventType {
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGIN_ATTEMPT_BLOCKED = "LOGIN_ATTEMPT_BLOCKED",
  PASSWORD_RESET_REQUEST = "PASSWORD_RESET_REQUEST",
  PASSWORD_RESET_SUCCESS = "PASSWORD_RESET_SUCCESS",
  PASSWORD_CHANGE_SUCCESS = "PASSWORD_CHANGE_SUCCESS",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  ACCOUNT_UNLOCKED = "ACCOUNT_UNLOCKED",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  TOKEN_REFRESH_SUCCESS = "TOKEN_REFRESH_SUCCESS",
  TOKEN_REFRESH_FAILED = "TOKEN_REFRESH_FAILED",
}

/**
 * Logs security-related events for audit purposes
 */
export function logSecurityEvent(
  eventType: SecurityEventType,
  details: {
    userId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
    requestId?: string;
    metadata?: Record<string, any>;
  }
) {
  const logData = {
    eventType,
    timestamp: new Date().toISOString(),
    ...details,
  };

  // Log to security-specific logger
  logger.warn("Security Event", logData);

  // In production, you might want to send this to a separate security monitoring system
  // or store it in a dedicated security audit table
}

/**
 * Logs failed login attempts with rate limiting information
 */
export function logFailedLogin(
  email: string,
  ip: string,
  reason: string,
  requestId?: string
) {
  logSecurityEvent(SecurityEventType.LOGIN_FAILED, {
    email,
    ip,
    requestId,
    metadata: { reason },
  });
}

/**
 * Logs successful login events
 */
export function logSuccessfulLogin(
  userId: string,
  email: string,
  ip: string,
  requestId?: string
) {
  logSecurityEvent(SecurityEventType.LOGIN_SUCCESS, {
    userId,
    email,
    ip,
    requestId,
  });
}

/**
 * Logs blocked login attempts (brute force protection)
 */
export function logBlockedLogin(email: string, ip: string, requestId?: string) {
  logSecurityEvent(SecurityEventType.LOGIN_ATTEMPT_BLOCKED, {
    email,
    ip,
    requestId,
  });
}

/**
 * Logs suspicious activity
 */
export function logSuspiciousActivity(
  activity: string,
  ip: string,
  details: Record<string, any>,
  requestId?: string
) {
  logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, {
    ip,
    requestId,
    metadata: { activity, ...details },
  });
}

export default {
  logSecurityEvent,
  logFailedLogin,
  logSuccessfulLogin,
  logBlockedLogin,
  logSuspiciousActivity,
  SecurityEventType,
};
