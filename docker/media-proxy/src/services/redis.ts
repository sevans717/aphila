import Redis from "ioredis";
import { config } from "../config";
import { logger } from "../utils/logger";

// Create Redis client
export const redisClient = new Redis(config.redis.url, {
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Redis event handlers
redisClient.on("connect", () => {
  logger.info("Redis client connected");
});

redisClient.on("ready", () => {
  logger.info("Redis client ready");
});

redisClient.on("error", (error) => {
  logger.error("Redis client error:", error);
});

redisClient.on("close", () => {
  logger.info("Redis client connection closed");
});

redisClient.on("reconnecting", () => {
  logger.info("Redis client reconnecting");
});

// Helper functions
export class RedisService {
  static async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await redisClient.setex(key, ttl, value);
      } else {
        await redisClient.set(key, value);
      }
    } catch (error) {
      logger.error(`Failed to set Redis key ${key}:`, error);
      throw error;
    }
  }

  static async get(key: string): Promise<string | null> {
    try {
      return await redisClient.get(key);
    } catch (error) {
      logger.error(`Failed to get Redis key ${key}:`, error);
      throw error;
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error(`Failed to delete Redis key ${key}:`, error);
      throw error;
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Failed to check Redis key ${key}:`, error);
      throw error;
    }
  }

  static async hset(key: string, field: string, value: string): Promise<void> {
    try {
      await redisClient.hset(key, field, value);
    } catch (error) {
      logger.error(`Failed to set Redis hash ${key}.${field}:`, error);
      throw error;
    }
  }

  static async hget(key: string, field: string): Promise<string | null> {
    try {
      return await redisClient.hget(key, field);
    } catch (error) {
      logger.error(`Failed to get Redis hash ${key}.${field}:`, error);
      throw error;
    }
  }

  static async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await redisClient.hgetall(key);
    } catch (error) {
      logger.error(`Failed to get Redis hash ${key}:`, error);
      throw error;
    }
  }

  static async expire(key: string, ttl: number): Promise<void> {
    try {
      await redisClient.expire(key, ttl);
    } catch (error) {
      logger.error(`Failed to set TTL for Redis key ${key}:`, error);
      throw error;
    }
  }

  static async incr(key: string): Promise<number> {
    try {
      return await redisClient.incr(key);
    } catch (error) {
      logger.error(`Failed to increment Redis key ${key}:`, error);
      throw error;
    }
  }
}
