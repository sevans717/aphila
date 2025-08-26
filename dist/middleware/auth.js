"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = auth;
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function auth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.substring(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
        // Attach both id and userId for compatibility with various routes
        req.user = { id: payload.userId, userId: payload.userId, email: payload.email };
        next();
    }
    catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.substring(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
        // Attach both id and userId for compatibility
        req.user = { id: payload.userId, userId: payload.userId, email: payload.email };
        next();
    }
    catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}
//# sourceMappingURL=auth.js.map