const dotenv = require("dotenv");
const path = require("path");
import { z } from "zod";
import { logger } from "../utils/logger";

const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: path.resolve(process.cwd(), envFile), override: true });

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.string().default("4000"),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_REFRESH_EXPIRES_IN: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().optional(),
  RATE_LIMIT_MAX: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
  DOTENV_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
  MINIO_ENDPOINT: z.string().optional(),
  MINIO_PORT: z.string().optional(),
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),
  MINIO_BUCKET_NAME: z.string().optional(),
  MINIO_USE_SSL: z.string().optional(),
  MEDIA_PROXY_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  RATE_LIMIT_REDIS_URL: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  APP_URL: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
  UPLOAD_DIR: z.string().optional(),
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DB: z.string().optional(),
  PRISMA_CLIENT_ENGINE_TYPE: z.string().optional(),
  PRISMA_QUERY_ENGINE_BINARY: z.string().optional(),
  PRISMA_QUERY_ENGINE_LIBRARY: z.string().optional(),
  ENABLE_PUSH_NOTIFICATIONS: z.string().optional(),
  ENABLE_EMAIL_NOTIFICATIONS: z.string().optional(),
  ENABLE_GEOSPATIAL: z.string().optional(),
  ENABLE_ANALYTICS: z.string().optional(),
  DISABLE_PAYMENTS: z.string().optional(),
  MAX_FILE_SIZE: z.string().optional(),
  ALLOWED_FILE_TYPES: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
});
const safeStart =
  process.argv.includes("--safe-start") || process.env.SAFE_START === "true";

let parsed: any;
try {
  parsed = envSchema.parse(process.env);
} catch (e) {
  // If safe start is allowed, log and continue using lenient defaults
  if (safeStart) {
    logger.warn(
      "Environment validation failed but running in --safe-start mode",
      { err: e }
    );
    parsed = {
      NODE_ENV: process.env.NODE_ENV || "development",
      PORT: process.env.PORT || "4000",
    } as any;
  } else {
    // Fail fast - surface helpful message and exit
    logger.error(
      "Environment validation failed. Missing or invalid env vars.",
      e
    );
    throw e;
  }
}

function toBool(val?: string) {
  return String(val).toLowerCase() === "true";
}

export const env = {
  nodeEnv: parsed.NODE_ENV || "development",
  port: parseInt(parsed.PORT || "4000", 10),
  databaseUrl: parsed.DATABASE_URL,
  jwtSecret: parsed.JWT_SECRET,
  jwtExpiresIn: parsed.JWT_EXPIRES_IN || "7d",
  jwtRefreshSecret:
    parsed.JWT_REFRESH_SECRET ||
    (parsed.JWT_SECRET ? parsed.JWT_SECRET + "_refresh" : undefined),
  jwtRefreshExpiresIn: parsed.JWT_REFRESH_EXPIRES_IN || "30d",
  rateLimitWindowMs: parseInt(parsed.RATE_LIMIT_WINDOW_MS || "60000", 10),
  rateLimitMax: parseInt(parsed.RATE_LIMIT_MAX || "100", 10),
  jwtAccessSecret: parsed.JWT_ACCESS_SECRET || parsed.JWT_SECRET,
  corsOrigins: parsed.CORS_ORIGINS ? parsed.CORS_ORIGINS.split(",") : ["*"],
  firebaseProjectId: parsed.FIREBASE_PROJECT_ID,
  firebasePrivateKey: parsed.FIREBASE_PRIVATE_KEY
    ? parsed.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined,
  firebaseClientEmail: parsed.FIREBASE_CLIENT_EMAIL,
  encryptionKey: parsed.ENCRYPTION_KEY,
  dotenvKey: parsed.DOTENV_KEY,
  awsRegion: parsed.AWS_REGION || "us-east-1",
  awsAccessKeyId: parsed.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: parsed.AWS_SECRET_ACCESS_KEY,
  s3BucketName: parsed.S3_BUCKET_NAME,
  redisUrl: parsed.REDIS_URL || "redis://localhost:6379",
  rateLimitRedisUrl: parsed.RATE_LIMIT_REDIS_URL || undefined,
  smtpHost: parsed.SMTP_HOST,
  smtpPort: parseInt(parsed.SMTP_PORT || "587", 10),
  smtpUser: parsed.SMTP_USER,
  smtpPassword: parsed.SMTP_PASSWORD,
  emailFrom: parsed.EMAIL_FROM || "noreply@sav3.app",
  appUrl: parsed.APP_URL || "http://localhost:4000",
  frontendUrl: parsed.FRONTEND_URL || "http://localhost:3000",
  logLevel: parsed.LOG_LEVEL || "info",
  uploadDir: parsed.UPLOAD_DIR || "./uploads",
  postgresUser: parsed.POSTGRES_USER,
  postgresPassword: parsed.POSTGRES_PASSWORD,
  postgresDb: parsed.POSTGRES_DB,
  prismaClientEngineType: parsed.PRISMA_CLIENT_ENGINE_TYPE,
  prismaQueryEngineBinary: parsed.PRISMA_QUERY_ENGINE_BINARY,
  prismaQueryEngineLibrary: parsed.PRISMA_QUERY_ENGINE_LIBRARY,
  enablePushNotifications: toBool(parsed.ENABLE_PUSH_NOTIFICATIONS),
  enableEmailNotifications: toBool(parsed.ENABLE_EMAIL_NOTIFICATIONS),
  enableGeospatial: toBool(parsed.ENABLE_GEOSPATIAL),
  enableAnalytics: toBool(parsed.ENABLE_ANALYTICS),
  disablePayments: toBool(parsed.DISABLE_PAYMENTS),
  maxFileSize: parseInt(parsed.MAX_FILE_SIZE || "5242880", 10),
  allowedFileTypes: parsed.ALLOWED_FILE_TYPES
    ? parsed.ALLOWED_FILE_TYPES.split(",")
    : ["image/jpeg", "image/png", "image/gif", "video/mp4"],
  bcryptRounds: parseInt(parsed.BCRYPT_ROUNDS || "12", 10),
  vapidPublicKey: parsed.VAPID_PUBLIC_KEY,
  vapidPrivateKey: parsed.VAPID_PRIVATE_KEY,
  stripeSecretKey: parsed.STRIPE_SECRET_KEY,
  stripeWebhookSecret: parsed.STRIPE_WEBHOOK_SECRET,
  stripePublishableKey: parsed.STRIPE_PUBLISHABLE_KEY,
  minioEndpoint: parsed.MINIO_ENDPOINT,
  minioPort: parsed.MINIO_PORT,
  minioAccessKey: parsed.MINIO_ACCESS_KEY,
  minioSecretKey: parsed.MINIO_SECRET_KEY,
  minioBucketName: parsed.MINIO_BUCKET_NAME,
  minioUseSSL: toBool(parsed.MINIO_USE_SSL),
  mediaProxyUrl: parsed.MEDIA_PROXY_URL,
};
