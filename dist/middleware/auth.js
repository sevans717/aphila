"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = auth;
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
// Lightweight middleware that attaches `user` if a valid token is present.
function auth(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
        return next();
    const token = authHeader.substring(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
        req.user = {
            id: payload.userId,
            userId: payload.userId,
            email: payload.email,
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
        return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.substring(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
        req.user = {
            id: payload.userId,
            userId: payload.userId,
            email: payload.email,
        };
        return next();
    }
    catch {
        return res.status(401).json({ error: "Unauthorized" });
    }
}
//# sourceMappingURL=auth.js.map