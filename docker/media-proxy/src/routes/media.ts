import { Router } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { MinIOService } from "../services/minio";
import { RedisService } from "../services/redis";
import { MediaProxyError } from "../middleware/errorHandler";
import { config } from "../config";
import { logger } from "../utils/logger";

const router = Router();

// Get media file (streaming)
router.get("/file/:objectKey(*)", async (req: AuthenticatedRequest, res) => {
  try {
    const objectKey = req.params.objectKey;
    const userId = req.user!.userId;

    if (!objectKey) {
      throw new MediaProxyError("Object key is required", 400);
    }

    // Check if user has access to this file
    // For now, check if the object key starts with the user's ID
    if (
      !objectKey.startsWith(`uploads/${userId}/`) &&
      !objectKey.startsWith(`processed/${userId}/`)
    ) {
      throw new MediaProxyError("Access denied", 403);
    }

    try {
      // Get object metadata
      const stat = await MinIOService.statObject(
        config.buckets.media,
        objectKey
      );

      // Get object stream
      const stream = await MinIOService.getObject(
        config.buckets.media,
        objectKey
      );

      // Set appropriate headers
      res.set({
        "Content-Type":
          stat.metaData?.["content-type"] || "application/octet-stream",
        "Content-Length": stat.size?.toString(),
        "Cache-Control": "public, max-age=86400", // 24 hours
        ETag: stat.etag,
      });

      // Handle range requests (for video streaming)
      const range = req.headers.range;
      if (range && stat.size) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0] || "0", 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = end - start + 1;

        res.status(206);
        res.set({
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize.toString(),
        });
      }

      // Pipe the stream to response
      stream.pipe(res);

      logger.debug(`Served media file: ${objectKey} to user ${userId}`);
    } catch (_error: any) {
      if (_error.code === "NoSuchKey") {
        throw new MediaProxyError("File not found", 404);
      }
      throw _error;
    }
  } catch (error) {
    logger.error("Error serving media file:", error);
    throw error;
  }
});

// Get presigned download URL
router.get(
  "/download-url/:objectKey(*)",
  async (req: AuthenticatedRequest, res) => {
    try {
      const objectKey = req.params.objectKey;
      const userId = req.user!.userId;
      const expiresIn = parseInt(req.query.expires as string) || 3600; // Default 1 hour

      if (!objectKey) {
        throw new MediaProxyError("Object key is required", 400);
      }

      // Check if user has access to this file
      if (
        !objectKey.startsWith(`uploads/${userId}/`) &&
        !objectKey.startsWith(`processed/${userId}/`)
      ) {
        throw new MediaProxyError("Access denied", 403);
      }

      // Validate expiry time (max 24 hours)
      const maxExpiry = 86400; // 24 hours
      const actualExpiry = Math.min(expiresIn, maxExpiry);

      try {
        const downloadUrl = await MinIOService.getPresignedUrl(
          config.buckets.media,
          objectKey,
          actualExpiry
        );

        logger.debug(
          `Generated download URL for: ${objectKey}, user: ${userId}`
        );

        res.json({
          success: true,
          data: {
            downloadUrl,
            objectKey,
            expiresIn: actualExpiry,
            expiresAt: new Date(Date.now() + actualExpiry * 1000).toISOString(),
          },
        });
      } catch (_error: any) {
        if (_error.code === "NoSuchKey") {
          throw new MediaProxyError("File not found", 404);
        }
        throw _error;
      }
    } catch (error) {
      logger.error("Error generating download URL:", error);
      throw error;
    }
  }
);

