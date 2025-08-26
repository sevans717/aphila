"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginHandler = loginHandler;
exports.registerHandler = registerHandler;
exports.refreshHandler = refreshHandler;
exports.meHandler = meHandler;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const user_service_1 = require("../services/user.service");
async function registerHandler(req, res) {
    const { email, password } = req.body;
    const existing = await (0, user_service_1.findUserByEmail)(email);
    if (existing)
        return res.status(409).json({ error: "EmailInUse" });
    const user = await (0, user_service_1.createUser)(email, password);
    const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, env_1.env.jwtSecret, { expiresIn: "15m" });
    return res.status(201).json({
        token,
        user: { id: user.id, email: user.email, createdAt: user.createdAt },
    });
}
async function loginHandler(req, res) {
    const { email, password } = req.body;
    const user = await (0, user_service_1.findUserByEmail)(email);
    if (!user)
        return res.status(401).json({ error: "InvalidCredentials" });
    const valid = await bcrypt_1.default.compare(password, user.password);
    if (!valid)
        return res.status(401).json({ error: "InvalidCredentials" });
    const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, env_1.env.jwtSecret, { expiresIn: "15m" });
    return res.json({ token, user: { id: user.id, email: user.email } });
}
async function refreshHandler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
        return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.substring(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
        const newToken = jsonwebtoken_1.default.sign({ userId: payload.userId, email: payload.email }, env_1.env.jwtSecret, { expiresIn: "15m" });
        return res.json({ token: newToken });
    }
    catch (err) {
        return res.status(401).json({ error: "Unauthorized" });
    }
}
async function meHandler(req, res) {
    const user = req.user;
    if (!user)
        return res.status(401).json({ error: "Unauthorized" });
    return res.json({ user: { id: user.userId, email: user.email } });
}
//# sourceMappingURL=auth.controller.js.map