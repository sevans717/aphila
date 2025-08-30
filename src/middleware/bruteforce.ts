import { RequestHandler } from "express";

// Use a simple Map-based sliding window counter to avoid LRU typing issues in some environments
const attempts = new Map<string, { count: number; expiresAt: number }>();
const DEFAULT_TTL = 1000 * 60 * 60; // 1 hour

export const bruteforceProtection = (): RequestHandler => {
  const maxAttempts = 5;
  const ttl = DEFAULT_TTL;
  return (req, res, next) => {
    try {
      const identifier = req.body?.email || req.body?.username || "anon";
      const key = `${req.ip}:${identifier}`;
      const now = Date.now();
      const rec = attempts.get(key);
      if (rec && rec.expiresAt > now) {
        if (rec.count >= maxAttempts) {
          return res.status(429).json({
            success: false,
            message: "Too many attempts, try again later",
          });
        }
        rec.count += 1;
        attempts.set(key, rec);
      } else {
        attempts.set(key, { count: 1, expiresAt: now + ttl });
      }
      // Controllers may call attempts.delete(key) on successful auth to reset counter
      next();
    } catch {
      next();
    }
  };
};

export default bruteforceProtection;
