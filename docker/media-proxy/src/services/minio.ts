import * as Minio from "minio";
import { config } from "../config";
import { logger } from "../utils/logger";

// Initialize MinIO client
export const minioClient = new (Minio as any).Client({
  endPoint: config.minio.endpoint.split(":")[0] || "localhost",
  port: parseInt(config.minio.endpoint.split(":")[1] || "9000"),
  useSSL: config.minio.useSSL,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
  region: config.minio.region,
});

// Initialize buckets on startup
export async function initializeMinIO(): Promise<void> {
  try {
    // Check if buckets exist
    const mediaBucketExists = await minioClient.bucketExists(
      config.buckets.media
    );
    const thumbnailsBucketExists = await minioClient.bucketExists(
      config.buckets.thumbnails
    );

    if (!mediaBucketExists) {
      await minioClient.makeBucket(config.buckets.media);
      logger.info(`Created bucket: ${config.buckets.media}`);
    }

    if (!thumbnailsBucketExists) {
      await minioClient.makeBucket(config.buckets.thumbnails);
      logger.info(`Created bucket: ${config.buckets.thumbnails}`);
    }

    logger.info("MinIO initialization completed");
  } catch (error) {
    logger.error("Failed to initialize MinIO:", error);
    throw error;
  }
}

// Helper functions
export class MinIOService {
  static async uploadObject(
    bucketName: string,
    objectName: string,
    stream: any,
    size: number,
    metaData: Record<string, string> = {}
  ): Promise<void> {
    try {
      await minioClient.putObject(
        bucketName,
        objectName,
        stream,
        size,
        metaData
      );
      logger.debug(`Uploaded object: ${bucketName}/${objectName}`);
    } catch (error) {
      logger.error(
        `Failed to upload object ${bucketName}/${objectName}:`,
        error
      );
      throw error;
    }
  }

  static async deleteObject(
    bucketName: string,
    objectName: string
  ): Promise<void> {
    try {
      await minioClient.removeObject(bucketName, objectName);
      logger.debug(`Deleted object: ${bucketName}/${objectName}`);
    } catch (error) {
      logger.error(
        `Failed to delete object ${bucketName}/${objectName}:`,
        error
      );
      throw error;
    }
  }

  static async getObject(bucketName: string, objectName: string): Promise<any> {
    try {
      const stream = await minioClient.getObject(bucketName, objectName);
      logger.debug(`Retrieved object: ${bucketName}/${objectName}`);
      return stream;
    } catch (error) {
      logger.error(`Failed to get object ${bucketName}/${objectName}:`, error);
      throw error;
    }
  }

  static async getPresignedUrl(
    bucketName: string,
    objectName: string,
    expiry: number = 3600
  ): Promise<string> {
    try {
      const url = await minioClient.presignedGetObject(
        bucketName,
        objectName,
        expiry
      );
      logger.debug(`Generated presigned URL for: ${bucketName}/${objectName}`);
      return url;
    } catch (error) {
      logger.error(
        `Failed to generate presigned URL for ${bucketName}/${objectName}:`,
        error
      );
      throw error;
    }
  }

  static async getPresignedUploadUrl(
    bucketName: string,
    objectName: string,
    expiry: number = 3600
  ): Promise<string> {
    try {
      const url = await minioClient.presignedPutObject(
        bucketName,
        objectName,
        expiry
      );
      logger.debug(
        `Generated presigned upload URL for: ${bucketName}/${objectName}`
      );
      return url;
    } catch (error) {
      logger.error(
        `Failed to generate presigned upload URL for ${bucketName}/${objectName}:`,
        error
      );
      throw error;
    }
  }

  static async listObjects(
    bucketName: string,
    prefix?: string
  ): Promise<string[]> {
    try {
      const objects: string[] = [];
      const objectsStream = minioClient.listObjects(bucketName, prefix);

      for await (const obj of objectsStream) {
        if (obj.name) {
          objects.push(obj.name);
        }
      }

      return objects;
    } catch (error) {
      logger.error(`Failed to list objects in ${bucketName}:`, error);
      throw error;
    }
  }

  static async statObject(bucketName: string, objectName: string) {
    try {
      const stat = await minioClient.statObject(bucketName, objectName);
      return stat;
    } catch (error) {
      logger.error(`Failed to stat object ${bucketName}/${objectName}:`, error);
      throw error;
    }
  }
}

// Initialize on module load
initializeMinIO().catch((error) => {
  logger.error("Failed to initialize MinIO on module load:", error);
});