// Get thumbnail
router.get("/thumbnail/:fileId", async (req: AuthenticatedRequest, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user!.userId;
    const size = (req.query.size as string) || "300";

    if (!["150", "300", "600"].includes(size)) {
      throw new MediaProxyError("Invalid thumbnail size", 400);
    }

    const thumbnailKey = `thumbnails/${userId}/${fileId}_${size}.webp`;

    try {
      // Get thumbnail metadata
      const stat = await MinIOService.statObject(
        config.buckets.thumbnails,
        thumbnailKey
      );

      // Get thumbnail stream
      const stream = await MinIOService.getObject(
        config.buckets.thumbnails,
        thumbnailKey
      );

      // Set headers
      res.set({
        "Content-Type": "image/webp",
        "Content-Length": stat.size?.toString(),
        "Cache-Control": "public, max-age=604800", // 7 days
        ETag: stat.etag,
      });

      stream.pipe(res);

      logger.debug(`Served thumbnail: ${thumbnailKey} to user ${userId}`);
    } catch (_error: any) {
      if (_error.code === "NoSuchKey") {
        throw new MediaProxyError("Thumbnail not found", 404);
      }
      throw _error;
    }
  } catch (error) {
    logger.error("Error serving thumbnail:", error);
    throw error;
  }
});

// List user's media files
router.get("/list", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const prefix = (req.query.prefix as string) || "";
    const limit = parseInt(req.query.limit as string) || 50;

    // List objects in user's directory
    const userPrefix = `uploads/${userId}/${prefix}`;
    const objects = await MinIOService.listObjects(
      config.buckets.media,
      userPrefix
    );

    // Limit results
    const limitedObjects = objects.slice(0, limit);

    // Get metadata for each object
    const filesWithMetadata = await Promise.all(
      limitedObjects.map(async (objectKey) => {
        try {
          const stat = await MinIOService.statObject(
            config.buckets.media,
            objectKey
          );
          return {
            objectKey,
            size: stat.size,
            lastModified: stat.lastModified,
            etag: stat.etag,
            contentType: stat.metaData?.["content-type"],
          };
        } catch (_error) {
          logger.warn(`Failed to get metadata for ${objectKey}:`, _error);
          return {
            objectKey,
            size: 0,
            lastModified: null,
            etag: null,
            contentType: null,
          };
        }
      })
    );

    logger.debug(`Listed ${filesWithMetadata.length} files for user ${userId}`);

    res.json({
      success: true,
      data: {
        files: filesWithMetadata,
        count: filesWithMetadata.length,
        hasMore: objects.length > limit,
      },
    });
  } catch (error) {
    logger.error("Error listing media files:", error);
    throw error;
  }
});

// Delete media file
router.delete("/file/:objectKey(*)", async (req: AuthenticatedRequest, res) => {
  try {
    const objectKey = req.params.objectKey;
    const userId = req.user!.userId;

    if (!objectKey) {
      throw new MediaProxyError("Object key is required", 400);
    }

    // Check if user owns this file
    if (!objectKey.startsWith(`uploads/${userId}/`)) {
      throw new MediaProxyError("Access denied", 403);
    }

    try {
      // Delete from MinIO
      await MinIOService.deleteObject(config.buckets.media, objectKey);

      // Try to delete associated thumbnails
      const fileIdMatch = objectKey.match(/uploads\/[^/]+\/([^/]+)\//);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        for (const size of config.processing.thumbnailSizes) {
          const thumbnailKey = `thumbnails/${userId}/${fileId}_${size}.webp`;
          try {
            await MinIOService.deleteObject(
              config.buckets.thumbnails,
              thumbnailKey
            );
          } catch {
            // Ignore if thumbnail doesn't exist
            logger.debug(`Thumbnail not found: ${thumbnailKey}`);
          }
        }
      }

      // Remove from Redis cache
      const fileIdMatch2 = objectKey.match(/uploads\/[^/]+\/([^/]+)\//);
      if (fileIdMatch2) {
        const fileId = fileIdMatch2[1];
        await RedisService.del(`upload:${fileId}`);
      }

      logger.info(`Deleted media file: ${objectKey} for user ${userId}`);

      res.json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (error: any) {
      if (error.code === "NoSuchKey") {
        throw new MediaProxyError("File not found", 404);
      }
      throw error;
    }
  } catch (error) {
    logger.error("Error deleting media file:", error);
    throw error;
  }
});

export { router as mediaRoutes };
