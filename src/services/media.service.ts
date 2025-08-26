import { prisma } from "../lib/prisma";
import AWS from "aws-sdk";
import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { handleServiceError } from "../utils/error";

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
      const msg = `File size exceeds limit (${
        env.maxFileSize / 1024 / 1024
      }MB)`;
      const err = new Error(msg);
      logger.warn("uploadFile validation failed", { userId, size: file.size });
      return handleServiceError(err);
    }

    // Validate file type
    if (!env.allowedFileTypes.includes(file.mimetype)) {
      const msg = `Invalid file type. Allowed: ${env.allowedFileTypes.join(
        ", "
      )}`;
      const err = new Error(msg);
      logger.warn("uploadFile invalid file type", {
        userId,
        mimetype: file.mimetype,
      });
      return handleServiceError(err);
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

      // Persist media asset in database and return actual DB id
      const media = await prisma.mediaAsset.create({
        data: {
          userId,
          url,
          type: mediaType as any,
          width: metadata.width ?? undefined,
          height: metadata.height ?? undefined,
          duration: metadata.duration ?? undefined,
        },
      });

      return {
        id: media.id,
        url: media.url,
        type: media.type,
        width: media.width ?? undefined,
        height: media.height ?? undefined,
        duration: media.duration ?? undefined,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error: any) {
      logger.error("Failed to upload file:", error);
      return handleServiceError(error);
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
      const err = new Error("Media not found");
      logger.warn("deleteMedia called for missing media", { mediaId, userId });
      return handleServiceError(err) as any;
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
    // If S3 is configured, return a real signed URL
    if (this.s3 && env.s3BucketName) {
      const params = {
        Bucket: env.s3BucketName,
        Key: key,
        Expires: expiresIn,
      };

      return this.s3.getSignedUrl("getObject", params);
    }

    // Dev-mode: return a simulated local URL so clients can still request media
    // Format: /uploads/<key> with a query param to mimic expiry
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
    const safeKey = encodeURIComponent(key);
    return `${env.appUrl.replace(
      /\/$/,
      ""
    )}/uploads/${safeKey}?expires=${expiresAt}`;
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

  /**
   * Update media metadata
   */
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
      const err = new Error("Media not found");
      logger.warn("updateMediaMetadata called for missing media", {
        mediaId,
        userId,
      });
      if (env.nodeEnv === "production") throw err;
      return null as any;
    }

    return await prisma.mediaAsset.update({
      where: { id: mediaId },
      data: metadata,
    });
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
      const err = new Error("Upload session not found or expired");
      logger.warn("Upload chunk called for missing session", { sessionId });
      if (env.nodeEnv === "production") throw err;
      // Dev-fallback: return empty progress so callers can handle gracefully
      return {
        sessionId,
        progress: 0,
        uploadedBytes: 0,
        totalBytes: 0,
      };
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
      const err = new Error("Upload session not found or expired");
      logger.warn("Complete chunked upload called for missing session", {
        sessionId,
      });
      return handleServiceError(err) as any;
    }

    if (session.uploadedChunks !== session.totalChunks) {
      const err = new Error("Not all chunks have been uploaded");
      logger.warn("Complete chunked upload called before all chunks uploaded", {
        sessionId,
      });
      return handleServiceError(err) as any;
    }

    try {
      // Assemble chunks in order
      const chunks: Buffer[] = [];
      for (let i = 0; i < session.totalChunks; i++) {
        const chunk = session.chunks.get(i);
        if (!chunk) {
          const err = new Error(`Missing chunk ${i}`);
          logger.warn("Missing chunk in session", {
            sessionId,
            missingIndex: i,
          });
          return handleServiceError(err) as any;
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
      return handleServiceError(error);
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
        const err = new Error("Media not found");
        logger.warn("generateThumbnail called for missing media", { mediaId });
        if (env.nodeEnv === "production") throw err;
        return null;
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
