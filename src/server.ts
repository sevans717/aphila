import app from "./app";
import { logger } from "./utils/logger";
import { env } from "./config/env";
import { WebSocketService } from "./services/websocket.service";

console.log("Starting server...");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("DATABASE_URL:", process.env.DATABASE_URL);

const PORT = env.port;
const HOST = "0.0.0.0";

console.log(`Attempting to start server on ${HOST}:${PORT}`);

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server listening on http://${HOST}:${PORT}`);
  logger.info(`🚀 Server listening on http://${HOST}:${PORT}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`🌍 Environment: ${env.nodeEnv}`);
});

// Initialize WebSocket service
new WebSocketService(server);

// Handle server errors
server.on("error", (error) => {
  logger.error("Server error:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("SIGINT received - shutting down gracefully");
  logger.info("Shutting down server...");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received - shutting down gracefully");
  logger.info("Shutting down server...");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

// Add debugging for unhandled errors
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Add a timer to check if server is still running
setTimeout(() => {
  console.log("Server has been running for 10 seconds");
  logger.info("Server has been running for 10 seconds");
}, 10000);
