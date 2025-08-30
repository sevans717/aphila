import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { createServer } from "http";
import { config } from "./config";
import { logger } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import { rateLimiter } from "./middleware/rateLimiter";
import { authMiddleware } from "./middleware/auth";
import { uploadRoutes } from "./routes/upload";
import { mediaRoutes } from "./routes/media";
import { healthRoutes } from "./routes/health";
import { redisClient } from "./services/redis";

const app = express();
const server = createServer(app);

// Trust proxy (for rate limiting and real IPs)
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Allow for flexible media serving
  })
);

app.use(compression());

// CORS configuration
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Rate limiting
app.use("/api/upload", rateLimiter.upload);
app.use("/api/media", rateLimiter.general);

// Health check (no auth required)
app.use("/health", healthRoutes);

// API routes (auth required)
app.use("/api/upload", authMiddleware, uploadRoutes);
app.use("/api/media", authMiddleware, mediaRoutes);

// Error handling
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");

  server.close(async () => {
    try {
      await redisClient.disconnect();
      logger.info("Redis disconnected");
    } catch (error) {
      logger.error("Error disconnecting Redis:", error);
    }

    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");

  server.close(async () => {
    try {
      await redisClient.disconnect();
      logger.info("Redis disconnected");
    } catch (error) {
      logger.error("Error disconnecting Redis:", error);
    }

    process.exit(0);
  });
});

// Start server
const PORT = config.port;

server.listen(PORT, () => {
  logger.info(`Media proxy server running on port ${PORT}`);
  logger.info(`MinIO endpoint: ${config.minio.endpoint}`);
  logger.info(`Allowed origins: ${config.allowedOrigins.join(", ")}`);
});

export { app, server };
