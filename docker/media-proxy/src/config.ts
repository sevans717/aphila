export const config = {
  port: parseInt(process.env.PORT || "3001"),
  nodeEnv: process.env.NODE_ENV || "development",

  // MinIO configuration
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || "localhost:9000",
    accessKey: process.env.MINIO_ACCESS_KEY || "media_access_key",
    secretKey: process.env.MINIO_SECRET_KEY || "media_secret_key123",
    useSSL: process.env.MINIO_USE_SSL === "true",
    region: process.env.MINIO_REGION || "us-east-1",
  },

  // Bucket configuration
  buckets: {
    media: process.env.MEDIA_BUCKET_NAME || "sav3-media",
    thumbnails: process.env.THUMBNAILS_BUCKET_NAME || "sav3-thumbnails",
  },

  // Upload limits
  upload: {
    maxSize: process.env.MAX_UPLOAD_SIZE || "100MB",
    maxSizeBytes: parseSize(process.env.MAX_UPLOAD_SIZE || "100MB"),
    allowedImageTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    allowedVideoTypes: ["video/mp4", "video/webm", "video/quicktime"],
    allowedTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ],
  },

  // Processing configuration
  processing: {
    imageQuality: parseInt(process.env.PROCESSING_QUALITY || "85"),
    maxImageDimension: parseInt(process.env.MAX_IMAGE_DIMENSION || "2048"),
    thumbnailSizes: [150, 300, 600],
    videoThumbnailTime: "00:00:01",
  },

  // Security
  jwt: {
    secret: process.env.JWT_SECRET!,
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  // CORS
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim()),

  // Database (for user validation)
  database: {
    url: process.env.DATABASE_URL,
  },
} as const;

function parseSize(sizeStr: string): number {
  const units: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  };

  const match = sizeStr.match(/^(\d+(?:\.\d+)?)(B|KB|MB|GB)$/i);
  if (!match || !match[1] || !match[2]) {
    throw new Error(`Invalid size format: ${sizeStr}`);
  }

  const [, size, unit] = match;
  const unitMultiplier = units[unit.toUpperCase()];
  if (!unitMultiplier) {
    throw new Error(`Unknown unit: ${unit}`);
  }

  return Math.floor(parseFloat(size) * unitMultiplier);
}
