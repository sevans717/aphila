"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../config/env");
const createRateLimiter = () => {
    const windowMs = env_1.env.rateLimitWindowMs ?? 15 * 60 * 1000;
    const max = env_1.env.rateLimitMax ?? 1000;
    if (env_1.env.rateLimitRedisUrl) {
        try {
            // require optional dependency at runtime
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const RedisStore = require("rate-limit-redis");
            const client = new ioredis_1.default(env_1.env.rateLimitRedisUrl);
            return (0, express_rate_limit_1.default)({
                windowMs,
                max,
                // `rate-limit-redis` expects a client with `sendCommand` or similar
                store: new RedisStore({ client }),
                standardHeaders: true,
                legacyHeaders: false,
            });
        }
        catch (err) {
            // optional Redis store not available — fall back to in-memory limiter
            return (0, express_rate_limit_1.default)({
                windowMs,
                max,
                standardHeaders: true,
                legacyHeaders: false,
            });
        }
    }
    return (0, express_rate_limit_1.default)({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
    });
};
exports.createRateLimiter = createRateLimiter;
exports.default = exports.createRateLimiter;
//# sourceMappingURL=rateLimiter.js.map