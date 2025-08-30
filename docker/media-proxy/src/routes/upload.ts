import { Router } from "express";
import { PassThrough } from "stream";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { AuthenticatedRequest } from "../middleware/auth";
import { MinIOService } from "../services/minio";
import { RedisService } from "../services/redis";
import { MediaProxyError } from "../middleware/errorHandler";
import { config } from "../config";
import { logger } from "../utils/logger";

const router = Router();

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxSizeBytes,
    files: 5, // Max 5 files per request
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new MediaProxyError(`File type ${file.mimetype} not allowed`, 400));
    }
  },
});

// Generate presigned upload URL
router.post("/presigned-url", async (req: AuthenticatedRequest, res) => {
  try {
    const { fileName, fileType, fileSize } = req.body;
    const userId = req.user!.userId;

    if (!fileName || !fileType) {
      throw new MediaProxyError("fileName and fileType are required", 400);
    }

    if (!config.upload.allowedTypes.includes(fileType)) {
      throw new MediaProxyError(`File type ${fileType} not allowed`, 400);
    }

    if (fileSize && fileSize > config.upload.maxSizeBytes) {
      throw new MediaProxyError("File size exceeds limit", 400);
    }

    // Generate unique object key
    const fileId = uuidv4();
    const objectKey = `uploads/${userId}/${fileId}/${fileName}`;

    // Generate presigned upload URL (valid for 1 hour)
    const uploadUrl = await MinIOService.getPresignedUploadUrl(
      config.buckets.media,
      objectKey,
      3600
    );

    // Store upload metadata in Redis
    const uploadMetadata = {
      fileId,
      fileName,
      fileType,
      fileSize: fileSize || 0,
      userId,
      objectKey,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await RedisService.hset(
      `upload:${fileId}`,
      "metadata",
      JSON.stringify(uploadMetadata)
    );
    await RedisService.expire(`upload:${fileId}`, 3600); // 1 hour TTL

    logger.info(
      `Generated presigned upload URL for user ${userId}: ${objectKey}`
    );

    res.json({
      success: true,
      data: {
        fileId,
        uploadUrl,
        objectKey,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    logger.error("Error generating presigned upload URL:", error);
    throw error;
  }
});

// Direct upload endpoint (fallback)
router.post(
  "/direct",
  upload.array("files"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const files = (req as any).files as Array<{
        buffer: Buffer;
        originalname: string;
        mimetype: string;
        size: number;
      }>;

      if (!files || files.length === 0) {
        throw new MediaProxyError("No files provided", 400);
      }

      const uploadResults: Array<{
        fileId: string;
        fileName: string;
        fileType: string;
        fileSize: number;
        objectKey: string;
        status: string;
      }> = [];

      for (const file of files) {
        // Verify file type
        const { fileTypeFromBuffer } = await import("file-type");
        const detectedType = await fileTypeFromBuffer(file.buffer);
        const mime = detectedType?.mime;
        if (
          !mime ||
          !(config.upload.allowedTypes as unknown as string[]).includes(mime)
        ) {
          throw new MediaProxyError(`Invalid file type detected: ${mime}`, 400);
        }

        // Generate unique object key
        const fileId = uuidv4();
        const objectKey = `uploads/${userId}/${fileId}/${file.originalname}`;

        // Upload to MinIO
        const bufferStream = new PassThrough();
        bufferStream.end(file.buffer);

        await MinIOService.uploadObject(
          config.buckets.media,
          objectKey,
          bufferStream,
          file.size,
          {
            "X-User-Id": userId,
            "X-File-Id": fileId,
          }
        );

        // Store metadata in Redis
        const uploadMetadata = {
          fileId,
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          userId,
          objectKey,
          status: "completed",
          createdAt: new Date().toISOString(),
        };

        await RedisService.hset(
          `upload:${fileId}`,
          "metadata",
          JSON.stringify(uploadMetadata)
        );
        await RedisService.expire(`upload:${fileId}`, 86400); // 24 hours TTL

        uploadResults.push({
          fileId,
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          objectKey,
          status: "completed",
        });
      }

      logger.info(`Uploaded ${files.length} files for user ${userId}`);

      res.json({
        success: true,
        data: {
          uploads: uploadResults,
        },
      });
    } catch (error) {
      logger.error("Error in direct upload:", error);
      throw error;
    }
  }
);

// Confirm upload completion (for presigned uploads)
router.post("/confirm/:fileId", async (req: AuthenticatedRequest, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user!.userId;

    // Get upload metadata from Redis
    const metadataStr = await RedisService.hget(`upload:${fileId}`, "metadata");
    if (!metadataStr) {
      throw new MediaProxyError("Upload not found or expired", 404);
    }

    const metadata = JSON.parse(metadataStr);

    // Verify user owns this upload
    if (metadata.userId !== userId) {
      throw new MediaProxyError("Unauthorized", 403);
    }

    // Check if file exists in MinIO
    try {
      await MinIOService.statObject(config.buckets.media, metadata.objectKey);
      // Update status
      metadata.status = "completed";
      metadata.completedAt = new Date().toISOString();

      await RedisService.hset(
        `upload:${fileId}`,
        "metadata",
        JSON.stringify(metadata)
      );

      logger.info(`Upload confirmed for user ${userId}: ${metadata.objectKey}`);

      res.json({
        success: true,
        data: {
          fileId,
          status: "completed",
          objectKey: metadata.objectKey,
        },
      });
    } catch {
      throw new MediaProxyError("Upload not found in storage", 404);
    }
  } catch {
    logger.error("Error confirming upload");
    throw new MediaProxyError("Upload confirmation failed", 500);
  }
});

// Get upload status
router.get("/status/:fileId", async (req: AuthenticatedRequest, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user!.userId;

    const metadataStr = await RedisService.hget(`upload:${fileId}`, "metadata");
    if (!metadataStr) {
      throw new MediaProxyError("Upload not found or expired", 404);
    }

    const metadata = JSON.parse(metadataStr);

    // Verify user owns this upload
    if (metadata.userId !== userId) {
      throw new MediaProxyError("Unauthorized", 403);
    }

    res.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    logger.error("Error getting upload status:", error);
    throw error;
  }
});

export { router as uploadRoutes };
