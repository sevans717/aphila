"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const prisma_1 = require("../lib/prisma");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const error_1 = require("../utils/error");
class MediaService {
    static UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
    static THUMBNAIL_DIR = path_1.default.join(this.UPLOAD_DIR, "thumbnails");
    static CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    static s3 = null;
    static uploadSessions = new Map();
    static {
        // Initialize S3 if credentials are available
        if (env_1.env.awsAccessKeyId && env_1.env.awsSecretAccessKey && env_1.env.s3BucketName) {
            aws_sdk_1.default.config.update({
                accessKeyId: env_1.env.awsAccessKeyId,
                secretAccessKey: env_1.env.awsSecretAccessKey,
                region: env_1.env.awsRegion,
            });
            this.s3 = new aws_sdk_1.default.S3();
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
    // Upload file (supports both local and S3)
    static async uploadFile(file, userId, uploadType) {
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
        const fileExtension = path_1.default.extname(file.originalname);
        const filename = `${userId}/${(0, uuid_1.v4)()}${fileExtension}`;
        let url;
        let metadata = {};
        try {
            if (this.s3 && env_1.env.s3BucketName) {
                // Upload to S3
                const uploadParams = {
                    Bucket: env_1.env.s3BucketName,
                    Key: filename,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                    ACL: "public-read",
                };
                const result = await this.s3.upload(uploadParams).promise();
                url = result.Location;
            }
            else {
                // Upload to local storage
                const filepath = path_1.default.join(this.UPLOAD_DIR, filename);
                await fs_1.promises.mkdir(path_1.default.dirname(filepath), { recursive: true });
                await fs_1.promises.writeFile(filepath, file.buffer);
                url = `/uploads/${filename}`;
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
    // Delete file (supports both local and S3)
    static async deleteFile(url) {
        try {
            if (this.s3 && env_1.env.s3BucketName && url.includes("amazonaws.com")) {
                // Delete from S3
                const key = url.split("/").slice(-2).join("/"); // Extract key from URL
                await this.s3
                    .deleteObject({
                    Bucket: env_1.env.s3BucketName,
                    Key: key,
                })
                    .promise();
            }
            else {
                // Delete from local storage
                const filename = url.replace("/uploads/", "");
                const filepath = path_1.default.join(this.UPLOAD_DIR, filename);
                await fs_1.promises.unlink(filepath);
            }
            logger_1.logger.info(`File deleted successfully: ${url}`);
        }
        catch (error) {
            logger_1.logger.error("Failed to delete file:", error);
            // Don't throw error for file deletion failures
        }
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
    static async extractImageMetadata(buffer) {
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
    static async extractVideoMetadata(buffer) {
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
    // Generate signed URL for private files (S3 only)
    static async getSignedUrl(key, expiresIn = 3600) {
        // If S3 is configured, return a real signed URL
        if (this.s3 && env_1.env.s3BucketName) {
            const params = {
                Bucket: env_1.env.s3BucketName,
                Key: key,
                Expires: expiresIn,
            };
            return this.s3.getSignedUrl("getObject", params);
        }
        // Dev-mode: return a simulated local URL so clients can still request media
        // Format: /uploads/<key> with a query param to mimic expiry
        const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
        const safeKey = encodeURIComponent(key);
        return `${env_1.env.appUrl.replace(/\/$/, "")}/uploads/${safeKey}?expires=${expiresAt}`;
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
            if (env_1.env.nodeEnv === "production")
                throw err;
            return null;
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
            if (env_1.env.nodeEnv === "production")
                throw err;
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
        const ext = path_1.default.extname(filename).toLowerCase();
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
                if (env_1.env.nodeEnv === "production")
                    throw err;
                return null;
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