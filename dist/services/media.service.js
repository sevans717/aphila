"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const prisma_1 = require("../lib/prisma");
const fs_1 = require("fs");
const path = require("path");
const uuid_1 = require("uuid");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const error_1 = require("../utils/error");
const Minio = __importStar(require("minio"));
const axios = require("axios");
class MediaService {
    static UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
    static THUMBNAIL_DIR = path.join(this.UPLOAD_DIR, "thumbnails");
    static CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    static minioClient = null;
    static mediaProxyUrl = null;
    static uploadSessions = new Map();
    static {
        // Initialize MinIO if credentials are available
        if (env_1.env.minioEndpoint && env_1.env.minioAccessKey && env_1.env.minioSecretKey) {
            this.minioClient = new Minio.Client({
                endPoint: env_1.env.minioEndpoint,
                port: parseInt(env_1.env.minioPort || "9000"),
                useSSL: env_1.env.minioUseSSL,
                accessKey: env_1.env.minioAccessKey,
                secretKey: env_1.env.minioSecretKey,
            });
            logger_1.logger.info("MinIO client initialized");
        }
        // Set media-proxy URL if configured
        if (process.env.MEDIA_PROXY_URL) {
            this.mediaProxyUrl = process.env.MEDIA_PROXY_URL;
            logger_1.logger.info(`Media proxy URL set to: ${this.mediaProxyUrl}`);
        }
    }
    // Initialize upload directory for local storage
    static async initializeUploadDir() {
        try {
            await fs_1.promises.access(this.UPLOAD_DIR);
        }
        catch {
            await fs_1.promises.mkdir(this.UPLOAD_DIR, { recursive: true });
        }
        try {
            await fs_1.promises.access(this.THUMBNAIL_DIR);
        }
        catch {
            await fs_1.promises.mkdir(this.THUMBNAIL_DIR, { recursive: true });
        }
        logger_1.logger.info("Upload directory initialized");
    }
    // Upload file (supports MinIO, media-proxy, and local storage)
    static async uploadFile(file, userId, _uploadType) {
        // Validate file size
        if (file.size > env_1.env.maxFileSize) {
            const msg = `File size exceeds limit (${env_1.env.maxFileSize / 1024 / 1024}MB)`;
            const err = new Error(msg);
            logger_1.logger.warn("uploadFile validation failed", { userId, size: file.size });
            return (0, error_1.handleServiceError)(err);
        }
        // Validate file type
        if (!env_1.env.allowedFileTypes.includes(file.mimetype)) {
            const msg = `Invalid file type. Allowed: ${env_1.env.allowedFileTypes.join(", ")}`;
            const err = new Error(msg);
            logger_1.logger.warn("uploadFile invalid file type", {
                userId,
                mimetype: file.mimetype,
            });
            return (0, error_1.handleServiceError)(err);
        }
        // Determine media type
        const mediaType = this.getMediaType(file.mimetype);
        // Generate unique filename
        const fileExtension = path.extname(file.originalname);
        const filename = `${userId}/${(0, uuid_1.v4)()}${fileExtension}`;
        let url;
        let metadata = {};
        try {
            // Upload to MinIO (primary storage)
            if (this.minioClient && env_1.env.minioBucketName) {
                url = await this.uploadToMinIO(filename, file.buffer, file.mimetype);
                logger_1.logger.info(`File uploaded to MinIO: ${filename}`);
            }
            else if (this.mediaProxyUrl) {
                // Upload via media-proxy
                url = await this.uploadViaMediaProxy(filename, file.buffer, file.mimetype);
                logger_1.logger.info(`File uploaded via media-proxy: ${filename}`);
            }
            else {
                // Upload to local storage
                const filepath = path.join(this.UPLOAD_DIR, filename);
                await fs_1.promises.mkdir(path.dirname(filepath), { recursive: true });
                await fs_1.promises.writeFile(filepath, file.buffer);
                url = `/uploads/${filename}`;
                logger_1.logger.info(`File uploaded to local storage: ${filename}`);
            }
            // Extract metadata if it's an image or video
            if (file.mimetype.startsWith("image/")) {
                metadata = await this.extractImageMetadata(file.buffer);
            }
            else if (file.mimetype.startsWith("video/")) {
                metadata = await this.extractVideoMetadata(file.buffer);
            }
            logger_1.logger.info(`File uploaded successfully: ${filename}`);
            // Persist media asset in database and return actual DB id
            const media = await prisma_1.prisma.mediaAsset.create({
                data: {
                    userId,
                    url,
                    type: mediaType,
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
        }
        catch (error) {
            logger_1.logger.error("Failed to upload file:", error);
            return (0, error_1.handleServiceError)(error);
        }
    }
    // Delete file (supports MinIO primary, media-proxy, and local storage)
    static async deleteFile(url) {
        try {
            if (this.minioClient && env_1.env.minioBucketName && url.includes("minio")) {
                // Delete from MinIO (primary)
                const key = this.extractKeyFromMinIOUrl(url);
                await this.minioClient.removeObject(env_1.env.minioBucketName, key);
                logger_1.logger.info(`File deleted from MinIO: ${key}`);
            }
            else if (this.mediaProxyUrl && url.includes("media-proxy")) {
                // Delete via media-proxy
                const key = this.extractKeyFromMediaProxyUrl(url);
                await this.deleteViaMediaProxy(key);
                logger_1.logger.info(`File deleted via media-proxy: ${key}`);
            }
            else {
                // Delete from local storage
                const filename = url.replace("/uploads/", "");
                const filepath = path.join(this.UPLOAD_DIR, filename);
                await fs_1.promises.unlink(filepath);
                logger_1.logger.info(`File deleted from local storage: ${filename}`);
            }
            logger_1.logger.info(`File deleted successfully: ${url}`);
        }
        catch (error) {
            logger_1.logger.error("Failed to delete file:", error);
            // Don't throw error for file deletion failures
        }
    }
    // Upload file to MinIO
    static async uploadToMinIO(filename, buffer, contentType) {
        if (!this.minioClient || !env_1.env.minioBucketName) {
            throw new Error("MinIO client not configured");
        }
        await this.minioClient.putObject(env_1.env.minioBucketName, filename, buffer, buffer.length, {
            "Content-Type": contentType,
        });
        // Generate URL based on MinIO endpoint configuration
        const protocol = env_1.env.minioUseSSL ? "https" : "http";
        const port = env_1.env.minioPort && env_1.env.minioPort !== "80" && env_1.env.minioPort !== "443"
            ? `:${env_1.env.minioPort}`
            : "";
        return `${protocol}://${env_1.env.minioEndpoint}${port}/${env_1.env.minioBucketName}/${filename}`;
    }
    // Upload file via media-proxy
    static async uploadViaMediaProxy(filename, buffer, contentType) {
        if (!this.mediaProxyUrl) {
            throw new Error("Media proxy not configured");
        }
        const response = await axios.post(`${this.mediaProxyUrl}/api/upload`, buffer, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
        if (response.status !== 200) {
            throw new Error(`Media proxy upload failed: ${response.statusText}`);
        }
        return response.data.url;
    }
    // Delete file via media-proxy
    static async deleteViaMediaProxy(key) {
        if (!this.mediaProxyUrl) {
            throw new Error("Media proxy not configured");
        }
        const response = await axios.delete(`${this.mediaProxyUrl}/api/media/${key}`);
        if (response.status !== 200 && response.status !== 204) {
            throw new Error(`Media proxy delete failed: ${response.statusText}`);
        }
    }
    // Extract key from MinIO URL
    static extractKeyFromMinIOUrl(url) {
        const bucketName = env_1.env.minioBucketName;
        if (!bucketName)
            return "";
        const bucketIndex = url.indexOf(`/${bucketName}/`);
        if (bucketIndex === -1)
            return "";
        return url.substring(bucketIndex + bucketName.length + 2);
    }
    // Extract key from media-proxy URL
    static extractKeyFromMediaProxyUrl(url) {
        const parts = url.split("/");
        return parts[parts.length - 1];
    }
    // Get media type from MIME type
    static getMediaType(mimeType) {
        if (mimeType.startsWith("image/")) {
            return mimeType === "image/gif" ? "GIF" : "IMAGE";
        }
        else if (mimeType.startsWith("video/")) {
            return "VIDEO";
        }
        else {
            return "OTHER";
        }
    }
    // Extract image metadata (width, height)
    static async extractImageMetadata(_buffer) {
        try {
            // This is a simplified implementation
            // In production, you'd use a library like 'sharp' or 'image-size'
            return { width: 1080, height: 1080 }; // Placeholder
        }
        catch (error) {
            logger_1.logger.warn("Failed to extract image metadata:", error);
            return {};
        }
    }
    // Extract video metadata (width, height, duration)
    static async extractVideoMetadata(_buffer) {
        try {
            // This is a simplified implementation
            // In production, you'd use ffmpeg or similar
            return { width: 1920, height: 1080, duration: 30 }; // Placeholder
        }
        catch (error) {
            logger_1.logger.warn("Failed to extract video metadata:", error);
            return {};
        }
    }
    // Upload profile photo
    static async uploadProfilePhoto(file, userId, isPrimary = false) {
        const uploadResult = await this.uploadFile(file, userId);
        // Create photo record
        const photo = await prisma_1.prisma.photo.create({
            data: {
                userId,
                url: uploadResult.url,
                isPrimary,
            },
        });
        // If this is primary, unset other primary photos
        if (isPrimary) {
            await prisma_1.prisma.photo.updateMany({
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
    static async getUserMedia(userId, options = {}) {
        const { type, limit = 20, offset = 0 } = options;
        const where = { userId };
        if (type)
            where.type = type;
        return await prisma_1.prisma.mediaAsset.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
        });
    }
    // Delete media asset
    static async deleteMedia(mediaId, userId) {
        const media = await prisma_1.prisma.mediaAsset.findFirst({
            where: { id: mediaId, userId },
        });
        if (!media) {
            const err = new Error("Media not found");
            logger_1.logger.warn("deleteMedia called for missing media", { mediaId, userId });
            return (0, error_1.handleServiceError)(err);
        }
        // Delete physical file
        await this.deleteFile(media.url);
        // Delete from database
        await prisma_1.prisma.mediaAsset.delete({
            where: { id: mediaId },
        });
        // If it was an image, also delete from photos table
        if (media.type === "IMAGE" || media.type === "GIF") {
            await prisma_1.prisma.photo.deleteMany({
                where: {
                    userId: media.userId,
                    url: media.url,
                },
            });
        }
        return { success: true };
    }
    // Generate signed URL for private files (supports MinIO and fallback)
    static async getSignedUrl(key, expiresIn = 3600) {
        // If MinIO is configured, return a MinIO signed URL
        if (this.minioClient && env_1.env.minioBucketName) {
            const signedUrl = await this.minioClient.presignedGetObject(env_1.env.minioBucketName, key, expiresIn);
            return signedUrl;
        }
        // Dev-mode: return a simulated local URL so clients can still request media
        // Format: /uploads/<key> with a query param to mimic expiry
        const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
        const safeKey = encodeURIComponent(key);
        return `${env_1.env.appUrl.replace(/\/$/, "")}/uploads/${safeKey}?expires=${expiresAt}`;
    }
    /**
     * Generate a presigned upload URL for direct uploads.
     * Supports MinIO and server-side fallback.
     */
    static async generatePresignedUploadUrl(userId, filename, contentType, expiresIn = 3600) {
        // sanitize/derive key to avoid client-controlled directories
        const ext = path.extname(filename) || "";
        const key = `${userId}/${(0, uuid_1.v4)()}${ext}`;
        // If MinIO configured, return a signed PUT URL (primary)
        if (this.minioClient && env_1.env.minioBucketName) {
            const uploadUrl = await this.minioClient.presignedPutObject(env_1.env.minioBucketName, key, expiresIn);
            logger_1.logger.info(`Generated MinIO presigned upload URL for key: ${key}`);
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
        const uploadUrl = `${env_1.env.appUrl.replace(/\/$/, "")}/api/v1/media/upload`;
        return {
            uploadUrl,
            key,
            expiresIn,
            method: "SERVER",
            headers: null,
        };
    }
    // Get media asset by ID
    static async getMediaById(mediaId) {
        return await prisma_1.prisma.mediaAsset.findUnique({
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
    static async updateMediaMetadata(mediaId, userId, metadata) {
        const media = await prisma_1.prisma.mediaAsset.findFirst({
            where: { id: mediaId, userId },
        });
        if (!media) {
            const err = new Error("Media not found");
            logger_1.logger.warn("updateMediaMetadata called for missing media", {
                mediaId,
                userId,
            });
            // Use centralized handler to control throwing vs. rejection
            return (0, error_1.handleServiceError)(err);
        }
        return await prisma_1.prisma.mediaAsset.update({
            where: { id: mediaId },
            data: metadata,
        });
    }
    /**
     * Start a chunked upload session for large files
     */
    static startChunkedUpload(userId, filename, totalSize, chunkSize = this.CHUNK_SIZE) {
        const sessionId = (0, uuid_1.v4)();
        const totalChunks = Math.ceil(totalSize / chunkSize);
        const session = {
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
        logger_1.logger.info("Chunked upload session started:", {
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
    static uploadChunk(sessionId, chunkIndex, chunkData) {
        const session = this.uploadSessions.get(sessionId);
        if (!session) {
            const err = new Error("Upload session not found or expired");
            logger_1.logger.warn("Upload chunk called for missing session", { sessionId });
            // In production, handleServiceError will re-throw; in dev it rejects.
            // Use centralized handler to keep behavior consistent across envs.
            if (env_1.env.nodeEnv === "production")
                return (0, error_1.handleServiceError)(err);
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
        const uploadedBytes = Array.from(session.chunks.values()).reduce((total, chunk) => total + chunk.length, 0);
        logger_1.logger.debug("Chunk uploaded:", {
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
    static async completeChunkedUpload(sessionId, uploadType = "image") {
        const session = this.uploadSessions.get(sessionId);
        if (!session) {
            const err = new Error("Upload session not found or expired");
            logger_1.logger.warn("Complete chunked upload called for missing session", {
                sessionId,
            });
            return (0, error_1.handleServiceError)(err);
        }
        if (session.uploadedChunks !== session.totalChunks) {
            const err = new Error("Not all chunks have been uploaded");
            logger_1.logger.warn("Complete chunked upload called before all chunks uploaded", {
                sessionId,
            });
            return (0, error_1.handleServiceError)(err);
        }
        try {
            // Assemble chunks in order
            const chunks = [];
            for (let i = 0; i < session.totalChunks; i++) {
                const chunk = session.chunks.get(i);
                if (!chunk) {
                    const err = new Error(`Missing chunk ${i}`);
                    logger_1.logger.warn("Missing chunk in session", {
                        sessionId,
                        missingIndex: i,
                    });
                    return (0, error_1.handleServiceError)(err);
                }
                chunks.push(chunk);
            }
            const completeBuffer = Buffer.concat(chunks);
            // Create file upload object
            const fileUpload = {
                buffer: completeBuffer,
                originalname: session.filename,
                mimetype: this.getMimeTypeFromExtension(session.filename),
                size: completeBuffer.length,
            };
            // Upload using existing upload method
            const result = await this.uploadFile(fileUpload, session.userId, uploadType);
            // Cleanup session
            this.uploadSessions.delete(sessionId);
            logger_1.logger.info("Chunked upload completed:", {
                sessionId,
                userId: session.userId,
                filename: session.filename,
                finalSize: completeBuffer.length,
                mediaId: result.id,
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error("Failed to complete chunked upload:", error);
            // Cleanup session on error
            this.uploadSessions.delete(sessionId);
            return (0, error_1.handleServiceError)(error);
        }
    }
    /**
     * Get upload progress for a session
     */
    static getUploadProgress(sessionId) {
        const session = this.uploadSessions.get(sessionId);
        if (!session) {
            return null;
        }
        const progress = (session.uploadedChunks / session.totalChunks) * 100;
        const uploadedBytes = Array.from(session.chunks.values()).reduce((total, chunk) => total + chunk.length, 0);
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
    static cancelUploadSession(sessionId) {
        const deleted = this.uploadSessions.delete(sessionId);
        if (deleted) {
            logger_1.logger.info("Upload session cancelled:", { sessionId });
        }
        return deleted;
    }
    /**
     * Get MIME type from file extension
     */
    static getMimeTypeFromExtension(filename) {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
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
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        };
        return mimeTypes[ext] || "application/octet-stream";
    }
    /**
     * Generate thumbnail for images and videos
     */
    static async generateThumbnail(mediaId, type) {
        try {
            const media = await prisma_1.prisma.mediaAsset.findUnique({
                where: { id: mediaId },
            });
            if (!media) {
                const err = new Error("Media not found");
                logger_1.logger.warn("generateThumbnail called for missing media", { mediaId });
                return (0, error_1.handleServiceError)(err);
            }
            // For now, return a placeholder thumbnail URL
            // In production, you'd use libraries like sharp, ffmpeg, etc.
            const thumbnailUrl = `/uploads/thumbnails/${mediaId}_thumb.jpg`;
            logger_1.logger.info("Thumbnail generated:", {
                mediaId,
                type,
                thumbnailUrl,
            });
            return thumbnailUrl;
        }
        catch (error) {
            logger_1.logger.error("Failed to generate thumbnail:", error);
            return null;
        }
    }
}
exports.MediaService = MediaService;
//# sourceMappingURL=media.service.js.map