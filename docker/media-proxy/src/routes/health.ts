import { Router, Request, Response } from "express";
import { redisClient } from "../services/redis";
import { minioClient } from "../services/minio";
import { config } from "../config";

const router = Router();

// Basic health check
router.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    service: "media-proxy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Detailed health check with dependencies
router.get("/detailed", async (req: Request, res: Response) => {
  const health = {
    status: "healthy",
    service: "media-proxy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dependencies: {
      redis: "unknown",
      minio: "unknown",
    },
  };

  try {
    // Check Redis
    await redisClient.ping();
    health.dependencies.redis = "healthy";
  } catch {
    health.dependencies.redis = "unhealthy";
    health.status = "degraded";
  }

  try {
    // Check MinIO
    await minioClient.bucketExists(config.buckets.media);
    health.dependencies.minio = "healthy";
  } catch {
    health.dependencies.minio = "unhealthy";
    health.status = "degraded";
  }

  const statusCode = health.status === "healthy" ? 200 : 503;
  res.status(statusCode).json(health);
});

// Readiness probe
router.get("/ready", async (req: Request, res: Response) => {
  try {
    // Check if all dependencies are ready
    await Promise.all([
      redisClient.ping(),
      minioClient.bucketExists(config.buckets.media),
    ]);

    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: "not ready",
      timestamp: new Date().toISOString(),
      error: "Dependencies not ready",
    });
  }
});

// Liveness probe
router.get("/live", (req: Request, res: Response) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
  });
});

export { router as healthRoutes };
