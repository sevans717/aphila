"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityEventType = void 0;
exports.logSecurityEvent = logSecurityEvent;
exports.logFailedLogin = logFailedLogin;
exports.logSuccessfulLogin = logSuccessfulLogin;
exports.logBlockedLogin = logBlockedLogin;
exports.logSuspiciousActivity = logSuspiciousActivity;
const logger_1 = require("../utils/logger");
/**
 * Security event types for audit logging
 */
var SecurityEventType;
(function (SecurityEventType) {
    SecurityEventType["LOGIN_SUCCESS"] = "LOGIN_SUCCESS";
    SecurityEventType["LOGIN_FAILED"] = "LOGIN_FAILED";
    SecurityEventType["LOGIN_ATTEMPT_BLOCKED"] = "LOGIN_ATTEMPT_BLOCKED";
    SecurityEventType["PASSWORD_RESET_REQUEST"] = "PASSWORD_RESET_REQUEST";
    SecurityEventType["PASSWORD_RESET_SUCCESS"] = "PASSWORD_RESET_SUCCESS";
    SecurityEventType["PASSWORD_CHANGE_SUCCESS"] = "PASSWORD_CHANGE_SUCCESS";
    SecurityEventType["ACCOUNT_LOCKED"] = "ACCOUNT_LOCKED";
    SecurityEventType["ACCOUNT_UNLOCKED"] = "ACCOUNT_UNLOCKED";
    SecurityEventType["SUSPICIOUS_ACTIVITY"] = "SUSPICIOUS_ACTIVITY";
    SecurityEventType["UNAUTHORIZED_ACCESS"] = "UNAUTHORIZED_ACCESS";
    SecurityEventType["TOKEN_REFRESH_SUCCESS"] = "TOKEN_REFRESH_SUCCESS";
    SecurityEventType["TOKEN_REFRESH_FAILED"] = "TOKEN_REFRESH_FAILED";
})(SecurityEventType || (exports.SecurityEventType = SecurityEventType = {}));
/**
 * Logs security-related events for audit purposes
 */
function logSecurityEvent(eventType, details) {
    const logData = {
        eventType,
        timestamp: new Date().toISOString(),
        ...details,
    };
    // Log to security-specific logger
    logger_1.logger.warn("Security Event", logData);
    // In production, you might want to send this to a separate security monitoring system
    // or store it in a dedicated security audit table
}
/**
 * Logs failed login attempts with rate limiting information
 */
function logFailedLogin(email, ip, reason, requestId) {
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
function logSuccessfulLogin(userId, email, ip, requestId) {
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
function logBlockedLogin(email, ip, requestId) {
    logSecurityEvent(SecurityEventType.LOGIN_ATTEMPT_BLOCKED, {
        email,
        ip,
        requestId,
    });
}
/**
 * Logs suspicious activity
 */
function logSuspiciousActivity(activity, ip, details, requestId) {
    logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, {
        ip,
        requestId,
        metadata: { activity, ...details },
    });
}
exports.default = {
    logSecurityEvent,
    logFailedLogin,
    logSuccessfulLogin,
    logBlockedLogin,
    logSuspiciousActivity,
    SecurityEventType,
};
//# sourceMappingURL=security-audit.js.map