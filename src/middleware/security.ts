import helmet from "helmet";
import cors from "cors";
import { env } from "../config/env";
import { RequestHandler } from "express";

export function securityMiddleware(): RequestHandler[] {
  const corsOpts: any = {
    origin: env.corsOrigins.includes("*") ? true : env.corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-Request-ID",
    ],
    maxAge: 86400,
  };

  // Enhanced Helmet configuration for production
  const helmetOpts = {
    contentSecurityPolicy:
      env.nodeEnv === "production"
        ? {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'"],
              imgSrc: ["'self'", "data:", "https:"],
              connectSrc: ["'self'"],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              mediaSrc: ["'self'"],
              frameSrc: ["'none'"],
            },
          }
        : false,
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" as const },
  };

  return [helmet(helmetOpts) as any, cors(corsOpts) as any];
}

export default securityMiddleware;
