import { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";
import AWS from "aws-sdk";
import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";
import { logger } from "../utils/logger";

// using shared singleton `prisma` from src/lib/prisma
interface UploadResult {
  id: string;
  url: string;
  type: string;
  width?: number;
  height?: number;
  duration?: number;
  size?: number;
  mimeType?: string;
  thumbnailUrl?: string;
}

interface FileUpload {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

interface ChunkedUploadSession {
  id: string;
  userId: string;
  filename: string;
  totalSize: number;
  chunks: Map<number, Buffer>;
  totalChunks: number;
  uploadedChunks: number;
  createdAt: Date;
}

interface UploadProgress {
  sessionId: string;
  progress: number; // 0-100
  uploadedBytes: number;
  totalBytes: number;
  estimatedTimeRemaining?: number;
}

export class MediaService {
  private static readonly UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
  private static readonly THUMBNAIL_DIR = path.join(
    this.UPLOAD_DIR,
    "thumbnails"
  );
  private static readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunks
  private static s3: AWS.S3 | null = null;
  private static uploadSessions: Map<string, ChunkedUploadSession> = new Map();

  static {
    // Initialize S3 if credentials are available
    if (env.awsAccessKeyId && env.awsSecretAccessKey && env.s3BucketName) {
      AWS.config.update({
        accessKeyId: env.awsAccessKeyId,
        secretAccessKey: env.awsSecretAccessKey,
        region: env.awsRegion,
      });
      this.s3 = new AWS.S3();
    }
  }

  // Initialize upload directory for local storage
  static async initializeUploadDir() {
    try {
      await fs.access(this.UPLOAD_DIR);
    } catch {
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
    }

    try {
      await fs.access(this.THUMBNAIL_DIR);
    } catch {
      await fs.mkdir(this.THUMBNAIL_DIR, { recursive: true });
    }
    logger.info("Upload directory initialized");
  }

  // Upload file (supports both local and S3)
  static async uploadFile(
    file: FileUpload,
    userId: string,
    uploadType?: string
  ): Promise<UploadResult> {
    // Validate file size
    if (file.size > env.maxFileSize) {
      throw new Error(
        `File size exceeds limit (${env.maxFileSize / 1024 / 1024}MB)`
      );
    }

    // Validate file type
    if (!env.allowedFileTypes.includes(file.mimetype)) {
      throw new Error(
        `Invalid file type. Allowed: ${env.allowedFileTypes.join(", ")}`
      );
    }

    // Determine media type
    const mediaType = this.getMediaType(file.mimetype);

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const filename = `${userId}/${uuidv4()}${fileExtension}`;

    let url: string;
    let metadata: { width?: number; height?: number; duration?: number } = {};

    try {
      if (this.s3 && env.s3BucketName) {
        // Upload to S3
        const uploadParams = {
          Bucket: env.s3BucketName,
          Key: filename,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: "public-read",
        };

        const result = await this.s3.upload(uploadParams).promise();
        url = result.Location;
      } else {
        // Upload to local storage
        const filepath = path.join(this.UPLOAD_DIR, filename);
        await fs.mkdir(path.dirname(filepath), { recursive: true });
        await fs.writeFile(filepath, file.buffer);
        url = `/uploads/${filename}`;
      }

      // Extract metadata if it's an image or video
      if (file.mimetype.startsWith("image/")) {
        metadata = await this.extractImageMetadata(file.buffer);
      } else if (file.mimetype.startsWith("video/")) {
        metadata = await this.extractVideoMetadata(file.buffer);
      }

      logger.info(`File uploaded successfully: ${filename}`);

      return {
        id: uuidv4(), // Will be replaced with actual DB ID
        url,
        type: mediaType,
        width: metadata.width,
        height: metadata.height,
        duration: metadata.duration,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error: any) {
      logger.error("Failed to upload file:", error);
      throw new Error("File upload failed");
    }
  }

  // Delete file (supports both local and S3)
  static async deleteFile(url: string): Promise<void> {
    try {
      if (this.s3 && env.s3BucketName && url.includes("amazonaws.com")) {
        // Delete from S3
        const key = url.split("/").slice(-2).join("/"); // Extract key from URL
        await this.s3
          .deleteObject({
            Bucket: env.s3BucketName,
            Key: key,
          })
          .promise();
      } else {
        // Delete from local storage
        const filename = url.replace("/uploads/", "");
        const filepath = path.join(this.UPLOAD_DIR, filename);
        await fs.unlink(filepath);
      }

      logger.info(`File deleted successfully: ${url}`);
    } catch (error: any) {
      logger.error("Failed to delete file:", error);
      // Don't throw error for file deletion failures
    }
  }

  // Get media type from MIME type
  private static getMediaType(mimeType: string): string {
    if (mimeType.startsWith("image/")) {
      return mimeType === "image/gif" ? "GIF" : "IMAGE";
    } else if (mimeType.startsWith("video/")) {
      return "VIDEO";
    } else {
      return "OTHER";
    }
  }

  // Extract image metadata (width, height)
  private static async extractImageMetadata(
    buffer: Buffer
  ): Promise<{ width?: number; height?: number }> {
    try {
      // This is a simplified implementation
      // In production, you'd use a library like 'sharp' or 'image-size'
      return { width: 1080, height: 1080 }; // Placeholder
    } catch (error: any) {
      logger.warn("Failed to extract image metadata:", error);
      return {};
    }
  }

  // Extract video metadata (width, height, duration)
  private static async extractVideoMetadata(
    buffer: Buffer
  ): Promise<{ width?: number; height?: number; duration?: number }> {
    try {
      // This is a simplified implementation
      // In production, you'd use ffmpeg or similar
      return { width: 1920, height: 1080, duration: 30 }; // Placeholder
    } catch (error: any) {
      logger.warn("Failed to extract video metadata:", error);
      return {};
    }
  }

  // Upload profile photo
  static async uploadProfilePhoto(
    file: FileUpload,
    userId: string,
    isPrimary: boolean = false
  ) {
    const uploadResult = await this.uploadFile(file, userId);

    // Create photo record
    const photo = await prisma.photo.create({
      data: {
        userId,
        url: uploadResult.url,
        isPrimary,
      },
    });

    // If this is primary, unset other primary photos
    if (isPrimary) {
      await prisma.photo.updateMany({
        where: {
          userId,
          id: { not: photo.id },
        },
        data: { isPrimary: false },
      });
    }

    return photo;
  }

  // Get user's media assets
  static async getUserMedia(
    userId: string,
    options: {
      type?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const { type, limit = 20, offset = 0 } = options;

    const where: any = { userId };
    if (type) where.type = type;

    return await prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  // Delete media asset
  static async deleteMedia(mediaId: string, userId: string) {
    const media = await prisma.mediaAsset.findFirst({
      where: { id: mediaId, userId },
    });

    if (!media) {
      throw new Error("Media not found");
    }

    // Delete physical file
    await this.deleteFile(media.url);

    // Delete from database
    await prisma.mediaAsset.delete({
      where: { id: mediaId },
    });

    // If it was an image, also delete from photos table
    if (media.type === "IMAGE" || media.type === "GIF") {
      await prisma.photo.deleteMany({
        where: {
          userId: media.userId,
          url: media.url,
        },
      });
    }

    return { success: true };
  }

  // Generate signed URL for private files (S3 only)
  static async getSignedUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    if (!this.s3 || !env.s3BucketName) {
      throw new Error("S3 not configured");
    }

    const params = {
      Bucket: env.s3BucketName,
      Key: key,
      Expires: expiresIn,
    };

    return this.s3.getSignedUrl("getObject", params);
  }

  // Get media asset by ID
  static async getMediaById(mediaId: string) {
    return await prisma.mediaAsset.findUnique({
      where: { id: mediaId },
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: { displayName: true },
            },
          },
        },
      },
    });
  }

  // Update media metadata
  static async updateMediaMetadata(
    mediaId: string,
    userId: string,
    metadata: {
      isFavorite?: boolean;
      usedInProfile?: boolean;
    }
  ) {
    const media = await prisma.mediaAsset.findFirst({
      where: { id: mediaId, userId },
    });

    if (!media) {
      throw new Error("Media not found");
    }

    return await prisma.mediaAsset.update({
      where: { id: mediaId },
      data: metadata,
    });
  }

  // Get file info for serving (for development)
  static async getFileInfo(filename: string) {
    if (this.s3 && env.s3BucketName) {
      // For S3, return the public URL
      return `https://${env.s3BucketName}.s3.${env.awsRegion}.amazonaws.com/${filename}`;
    } else {
      // For local files, return the file path
      const filepath = path.join(this.UPLOAD_DIR, filename);
      try {
        await fs.access(filepath);
        return filepath;
      } catch {
        throw new Error("File not found");
      }
    }
  }

  // Clean up old unused files
  static async cleanupOldFiles(olderThanDays: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Find old media assets that are not used in profiles
    const oldMedia = await prisma.mediaAsset.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        usedInProfile: false,
        isFavorite: false,
      },
    });

    let cleaned = 0;
    for (const media of oldMedia) {
      try {
        await this.deleteMedia(media.id, media.userId);
        cleaned++;
      } catch (error: any) {
        logger.error(`Failed to cleanup media ${media.id}:`, error);
      }
    }

    logger.info(`Cleaned up ${cleaned} old media files`);
    return { cleaned };
  }

  // Get upload statistics
  static async getUploadStats(userId?: string) {
    const where = userId ? { userId } : {};

    const [total, byType, recentUploads] = await Promise.all([
      prisma.mediaAsset.count({ where }),
      prisma.mediaAsset.groupBy({
        by: ["type"],
        where,
        _count: { id: true },
      }),
      prisma.mediaAsset.findMany({
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        select: { type: true, createdAt: true },
      }),
    ]);

    return {
      total,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      recentUploads: recentUploads.length,
    };
  }

  /**
   * Start a chunked upload session for large files
   */
  static startChunkedUpload(
    userId: string,
    filename: string,
    totalSize: number,
    chunkSize: number = this.CHUNK_SIZE
  ): string {
    const sessionId = uuidv4();
    const totalChunks = Math.ceil(totalSize / chunkSize);

    const session: ChunkedUploadSession = {
      id: sessionId,
      userId,
      filename,
      totalSize,
      chunks: new Map(),
      totalChunks,
      uploadedChunks: 0,
      createdAt: new Date(),
    };

    this.uploadSessions.set(sessionId, session);

    // Auto-cleanup session after 24 hours
    setTimeout(() => {
      this.uploadSessions.delete(sessionId);
    }, 24 * 60 * 60 * 1000);

    logger.info("Chunked upload session started:", {
      sessionId,
      userId,
      filename,
      totalSize,
      totalChunks,
    });

    return sessionId;
  }

  /**
   * Upload a chunk for a session
   */
  static uploadChunk(
    sessionId: string,
    chunkIndex: number,
    chunkData: Buffer
  ): UploadProgress {
    const session = this.uploadSessions.get(sessionId);
    if (!session) {
      throw new Error("Upload session not found or expired");
    }

    // Store chunk
    session.chunks.set(chunkIndex, chunkData);
    session.uploadedChunks = session.chunks.size;

    const progress = (session.uploadedChunks / session.totalChunks) * 100;
    const uploadedBytes = Array.from(session.chunks.values()).reduce(
      (total, chunk) => total + chunk.length,
      0
    );

    logger.debug("Chunk uploaded:", {
      sessionId,
      chunkIndex,
      uploadedChunks: session.uploadedChunks,
      totalChunks: session.totalChunks,
      progress,
    });

    return {
      sessionId,
      progress,
      uploadedBytes,
      totalBytes: session.totalSize,
    };
  }

  /**
   * Complete chunked upload and assemble file
   */
  static async completeChunkedUpload(
    sessionId: string,
    uploadType: "image" | "video" | "audio" | "document" = "image"
  ): Promise<UploadResult> {
    const session = this.uploadSessions.get(sessionId);
    if (!session) {
      throw new Error("Upload session not found or expired");
    }

    if (session.uploadedChunks !== session.totalChunks) {
      throw new Error("Not all chunks have been uploaded");
    }

    try {
      // Assemble chunks in order
      const chunks: Buffer[] = [];
      for (let i = 0; i < session.totalChunks; i++) {
        const chunk = session.chunks.get(i);
        if (!chunk) {
          throw new Error(`Missing chunk ${i}`);
        }
        chunks.push(chunk);
      }

      const completeBuffer = Buffer.concat(chunks);

      // Create file upload object
      const fileUpload: FileUpload = {
        buffer: completeBuffer,
        originalname: session.filename,
        mimetype: this.getMimeTypeFromExtension(session.filename),
        size: completeBuffer.length,
      };

      // Upload using existing upload method
      const result = await this.uploadFile(
        fileUpload,
        session.userId,
        uploadType
      );

      // Cleanup session
      this.uploadSessions.delete(sessionId);

      logger.info("Chunked upload completed:", {
        sessionId,
        userId: session.userId,
        filename: session.filename,
        finalSize: completeBuffer.length,
        mediaId: result.id,
      });

      return result;
    } catch (error: any) {
      logger.error("Failed to complete chunked upload:", error);
      // Cleanup session on error
      this.uploadSessions.delete(sessionId);
      throw error;
    }
  }

  /**
   * Get upload progress for a session
   */
  static getUploadProgress(sessionId: string): UploadProgress | null {
    const session = this.uploadSessions.get(sessionId);
    if (!session) {
      return null;
    }

    const progress = (session.uploadedChunks / session.totalChunks) * 100;
    const uploadedBytes = Array.from(session.chunks.values()).reduce(
      (total, chunk) => total + chunk.length,
      0
    );

    return {
      sessionId,
      progress,
      uploadedBytes,
      totalBytes: session.totalSize,
    };
  }

  /**
   * Cancel upload session
   */
  static cancelUploadSession(sessionId: string): boolean {
    const deleted = this.uploadSessions.delete(sessionId);
    if (deleted) {
      logger.info("Upload session cancelled:", { sessionId });
    }
    return deleted;
  }

  /**
   * Get MIME type from file extension
   */
  private static getMimeTypeFromExtension(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".mp4": "video/mp4",
      ".avi": "video/x-msvideo",
      ".mov": "video/quicktime",
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }

  /**
   * Generate thumbnail for images and videos
   */
  static async generateThumbnail(
    mediaId: string,
    type: string
  ): Promise<string | null> {
    try {
      const media = await prisma.mediaAsset.findUnique({
        where: { id: mediaId },
      });

      if (!media) {
        throw new Error("Media not found");
      }

      // For now, return a placeholder thumbnail URL
      // In production, you'd use libraries like sharp, ffmpeg, etc.
      const thumbnailUrl = `/uploads/thumbnails/${mediaId}_thumb.jpg`;

      logger.info("Thumbnail generated:", {
        mediaId,
        type,
        thumbnailUrl,
      });

      return thumbnailUrl;
    } catch (error: any) {
      logger.error("Failed to generate thumbnail:", error);
      return null;
    }
  }
}
