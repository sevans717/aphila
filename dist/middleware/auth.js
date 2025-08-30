"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAuth = withAuth;
exports.auth = auth;
exports.requireAuth = requireAuth;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jwt = require("jsonwebtoken");
const env_1 = require("../config/env");
const response_1 = require("../utils/response");
// Type-safe wrapper for authenticated route handlers
function withAuth(handler) {
    return (req, res, next) => {
        return handler(req, res, next);
    };
}
// Lightweight middleware that attaches `user` if a valid token is present.
function auth(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
        return next();
    const token = authHeader.substring(7);
    try {
        const payload = jwt.verify(token, env_1.env.jwtAccessSecret);
        // Basic expiry check (jwt.verify should throw if expired, but validate defensively)
        if (payload.exp && Date.now() / 1000 > payload.exp)
            return next();
        req.user = {
            id: payload.userId,
            userId: payload.userId,
            email: payload.email,
            roles: payload.roles,
        };
    }
    catch {
        // ignore invalid token for optional auth
    }
    return next();
}
// Strict middleware that requires a valid Bearer token.
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
        return response_1.ResponseHelper.unauthorized(res);
    const token = authHeader.substring(7);
    try {
        const payload = jwt.verify(token, env_1.env.jwtAccessSecret);
        req.user = {
            id: payload.userId,
            userId: payload.userId,
            email: payload.email,
            roles: payload.roles,
        };
        return next();
    }
    catch {
        // If expired and refresh token is provided in cookie/header, we could attempt rotation here
        return response_1.ResponseHelper.unauthorized(res, "Unauthorized");
    }
}
//# sourceMappingURL=auth.js.map