"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const fs_1 = __importDefault(require("fs"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const env_1 = require("./config/env");
const routes_1 = __importDefault(require("./routes"));
const logger_1 = require("./utils/logger");
const response_1 = require("./utils/response");
const app = (0, express_1.default)();
// Ensure uploads directory exists
const uploadsDir = './uploads';
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// --- Request logging middleware ---
app.use((req, res, next) => {
    logger_1.logger.info('Incoming request', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    next();
});
// --- Security & rate limiting ---
const RATE_LIMIT_WINDOW_MS = env_1.env.rateLimitWindowMs || 15 * 60 * 1000;
const RATE_LIMIT_MAX = env_1.env.rateLimitMax || 1000;
const limiter = (0, express_rate_limit_1.default)({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_1.env.corsOrigins.includes('*') ? true : env_1.env.corsOrigins,
    credentials: true,
}));
// --- Body parsers & static files ---
app.use(express_1.default.json({ limit: '25mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/uploads', express_1.default.static('uploads'));
app.use(response_1.addRequestTracking);
// --- Health check endpoint ---
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));
// --- API routes ---
app.use('/api/v1', routes_1.default);
// --- Error handler ---
app.use((err, req, res, _next) => {
    logger_1.logger.error('Unhandled error', { msg: err.message, stack: err.stack, path: req.path });
    res.status(500).json({ success: false, message: env_1.env.nodeEnv === 'production' ? 'Internal server error' : err.message });
});
// --- 404 handler ---
app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
});
// --- HTTP server (websocket init can be added later) ---
const server = (0, http_1.createServer)(app);
exports.server = server;
exports.default = app;
//# sourceMappingURL=app.js.map