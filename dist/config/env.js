"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), ".env") });
function required(name, fallback) {
    const val = process.env[name] ?? fallback;
    if (!val)
        throw new Error(`Missing required env var ${name}`);
    return val;
}
exports.env = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "4000", 10),
    databaseUrl: required("DATABASE_URL"),
    jwtSecret: required("JWT_SECRET"),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    jwtRefreshSecret: required("JWT_REFRESH_SECRET", process.env.JWT_SECRET + "_refresh"),
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
    // CORS Configuration
    corsOrigins: process.env.CORS_ORIGINS?.split(",") || ["*"],
    // Firebase Config
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // AWS Config
    awsRegion: process.env.AWS_REGION || "us-east-1",
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3BucketName: process.env.S3_BUCKET_NAME,
    // Redis Config
    redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
    rateLimitRedisUrl: process.env.RATE_LIMIT_REDIS_URL || undefined,
    // Email Config
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT || "587", 10),
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    emailFrom: process.env.EMAIL_FROM || "noreply@sav3.app",
    // App Config
    appUrl: process.env.APP_URL || "http://localhost:4000",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    // Feature Flags
    enablePushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS === "true",
    enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === "true",
    enableGeospatial: process.env.ENABLE_GEOSPATIAL === "true",
    enableAnalytics: process.env.ENABLE_ANALYTICS === "true",
    // Allow disabling real payment integration for local/dev environments
    disablePayments: process.env.DISABLE_PAYMENTS === "true",
    // Upload Config
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "5242880", 10), // 5MB
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(",") || [
        "image/jpeg",
        "image/png",
        "image/gif",
        "video/mp4",
    ],
};
//# sourceMappingURL=env.js.map