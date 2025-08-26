import cors from "cors";
import express from "express";
import fs from "fs";
import helmet from "helmet";
import { createServer } from "http";
import { env } from "./config/env";
import routes from "./routes";
import { logger } from "./utils/logger";
import { addRequestTracking } from "./utils/response";

const app = express();

// Ensure uploads directory exists
const uploadsDir = "./uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// --- Request logging middleware ---
app.use((req, res, next) => {
  logger.info("Incoming request", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
});

// --- Security & rate limiting ---
import createRateLimiter from "./middleware/rateLimiter";
export { default as validate } from "./middleware/requestValidation";
const limiter = createRateLimiter();
app.use(limiter as any);
app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigins.includes("*") ? true : env.corsOrigins,
    credentials: true,
  })
);

// --- Body parsers & static files ---
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use(addRequestTracking);

// --- Health check endpoint ---
app.get("/health", (_req, res) =>
  res.json({ status: "ok", ts: new Date().toISOString() })
);

// --- API routes ---
app.use("/api/v1", routes);

// --- Error handler ---
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error("Unhandled error", {
      msg: err.message,
      stack: err.stack,
      path: req.path,
    });
    res.status(500).json({
      success: false,
      message:
        env.nodeEnv === "production" ? "Internal server error" : err.message,
    });
  }
);

// --- 404 handler ---
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Endpoint not found" });
});

// --- HTTP server (websocket init can be added later) ---
const server = createServer(app);

export { server };
export default app;
