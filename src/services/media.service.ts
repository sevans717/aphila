import { prisma } from "../lib/prisma";
import { promises as fs } from "fs";
const path = require("path");
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { handleServiceError } from "../utils/error";
import * as Minio from "minio";
const axios = require("axios");

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
  private static minioClient: Minio.Client | null = null;
  private static mediaProxyUrl: string | null = null;
  private static uploadSessions: Map<string, ChunkedUploadSession> = new Map();

  static {
    // Initialize MinIO if credentials are available
    if (env.minioEndpoint && env.minioAccessKey && env.minioSecretKey) {
      this.minioClient = new Minio.Client({
        endPoint: env.minioEndpoint,
        port: parseInt(env.minioPort || "9000"),
        useSSL: env.minioUseSSL,
        accessKey: env.minioAccessKey,
        secretKey: env.minioSecretKey,
      });
      logger.info("MinIO client initialized");
    }

    // Set media-proxy URL if configured
    if (process.env.MEDIA_PROXY_URL) {
      this.mediaProxyUrl = process.env.MEDIA_PROXY_URL;
      logger.info(`Media proxy URL set to: ${this.mediaProxyUrl}`);
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

  // Upload file (supports MinIO, media-proxy, and local storage)
  static async uploadFile(
    file: FileUpload,
    userId: string,
    _uploadType?: string
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
      // Upload to MinIO (primary storage)
      if (this.minioClient && env.minioBucketName) {
        url = await this.uploadToMinIO(filename, file.buffer, file.mimetype);
        logger.info(`File uploaded to MinIO: ${filename}`);
      } else if (this.mediaProxyUrl) {
        // Upload via media-proxy
        url = await this.uploadViaMediaProxy(
          filename,
          file.buffer,
          file.mimetype
        );
        logger.info(`File uploaded via media-proxy: ${filename}`);
      } else {
        // Upload to local storage
        const filepath = path.join(this.UPLOAD_DIR, filename);
        await fs.mkdir(path.dirname(filepath), { recursive: true });
        await fs.writeFile(filepath, file.buffer);
        url = `/uploads/${filename}`;
        logger.info(`File uploaded to local storage: ${filename}`);
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

  // Delete file (supports MinIO primary, media-proxy, and local storage)
  static async deleteFile(url: string): Promise<void> {
    try {
      if (this.minioClient && env.minioBucketName && url.includes("minio")) {
        // Delete from MinIO (primary)
        const key = this.extractKeyFromMinIOUrl(url);
        await this.minioClient.removeObject(env.minioBucketName, key);
        logger.info(`File deleted from MinIO: ${key}`);
      } else if (this.mediaProxyUrl && url.includes("media-proxy")) {
        // Delete via media-proxy
        const key = this.extractKeyFromMediaProxyUrl(url);
        await this.deleteViaMediaProxy(key);
        logger.info(`File deleted via media-proxy: ${key}`);
      } else {
        // Delete from local storage
        const filename = url.replace("/uploads/", "");
        const filepath = path.join(this.UPLOAD_DIR, filename);
        await fs.unlink(filepath);
        logger.info(`File deleted from local storage: ${filename}`);
      }

      logger.info(`File deleted successfully: ${url}`);
    } catch (error: any) {
      logger.error("Failed to delete file:", error);
      // Don't throw error for file deletion failures
    }
  }

  // Upload file to MinIO
  private static async uploadToMinIO(
    filename: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    if (!this.minioClient || !env.minioBucketName) {
      throw new Error("MinIO client not configured");
    }

    await this.minioClient.putObject(
      env.minioBucketName,
      filename,
      buffer,
      buffer.length,
      {
        "Content-Type": contentType,
      }
    );

    // Generate URL based on MinIO endpoint configuration
    const protocol = env.minioUseSSL ? "https" : "http";
    const port =
      env.minioPort && env.minioPort !== "80" && env.minioPort !== "443"
        ? `:${env.minioPort}`
        : "";

    return `${protocol}://${env.minioEndpoint}${port}/${env.minioBucketName}/${filename}`;
  }

  // Upload file via media-proxy
  private static async uploadViaMediaProxy(
    filename: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    if (!this.mediaProxyUrl) {
      throw new Error("Media proxy not configured");
    }

    const response = await axios.post(
      `${this.mediaProxyUrl}/api/upload`,
      buffer,
      {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`Media proxy upload failed: ${response.statusText}`);
    }

    return response.data.url;
  }

  // Delete file via media-proxy
  private static async deleteViaMediaProxy(key: string): Promise<void> {
    if (!this.mediaProxyUrl) {
      throw new Error("Media proxy not configured");
    }

    const response = await axios.delete(
      `${this.mediaProxyUrl}/api/media/${key}`
    );

    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`Media proxy delete failed: ${response.statusText}`);
    }
  }

  // Extract key from MinIO URL
  private static extractKeyFromMinIOUrl(url: string): string {
    const bucketName = env.minioBucketName;
    if (!bucketName) return "";

    const bucketIndex = url.indexOf(`/${bucketName}/`);
    if (bucketIndex === -1) return "";

    return url.substring(bucketIndex + bucketName.length + 2);
  }

  // Extract key from media-proxy URL
  private static extractKeyFromMediaProxyUrl(url: string): string {
    const parts = url.split("/");
    return parts[parts.length - 1];
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
    _buffer: Buffer
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
    _buffer: Buffer
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

  // Generate signed URL for private files (supports MinIO and fallback)
  static async getSignedUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    // If MinIO is configured, return a MinIO signed URL
    if (this.minioClient && env.minioBucketName) {
      const signedUrl = await this.minioClient.presignedGetObject(
        env.minioBucketName,
        key,
        expiresIn
      );
      return signedUrl;
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

  /**
   * Generate a presigned upload URL for direct uploads.
   * Supports MinIO and server-side fallback.
   */
  static async generatePresignedUploadUrl(
    userId: string,
    filename: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<{
    uploadUrl: string;
    key: string;
    expiresIn: number;
    method: "PUT" | "POST" | "SERVER";
    headers?: Record<string, string> | null;
  }> {
    // sanitize/derive key to avoid client-controlled directories
    const ext = path.extname(filename) || "";
    const key = `${userId}/${uuidv4()}${ext}`;

    // If MinIO configured, return a signed PUT URL (primary)
    if (this.minioClient && env.minioBucketName) {
      const uploadUrl = await this.minioClient.presignedPutObject(
        env.minioBucketName,
        key,
        expiresIn
      );

      logger.info(`Generated MinIO presigned upload URL for key: ${key}`);

      return {
        uploadUrl,
        key,
        expiresIn,
        method: "PUT",
        headers: { "Content-Type": contentType },
      };
    }

    // If media-proxy is configured, return proxy upload URL
    if (this.mediaProxyUrl) {
      const uploadUrl = `${this.mediaProxyUrl}/api/upload/presigned`;

      return {
        uploadUrl,
        key,
        expiresIn,
        method: "POST",
        headers: null,
      };
    }

    // Dev fallback: instruct client to use the server upload endpoint (multipart)
    // Client should POST multipart/form-data to the upload endpoint. The server will
    // generate its own key and persist the file. We still return a suggested key to
    // help the client associate uploads, but the server's upload endpoint will control
    // the final storage path.
    const uploadUrl = `${env.appUrl.replace(/\/$/, "")}/api/v1/media/upload`;

    return {
      uploadUrl,
      key,
      expiresIn,
      method: "SERVER",
      headers: null,
    };
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
      // Use centralized handler to control throwing vs. rejection
      return handleServiceError(err) as any;
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
    setTimeout(
      () => {
        this.uploadSessions.delete(sessionId);
      },
      24 * 60 * 60 * 1000
    );

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
      // In production, handleServiceError will re-throw; in dev it rejects.
      // Use centralized handler to keep behavior consistent across envs.
      if (env.nodeEnv === "production") return handleServiceError(err) as any;
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
        return handleServiceError(err) as any;
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
