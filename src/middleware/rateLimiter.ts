import rateLimit from "express-rate-limit";
import Redis from "ioredis";
import { env } from "../config/env";

export const createRateLimiter = () => {
  const windowMs = env.rateLimitWindowMs ?? 15 * 60 * 1000;
  const max = env.rateLimitMax ?? 1000;

  if (env.rateLimitRedisUrl) {
    try {
      // require optional dependency at runtime
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const RedisStore = require("rate-limit-redis");
      const client = new Redis(env.rateLimitRedisUrl);
      return rateLimit({
        windowMs,
        max,
        // `rate-limit-redis` expects a client with `sendCommand` or similar
        store: new RedisStore({ client }) as any,
        standardHeaders: true,
        legacyHeaders: false,
      });
    } catch (err) {
      // optional Redis store not available — fall back to in-memory limiter
      console.warn(
        "Redis store not available for rate limiter, falling back to in-memory:",
        err
      );
      return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
      });
    }
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
  });
};

export default createRateLimiter;

export const createAuthRateLimiter = () => {
  const windowMs = env.rateLimitWindowMs
    ? Math.min(env.rateLimitWindowMs, 60 * 60 * 1000)
    : 15 * 60 * 1000; // cap at 1h
  // Default to stricter limits for auth endpoints
  const max = env.rateLimitMax && env.rateLimitMax < 50 ? env.rateLimitMax : 10;

  if (env.rateLimitRedisUrl) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const RedisStore = require("rate-limit-redis");
      const client = new Redis(env.rateLimitRedisUrl);
      return rateLimit({
        windowMs,
        max,
        store: new RedisStore({ client }) as any,
        standardHeaders: true,
        legacyHeaders: false,
      });
    } catch (err) {
      console.warn(
        "Redis store not available for auth rate limiter, falling back to in-memory:",
        err
      );
      return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
      });
    }
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
  });
};
