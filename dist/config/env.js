"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv = require("dotenv");
const path = require("path");
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: path.resolve(process.cwd(), envFile), override: true });
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.string().default("development"),
    PORT: zod_1.z.string().default("4000"),
    DATABASE_URL: zod_1.z.string().url(),
    JWT_SECRET: zod_1.z.string(),
    JWT_EXPIRES_IN: zod_1.z.string().optional(),
    JWT_REFRESH_SECRET: zod_1.z.string().optional(),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().optional(),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().optional(),
    RATE_LIMIT_MAX: zod_1.z.string().optional(),
    JWT_ACCESS_SECRET: zod_1.z.string().optional(),
    CORS_ORIGINS: zod_1.z.string().optional(),
    FIREBASE_PROJECT_ID: zod_1.z.string().optional(),
    FIREBASE_PRIVATE_KEY: zod_1.z.string().optional(),
    FIREBASE_CLIENT_EMAIL: zod_1.z.string().optional(),
    ENCRYPTION_KEY: zod_1.z.string().optional(),
    DOTENV_KEY: zod_1.z.string().optional(),
    AWS_REGION: zod_1.z.string().optional(),
    AWS_ACCESS_KEY_ID: zod_1.z.string().optional(),
    AWS_SECRET_ACCESS_KEY: zod_1.z.string().optional(),
    S3_BUCKET_NAME: zod_1.z.string().optional(),
    MINIO_ENDPOINT: zod_1.z.string().optional(),
    MINIO_PORT: zod_1.z.string().optional(),
    MINIO_ACCESS_KEY: zod_1.z.string().optional(),
    MINIO_SECRET_KEY: zod_1.z.string().optional(),
    MINIO_BUCKET_NAME: zod_1.z.string().optional(),
    MINIO_USE_SSL: zod_1.z.string().optional(),
    MEDIA_PROXY_URL: zod_1.z.string().optional(),
    REDIS_URL: zod_1.z.string().optional(),
    RATE_LIMIT_REDIS_URL: zod_1.z.string().optional(),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.string().optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASSWORD: zod_1.z.string().optional(),
    EMAIL_FROM: zod_1.z.string().optional(),
    APP_URL: zod_1.z.string().optional(),
    FRONTEND_URL: zod_1.z.string().optional(),
    LOG_LEVEL: zod_1.z.string().optional(),
    UPLOAD_DIR: zod_1.z.string().optional(),
    POSTGRES_USER: zod_1.z.string().optional(),
    POSTGRES_PASSWORD: zod_1.z.string().optional(),
    POSTGRES_DB: zod_1.z.string().optional(),
    PRISMA_CLIENT_ENGINE_TYPE: zod_1.z.string().optional(),
    PRISMA_QUERY_ENGINE_BINARY: zod_1.z.string().optional(),
    PRISMA_QUERY_ENGINE_LIBRARY: zod_1.z.string().optional(),
    ENABLE_PUSH_NOTIFICATIONS: zod_1.z.string().optional(),
    ENABLE_EMAIL_NOTIFICATIONS: zod_1.z.string().optional(),
    ENABLE_GEOSPATIAL: zod_1.z.string().optional(),
    ENABLE_ANALYTICS: zod_1.z.string().optional(),
    DISABLE_PAYMENTS: zod_1.z.string().optional(),
    MAX_FILE_SIZE: zod_1.z.string().optional(),
    ALLOWED_FILE_TYPES: zod_1.z.string().optional(),
    VAPID_PUBLIC_KEY: zod_1.z.string().optional(),
    VAPID_PRIVATE_KEY: zod_1.z.string().optional(),
});
const safeStart = process.argv.includes("--safe-start") || process.env.SAFE_START === "true";
let parsed;
try {
    parsed = envSchema.parse(process.env);
}
catch (e) {
    // If safe start is allowed, log and continue using lenient defaults
    if (safeStart) {
        logger_1.logger.warn("Environment validation failed but running in --safe-start mode", { err: e });
        parsed = {
            NODE_ENV: process.env.NODE_ENV || "development",
            PORT: process.env.PORT || "4000",
        };
    }
    else {
        // Fail fast - surface helpful message and exit
        logger_1.logger.error("Environment validation failed. Missing or invalid env vars.", e);
        throw e;
    }
}
function toBool(val) {
    return String(val).toLowerCase() === "true";
}
exports.env = {
    nodeEnv: parsed.NODE_ENV || "development",
    port: parseInt(parsed.PORT || "4000", 10),
    databaseUrl: parsed.DATABASE_URL,
    jwtSecret: parsed.JWT_SECRET,
    jwtExpiresIn: parsed.JWT_EXPIRES_IN || "7d",
    jwtRefreshSecret: parsed.JWT_REFRESH_SECRET ||
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
    minioEndpoint: parsed.MINIO_ENDPOINT,
    minioPort: parsed.MINIO_PORT,
    minioAccessKey: parsed.MINIO_ACCESS_KEY,
    minioSecretKey: parsed.MINIO_SECRET_KEY,
    minioBucketName: parsed.MINIO_BUCKET_NAME,
    minioUseSSL: toBool(parsed.MINIO_USE_SSL),
    mediaProxyUrl: parsed.MEDIA_PROXY_URL,
};
//# sourceMappingURL=env.js.map