"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginHandler = loginHandler;
exports.registerHandler = registerHandler;
exports.refreshHandler = refreshHandler;
exports.meHandler = meHandler;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const user_service_1 = require("../services/user.service");
const password_1 = require("../utils/password");
const security_audit_1 = require("../utils/security-audit");
async function registerHandler(req, res) {
    const { email, password } = req.body;
    // Validate password strength
    const passwordValidation = (0, password_1.validatePasswordStrength)(password);
    if (!passwordValidation.isValid) {
        return res.status(400).json({
            error: "PasswordTooWeak",
            message: "Password does not meet security requirements",
            details: passwordValidation.errors,
        });
    }
    const existing = await (0, user_service_1.findUserByEmail)(email);
    if (existing)
        return res.status(409).json({ error: "EmailInUse" });
    const hashedPassword = await (0, password_1.hashPassword)(password);
    const user = await (0, user_service_1.createUser)(email, hashedPassword);
    const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, env_1.env.jwtSecret, {
        expiresIn: env_1.env.jwtExpiresIn || "15m",
    });
    const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, env_1.env.jwtRefreshSecret || env_1.env.jwtSecret, { expiresIn: env_1.env.jwtRefreshExpiresIn || "30d" });
    // Log successful registration
    (0, security_audit_1.logSuccessfulLogin)(user.id, user.email, req.ip, res.locals.requestId);
    return res.status(201).json({
        token,
        refreshToken,
        user: { id: user.id, email: user.email, createdAt: user.createdAt },
    });
}
async function loginHandler(req, res) {
    const { email, password } = req.body;
    const user = await (0, user_service_1.findUserByEmail)(email);
    if (!user) {
        (0, security_audit_1.logFailedLogin)(email, req.ip, "User not found", res.locals.requestId);
        return res.status(401).json({ error: "InvalidCredentials" });
    }
    const valid = await (0, password_1.verifyPassword)(password, user.password);
    if (!valid) {
        (0, security_audit_1.logFailedLogin)(email, req.ip, "Invalid password", res.locals.requestId);
        return res.status(401).json({ error: "InvalidCredentials" });
    }
    const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, env_1.env.jwtSecret, {
        expiresIn: env_1.env.jwtExpiresIn || "15m",
    });
    const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, env_1.env.jwtRefreshSecret || env_1.env.jwtSecret, { expiresIn: env_1.env.jwtRefreshExpiresIn || "30d" });
    // Log successful login
    (0, security_audit_1.logSuccessfulLogin)(user.id, user.email, req.ip, res.locals.requestId);
    return res.json({
        token,
        refreshToken,
        user: { id: user.id, email: user.email },
    });
}
async function refreshHandler(req, res) {
    // Accept either a refresh token in the body or a bearer token for compatibility
    const providedRefresh = req.body?.refreshToken;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7)
        : undefined;
    const tokenToVerify = providedRefresh || bearerToken;
    if (!tokenToVerify)
        return res.status(401).json({ error: "Unauthorized" });
    // Verify against refresh secret if provided, otherwise try access secret for compatibility
    const secrets = [env_1.env.jwtRefreshSecret, env_1.env.jwtSecret].filter(Boolean);
    let payload = null;
    for (const secret of secrets) {
        try {
            payload = jsonwebtoken_1.default.verify(tokenToVerify, secret);
            break;
        }
        catch {
            // try next
        }
    }
    if (!payload)
        return res.status(401).json({ error: "Unauthorized" });
    // Issue new access token (and rotate refresh token)
    const newAccessToken = jsonwebtoken_1.default.sign({ userId: payload.userId, email: payload.email }, env_1.env.jwtSecret, { expiresIn: env_1.env.jwtExpiresIn || "15m" });
    const newRefreshToken = jsonwebtoken_1.default.sign({ userId: payload.userId, email: payload.email }, env_1.env.jwtRefreshSecret || env_1.env.jwtSecret, { expiresIn: env_1.env.jwtRefreshExpiresIn || "30d" });
    return res.json({ token: newAccessToken, refreshToken: newRefreshToken });
}
async function meHandler(req, res) {
    const user = req.user;
    if (!user)
        return res.status(401).json({ error: "Unauthorized" });
    return res.json({ user: { id: user.userId, email: user.email } });
}
//# sourceMappingURL=auth.controller.js.map