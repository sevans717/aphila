/**
 * Security event types for audit logging
 */
export declare enum SecurityEventType {
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
    TOKEN_REFRESH_FAILED = "TOKEN_REFRESH_FAILED"
}
/**
 * Logs security-related events for audit purposes
 */
export declare function logSecurityEvent(eventType: SecurityEventType, details: {
    userId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
    requestId?: string;
    metadata?: Record<string, any>;
}): void;
/**
 * Logs failed login attempts with rate limiting information
 */
export declare function logFailedLogin(email: string, ip: string, reason: string, requestId?: string): void;
/**
 * Logs successful login events
 */
export declare function logSuccessfulLogin(userId: string, email: string, ip: string, requestId?: string): void;
/**
 * Logs blocked login attempts (brute force protection)
 */
export declare function logBlockedLogin(email: string, ip: string, requestId?: string): void;
/**
 * Logs suspicious activity
 */
export declare function logSuspiciousActivity(activity: string, ip: string, details: Record<string, any>, requestId?: string): void;
declare const _default: {
    logSecurityEvent: typeof logSecurityEvent;
    logFailedLogin: typeof logFailedLogin;
    logSuccessfulLogin: typeof logSuccessfulLogin;
    logBlockedLogin: typeof logBlockedLogin;
    logSuspiciousActivity: typeof logSuspiciousActivity;
    SecurityEventType: typeof SecurityEventType;
};
export default _default;
//# sourceMappingURL=security-audit.d.ts.map