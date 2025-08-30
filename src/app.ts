import _cors from "cors";
import express from "express";
import fs from "fs";
import _helmet from "helmet";
import { createServer } from "http";
import routes from "./routes";

const app = express();

// Test route at the very beginning
app.get("/test-very-early", (_req, res) => {
  res.json({ message: "Very early route works!" });
});

// Ensure uploads directory exists
const uploadsDir = "./uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// --- Request id / logging middleware ---
// app.use(requestId);
// app.use((req, res, next) => {
//   const rLogger = res.locals.logger || logger;
//   rLogger.info("Incoming request", {
//     method: req.method,
//     url: req.originalUrl,
//     ip: req.ip,
//     userAgent: req.get("user-agent"),
//     requestId: res.locals.requestId,
//   });
//   next();
// });

// --- Security & rate limiting ---
// import createRateLimiter, {
//   createAuthRateLimiter,
// } from "./middleware/rateLimiter";
// import securityMiddleware from "./middleware/security";
// import sanitizeInput from "./middleware/sanitization";
// export { default as validate } from "./middleware/requestValidation";
// const limiter = createRateLimiter();
// app.use(limiter as any);
// // apply security middlewares (helmet + cors)
// securityMiddleware().forEach((mw) => app.use(mw as any));
// // apply input sanitization
// app.use(sanitizeInput);

// // Mount auth-specific protections: stricter rate limits and brute-force guard
// import bruteforceProtection from "./middleware/bruteforce";
// const authLimiter = createAuthRateLimiter();
// app.use("/api/v1/auth", authLimiter as any);
// // apply brute force only to login/register paths
// if (typeof app.post === "function") {
//   app.post("/api/v1/auth/login", bruteforceProtection());
//   app.post("/api/v1/auth/register", bruteforceProtection());
// }

// --- Body parsers & static files ---
// Mount webhooks (Stripe requires raw body for signature verification)
import stripeWebhookRoutes from "./routes/webhooks/stripe";
app.use(
  "/webhooks",
  // This route expects the raw request body — use the handler which reads raw body directly
  stripeWebhookRoutes as any
);

// --- Body parsers & static files ---
// app.use(express.json({ limit: "25mb" }));
// app.use(express.urlencoded({ extended: true }));
// app.use("/uploads", express.static("uploads"));
// app.use(addRequestTracking);

// --- Health check endpoint ---
// Removed duplicate health endpoint - using health.routes instead

import healthRoutes from "./routes/health.routes";
app.use("/", healthRoutes);

// Test route to verify health routes are working
app.get("/test-health", (_req, res) => {
  res.json({ message: "Health routes are working!" });
});

// --- API routes ---
app.use("/api/v1", routes);

// --- Error handler ---
// app.use(errorHandler as any);

// --- 404 handler ---
// app.use((_req, res) => {
//   res.status(404).json({ success: false, message: "Endpoint not found" });
// });

// --- HTTP server (websocket init can be added later) ---
const server = createServer(app);

export { server };
export default app;
