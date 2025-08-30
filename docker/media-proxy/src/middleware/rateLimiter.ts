import { RateLimiterRedis } from "rate-limiter-flexible";
import { Request, Response, NextFunction } from "express";
import { redisClient } from "../services/redis";
import { MediaProxyError } from "./errorHandler";

// Rate limiter instances
const uploadRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "media_upload_rl",
  points: 10, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 300, // Block for 5 minutes if limit exceeded
});

const generalRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "media_general_rl",
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 60, // Block for 1 minute if limit exceeded
});

// Rate limiter middleware factory
function createRateLimiterMiddleware(
  limiter: RateLimiterRedis,
  errorMessage: string
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const key = req.ip || "unknown";
      await limiter.consume(key);
      next();
    } catch (rejRes: any) {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      res.set("Retry-After", String(secs));

      throw new MediaProxyError(
        `${errorMessage}. Try again in ${secs} seconds.`,
        429
      );
    }
  };
}

export const rateLimiter = {
  upload: createRateLimiterMiddleware(
    uploadRateLimiter,
    "Too many upload requests"
  ),
  general: createRateLimiterMiddleware(generalRateLimiter, "Too many requests"),
};
