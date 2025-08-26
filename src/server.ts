import { server } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";
import { WebSocketService } from "./services/websocket.service";
import { logger } from "./utils/logger";

// Start server with startup error handling
let appServer: any;
let webSocketService: WebSocketService;

async function startServer() {
  try {
    console.log(`🚀 Starting server on port ${env.port}...`);
    console.log(`📁 Current working directory: ${process.cwd()}`);
    console.log(`🌐 Environment: ${env.nodeEnv}`);

    // Quick DB connectivity check (helps detect PgBouncer issues early)
    const maxRetries = 5;
    const retryDelayMs = 2000;
    let attempt = 0;
    async function checkDb() {
      attempt++;
      try {
        // Use a minimal Prisma query to validate connection
        await prisma.$queryRaw`SELECT 1`;
        console.log("✅ Database connectivity OK");
        return true;
      } catch (dbErr) {
        logger.warn(
          `DB connectivity check failed (attempt ${attempt}/${maxRetries})`,
          { err: dbErr }
        );
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, retryDelayMs));
          return checkDb();
        }
        logger.error(
          "DB connectivity check failed after retries; continuing startup but Prisma may fail at runtime",
          { err: dbErr }
        );
        return false;
      }
    }

    // Run DB connectivity check and await up to the retry window so PgBouncer issues are surfaced early.
    const dbCheckPromise = checkDb().catch((err) => {
      logger.error("Unexpected error during DB check", { err });
    });

    // Await the check but only for the total configured retry window to avoid long blocking startups
    const maxWaitMs = maxRetries * retryDelayMs + 500; // small buffer
    await Promise.race([
      dbCheckPromise,
      new Promise((r) => setTimeout(r, maxWaitMs)),
    ]);

    appServer = server.listen(env.port, "0.0.0.0", () => {
      console.log(
        `✅ Server successfully listening on http://0.0.0.0:${env.port}`
      );
      console.log(`🔗 Health check: http://localhost:${env.port}/health`);
      console.log(`🔗 API base: http://localhost:${env.port}/api/v1`);

      // Initialize WebSocket service (don't crash server if it fails)
      try {
        webSocketService = new WebSocketService(server);
        (global as any).webSocketService = webSocketService;

        logger.info("Server listening with WebSocket support", {
          port: env.port,
          nodeEnv: env.nodeEnv,
          onlineUsers: webSocketService.getOnlineUsersCount(),
        });
      } catch (wsErr) {
        logger.error(
          "Failed to initialize WebSocket service; continuing without WS",
          { err: wsErr }
        );
      }
    });

    appServer.on("error", (err: any) => {
      console.error("❌ Server error:", err);
      if (err.code === "EADDRINUSE") {
        console.error(`💥 Port ${env.port} is already in use!`);
        process.exit(1);
      }
      if (err.code === "EACCES") {
        console.error(`💥 Permission denied for port ${env.port}!`);
        process.exit(1);
      }
    });

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      logger.info("SIGTERM received");
      if (webSocketService) {
        webSocketService.close();
      }
      if (appServer) {
        appServer.close(async () => {
          await prisma.$disconnect();
          // Add other resource cleanup here if needed
          process.exit(0);
        });
      }
    });

    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Rejection", { reason });
    });

    process.on("uncaughtException", (err) => {
      logger.error("Uncaught Exception", { err });
      process.exit(1);
    });
  } catch (err) {
    logger.error("Failed to start server", { err });
    process.exit(1);
  }
}

startServer();
