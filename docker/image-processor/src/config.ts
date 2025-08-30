import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3002", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || "minio:9000",
    accessKey: process.env.MINIO_ACCESS_KEY || "media_access_key",
    secretKey: process.env.MINIO_SECRET_KEY || "media_secret_key",
    useSSL: process.env.MINIO_USE_SSL === "true",
    mediaBucket: process.env.MEDIA_BUCKET_NAME || "sav3-media",
    thumbnailsBucket: process.env.THUMBNAILS_BUCKET_NAME || "sav3-thumbnails",
  },
  redis: {
    url: process.env.REDIS_URL || "redis://redis:6379",
  },
  processing: {
    quality: parseInt(process.env.PROCESSING_QUALITY || "85", 10),
    maxDimension: parseInt(process.env.MAX_IMAGE_DIMENSION || "2048", 10),
  },
};
