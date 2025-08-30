"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = sanitizeInput;
exports.sanitizeHtmlInput = sanitizeHtmlInput;
const logger_1 = require("../utils/logger");
// Simple XSS sanitization function as fallback
function simpleSanitize(input) {
    if (typeof input !== "string")
        return input;
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
        .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "")
        .replace(/<[^>]*>/g, "");
}
/**
 * Sanitizes string inputs to prevent XSS attacks
 */
function sanitizeString(input) {
    if (typeof input !== "string")
        return input;
    try {
        // Try to use DOMPurify if available
        const DOMPurify = require("isomorphic-dompurify");
        return DOMPurify.sanitize(input, {
            ALLOWED_TAGS: [], // Remove all HTML tags
            ALLOWED_ATTR: [], // Remove all attributes
        });
    }
    catch {
        // Fallback to simple sanitization
        return simpleSanitize(input);
    }
}
/**
 * Recursively sanitizes object properties
 */
function sanitizeObject(obj) {
    if (obj === null || typeof obj !== "object") {
        return typeof obj === "string" ? sanitizeString(obj) : obj;
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeObject(item));
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
}
/**
 * Middleware to sanitize request body, query, and params
 */
function sanitizeInput(req, res, next) {
    try {
        // Skip sanitization for file uploads and specific content types
        const contentType = req.headers["content-type"] || "";
        if (contentType.includes("multipart/form-data")) {
            logger_1.logger.debug(`Skipping sanitization for multipart/form-data request to ${req.path}`);
            return next();
        }
        // Sanitize request body
        if (req.body && typeof req.body === "object") {
            req.body = sanitizeObject(req.body);
        }
        // Sanitize query parameters (in place, since req.query is read-only in newer Node.js)
        if (req.query && typeof req.query === "object") {
            for (const [key, value] of Object.entries(req.query)) {
                if (typeof value === "string") {
                    req.query[key] = sanitizeString(value);
                }
                else if (typeof value === "object" && value !== null) {
                    req.query[key] = sanitizeObject(value);
                }
            }
        }
        // Sanitize route parameters
        if (req.params && typeof req.params === "object") {
            req.params = sanitizeObject(req.params);
        }
        next();
    }
    catch (error) {
        logger_1.logger.error("Input sanitization error:", error);
        if (!res.headersSent) {
            res.status(400).json({ success: false, message: "Invalid input data" });
        }
        next(error);
    }
}
/**
 * Enhanced sanitization for specific fields that might contain HTML
 */
function sanitizeHtmlInput(allowedTags = []) {
    return (req, res, next) => {
        try {
            if (req.body && typeof req.body === "object") {
                req.body = sanitizeObjectWithHtml(req.body, allowedTags);
            }
            logger_1.logger.debug(`HTML sanitization applied to request body for ${req.path}`);
            next();
        }
        catch (error) {
            logger_1.logger.error("HTML input sanitization error:", error);
            if (!res.headersSent) {
                res.status(400).json({ success: false, message: "Invalid HTML input" });
            }
            next(error);
        }
    };
}
function sanitizeObjectWithHtml(obj, allowedTags) {
    if (obj === null || typeof obj !== "object") {
        if (typeof obj === "string") {
            try {
                const DOMPurify = require("isomorphic-dompurify");
                return DOMPurify.sanitize(obj, {
                    ALLOWED_TAGS: allowedTags,
                    ALLOWED_ATTR: ["href", "target", "rel"], // Basic attributes for links
                });
            }
            catch {
                return simpleSanitize(obj);
            }
        }
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeObjectWithHtml(item, allowedTags));
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObjectWithHtml(value, allowedTags);
    }
    return sanitized;
}
exports.default = sanitizeInput;
//# sourceMappingURL=sanitization.js.map