"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingService = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
const error_1 = require("../utils/error");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const sharp_1 = __importDefault(require("sharp"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
class MessagingService {
    // Performance optimizations
    static messageCache = new Map();
    static CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    static MAX_CACHED_MESSAGES = 1000;
    // Rate limiting for message sending
    static userMessageCounts = new Map();
    static MAX_MESSAGES_PER_MINUTE = 60;
    // Debounce typing indicators
    static typingTimeouts = new Map();
    // Media processing queue for background processing (placeholder - not currently used in main flow)
    static _mediaProcessingQueue = [];
    static _isProcessingMedia = false;
    // Media cache for frequently accessed media
    static mediaCache = new Map();
    static MEDIA_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
    static MAX_CACHED_MEDIA = 50;
    // Cache management
    static getCachedMessages(matchId) {
        const cached = this.messageCache.get(matchId);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.messages;
        }
        return null;
    }
    static setCachedMessages(matchId, messages) {
        this.messageCache.set(matchId, { messages, timestamp: Date.now() });
        // Clean up old cache entries
        if (this.messageCache.size > this.MAX_CACHED_MESSAGES) {
            const oldestKey = this.messageCache.keys().next().value;
            if (oldestKey) {
                this.messageCache.delete(oldestKey);
            }
        }
    }
    // Media cache management
    static getCachedMedia(mediaId) {
        const cached = this.mediaCache.get(mediaId);
        if (cached && Date.now() - cached.timestamp < this.MEDIA_CACHE_TTL) {
            return { data: cached.data, mimeType: cached.mimeType };
        }
        return null;
    }
    static setCachedMedia(mediaId, data, mimeType) {
        this.mediaCache.set(mediaId, { data, timestamp: Date.now(), mimeType });
        // Clean up old cache entries
        if (this.mediaCache.size > this.MAX_CACHED_MEDIA) {
            const oldestKey = this.mediaCache.keys().next().value;
            if (oldestKey) {
                this.mediaCache.delete(oldestKey);
            }
        }
    }
    // Rate limiting
    static checkRateLimit(userId) {
        const now = Date.now();
        const userLimit = this.userMessageCounts.get(userId);
        if (!userLimit || now > userLimit.resetTime) {
            this.userMessageCounts.set(userId, { count: 1, resetTime: now + 60000 });
            return true;
        }
        if (userLimit.count >= this.MAX_MESSAGES_PER_MINUTE) {
            return false;
        }
        userLimit.count++;
        return true;
    }
    // Send a message in a match
    static async sendMessage(data) {
        const { senderId, receiverId, content, messageType = "text" } = data;
        // Rate limiting check
        if (!this.checkRateLimit(senderId)) {
            throw new Error("Rate limit exceeded. Please wait before sending more messages.");
        }
        // Verify match exists and is active
        const match = await prisma_1.prisma.match.findFirst({
            where: {
                OR: [
                    { initiatorId: senderId, receiverId },
                    { initiatorId: receiverId, receiverId: senderId },
                ],
                status: "ACTIVE",
            },
        });
        if (!match) {
            const err = new Error("No active match found between users");
            logger_1.logger.warn("sendMessage no active match", { senderId, receiverId });
            return (0, error_1.handleServiceError)(err);
        }
        // Create message
        const message = await prisma_1.prisma.message.create({
            data: {
                senderId,
                receiverId,
                matchId: match.id,
                content,
                messageType,
                status: "SENT",
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        profile: {
                            select: { displayName: true },
                        },
                        photos: {
                            where: { isPrimary: true },
                            select: { url: true },
                        },
                    },
                },
                reactions: true,
            },
        });
        // Invalidate cache for this conversation
        this.messageCache.delete(match.id);
        // Update match's last activity
        await prisma_1.prisma.match.update({
            where: { id: match.id },
            data: { updatedAt: new Date() },
        });
        // Create notification for receiver
        // @ts-ignore - notification type field might not exist in schema
        await prisma_1.prisma.notification.create({
            data: {
                userId: receiverId,
                type: "message",
                title: `New message from ${message.senderId}`,
                body: messageType === "text" ? content : `Sent a ${messageType}`,
                data: {
                    matchId: match.id,
                    messageId: message.id,
                    senderId,
                },
            },
        });
        return message;
    }
    // Get messages for a match
    static async getMatchMessages(filters) {
        const { matchId, limit = 50, before } = filters;
        // Check cache first
        const cached = this.getCachedMessages(matchId);
        if (cached && !before) {
            return cached.slice(0, limit);
        }
        const messages = await prisma_1.prisma.message.findMany({
            where: {
                matchId,
                ...(before && { createdAt: { lt: new Date(before) } }),
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                displayName: true,
                            },
                        },
                    },
                },
                reactions: true,
            },
            orderBy: { createdAt: "desc" },
            take: limit,
        });
        // Cache the results if no pagination cursor
        if (!before) {
            this.setCachedMessages(matchId, messages);
        }
        return messages.reverse(); // Return in chronological order
    }
    // Mark messages as read
    static async markMessagesAsRead(matchId, userId) {
        await prisma_1.prisma.message.updateMany({
            where: {
                matchId,
                receiverId: userId,
                readAt: null,
            },
            data: {
                readAt: new Date(),
            },
        });
        return { success: true };
    }
    // Get unread message count
    static async getUnreadCount(userId) {
        const count = await prisma_1.prisma.message.count({
            where: {
                receiverId: userId,
                readAt: null,
            },
        });
        return count;
    }
    // Delete message (soft delete)
    static async deleteMessage(messageId, userId) {
        const message = await prisma_1.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            const err = new Error("Message not found");
            logger_1.logger.warn("deleteMessage message not found", { messageId });
            return (0, error_1.handleServiceError)(err);
        }
        if (message.senderId !== userId) {
            const err = new Error("Can only delete your own messages");
            logger_1.logger.warn("deleteMessage unauthorized", { messageId, userId });
            return (0, error_1.handleServiceError)(err);
        }
        await prisma_1.prisma.message.update({
            where: { id: messageId },
            data: {
                content: "This message was deleted",
            },
        });
        return { success: true };
    }
    // Get match details with recent messages
    static async getMatchDetails(matchId, userId) {
        const match = await prisma_1.prisma.match.findFirst({
            where: {
                id: matchId,
                OR: [{ initiatorId: userId }, { receiverId: userId }],
            },
            include: {
                initiator: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                displayName: true,
                                bio: true,
                            },
                        },
                        photos: {
                            where: { isPrimary: true },
                            select: { url: true },
                        },
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                displayName: true,
                                bio: true,
                            },
                        },
                        photos: {
                            where: { isPrimary: true },
                            select: { url: true },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 20,
                    include: {
                        sender: {
                            select: {
                                id: true,
                                profile: {
                                    select: { displayName: true },
                                },
                            },
                        },
                        reactions: {
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
                            orderBy: { createdAt: "asc" },
                        },
                    },
                },
            },
        });
        if (!match) {
            const err = new Error("Match not found");
            logger_1.logger.warn("getMatchDetails match not found", { matchId, userId });
            return (0, error_1.handleServiceError)(err);
        }
        const otherUser = match.initiatorId === userId ? match.receiver : match.initiator;
        return {
            ...match,
            otherUser,
            messages: match.messages.reverse(),
        };
    }
    // Report a message
    static async reportMessage(messageId, reporterId, reason) {
        const message = await prisma_1.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            const err = new Error("Message not found");
            logger_1.logger.warn("reportMessage message not found", { messageId });
            return (0, error_1.handleServiceError)(err);
        }
        if (message.senderId === reporterId) {
            const err = new Error("Cannot report your own message");
            logger_1.logger.warn("reportMessage self-report", { messageId, reporterId });
            return (0, error_1.handleServiceError)(err);
        }
        await prisma_1.prisma.report.create({
            data: {
                reporterId,
                reportedId: message.senderId,
                reason,
                // type not in schema, using reason instead 'message',
                // @ts-ignore - contentId field not in Report schema but needed for message reports
                contentId: messageId,
                description: `Reported message: "${message.content}"`,
            },
        });
        return { success: true };
    }
    // Add reaction to message
    static async addReaction(messageId, userId, reaction) {
        const message = await prisma_1.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            const err = new Error("Message not found");
            logger_1.logger.warn("addReaction message not found", { messageId });
            return (0, error_1.handleServiceError)(err);
        }
        // Check if user can react to this message (must be in the match)
        const match = await prisma_1.prisma.match.findFirst({
            where: {
                id: message.matchId,
                OR: [{ initiatorId: userId }, { receiverId: userId }],
            },
        });
        if (!match) {
            const err = new Error("Unauthorized to react to this message");
            logger_1.logger.warn("addReaction unauthorized", { messageId, userId });
            return (0, error_1.handleServiceError)(err);
        }
        // Check if reaction already exists
        const existingReaction = await prisma_1.prisma.messageReaction.findUnique({
            where: {
                messageId_userId_reaction: {
                    messageId,
                    userId,
                    reaction,
                },
            },
        });
        if (existingReaction) {
            const err = new Error("Reaction already exists");
            logger_1.logger.warn("addReaction duplicate reaction", {
                messageId,
                userId,
                reaction,
            });
            return (0, error_1.handleServiceError)(err);
        }
        const newReaction = await prisma_1.prisma.messageReaction.create({
            data: {
                messageId,
                userId,
                reaction,
            },
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
        return newReaction;
    }
    // Remove reaction from message
    static async removeReaction(messageId, userId, reaction) {
        const message = await prisma_1.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            const err = new Error("Message not found");
            logger_1.logger.warn("removeReaction message not found", { messageId });
            return (0, error_1.handleServiceError)(err);
        }
        // Check if user can react to this message (must be in the match)
        const match = await prisma_1.prisma.match.findFirst({
            where: {
                id: message.matchId,
                OR: [{ initiatorId: userId }, { receiverId: userId }],
            },
        });
        if (!match) {
            const err = new Error("Unauthorized to react to this message");
            logger_1.logger.warn("removeReaction unauthorized", { messageId, userId });
            return (0, error_1.handleServiceError)(err);
        }
        const deletedReaction = await prisma_1.prisma.messageReaction.findUnique({
            where: {
                messageId_userId_reaction: {
                    messageId,
                    userId,
                    reaction,
                },
            },
        });
        if (!deletedReaction) {
            const err = new Error("Reaction not found");
            logger_1.logger.warn("removeReaction reaction not found", {
                messageId,
                userId,
                reaction,
            });
            return (0, error_1.handleServiceError)(err);
        }
        await prisma_1.prisma.messageReaction.delete({
            where: {
                messageId_userId_reaction: {
                    messageId,
                    userId,
                    reaction,
                },
            },
        });
        return { success: true };
    }
    // Get reactions for a message
    static async getMessageReactions(messageId) {
        const message = await prisma_1.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            const err = new Error("Message not found");
            logger_1.logger.warn("getMessageReactions message not found", { messageId });
            return (0, error_1.handleServiceError)(err);
        }
        const reactions = await prisma_1.prisma.messageReaction.findMany({
            where: { messageId },
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
            orderBy: { createdAt: "asc" },
        });
        // Group reactions by type and count
        const reactionCounts = {};
        reactions.forEach((reaction) => {
            if (!reactionCounts[reaction.reaction]) {
                reactionCounts[reaction.reaction] = { count: 0, users: [] };
            }
            reactionCounts[reaction.reaction].count++;
            reactionCounts[reaction.reaction].users.push(reaction.user);
        });
        return {
            messageId,
            reactions: reactionCounts,
            totalCount: reactions.length,
        };
    }
    // Media upload optimization
    static async uploadMessageMedia(file, // multer file object
    messageId, _options = {}) {
        try {
            logger_1.logger.info(`Uploading media for message ${messageId} with options: ${JSON.stringify(_options)}`);
            // Add to processing queue if already processing
            if (this._isProcessingMedia) {
                return new Promise((resolve, reject) => {
                    this._mediaProcessingQueue.push({
                        file,
                        messageId,
                        options: _options,
                        resolve,
                        reject,
                    });
                    // Log queue status for analytics
                    logger_1.logger.info(`Media processing queued for message ${messageId}, queue size: ${this._mediaProcessingQueue.length}`);
                });
            }
            // Set processing flag
            this._isProcessingMedia = true;
            // Validate file type and size
            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/gif",
                "video/mp4",
                "video/quicktime",
            ];
            const maxSize = 50 * 1024 * 1024; // 50MB for better media support
            if (!allowedTypes.includes(file.mimetype)) {
                throw new Error("Invalid file type");
            }
            if (file.size > maxSize) {
                throw new Error("File too large");
            }
            // Process media based on type
            let processedFile = file;
            let thumbnailPath = null;
            if (file.mimetype.startsWith("image/") && _options.compress !== false) {
                processedFile = await this.compressImage(file, _options);
            }
            else if (file.mimetype.startsWith("video/")) {
                processedFile = await this.processVideo(file, _options);
            }
            // Generate thumbnail for supported media types
            if (_options.generateThumbnail !== false) {
                if (file.mimetype.startsWith("image/")) {
                    thumbnailPath = await this.generateImageThumbnail(processedFile);
                }
                else if (file.mimetype.startsWith("video/")) {
                    thumbnailPath = await this.generateVideoThumbnail(processedFile);
                }
            }
            // Generate unique filename
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}${path_1.default.extname(processedFile.originalname || file.originalname)}`;
            const filePath = path_1.default.join("uploads", "messages", fileName);
            // Ensure directory exists
            await fs_extra_1.default.ensureDir(path_1.default.dirname(filePath));
            // Move processed file to permanent location
            await fs_extra_1.default.move(processedFile.path, filePath);
            // Create media record
            const media = await prisma_1.prisma.media.create({
                data: {
                    url: `/uploads/messages/${fileName}`,
                    type: processedFile.mimetype.startsWith("image/") ? "image" : "video",
                    messageId,
                    thumbnailUrl: thumbnailPath
                        ? `/uploads/thumbnails/${path_1.default.basename(thumbnailPath)}`
                        : null,
                    metadata: {
                        originalSize: file.size,
                        processedSize: processedFile.size,
                        width: _options.maxWidth,
                        height: _options.maxHeight,
                        compression: _options.compress,
                    },
                },
            });
            return media;
        }
        catch (error) {
            // Clean up temp file if it exists
            if (file.path && (await fs_extra_1.default.pathExists(file.path))) {
                await fs_extra_1.default.unlink(file.path);
            }
            throw error;
        }
        finally {
            // Reset processing flag and process next in queue
            this._isProcessingMedia = false;
            if (this._mediaProcessingQueue.length > 0) {
                const next = this._mediaProcessingQueue.shift();
                if (next) {
                    // Log queue processing for analytics
                    logger_1.logger.info(`Processing next media item from queue, remaining: ${this._mediaProcessingQueue.length}`);
                    this.uploadMessageMedia(next.file, next.messageId, next.options)
                        .then(next.resolve)
                        .catch(next.reject);
                }
            }
        }
    }
    // Batch media upload with concurrent processing
    static async uploadBatchMedia(batchData) {
        const { files, messageId, options = {} } = batchData;
        logger_1.logger.info(`Batch uploading ${files.length} files for message ${messageId} with options: ${JSON.stringify(options)}`);
        // Process files concurrently with limit
        const concurrencyLimit = 3;
        const results = [];
        for (let i = 0; i < files.length; i += concurrencyLimit) {
            const batch = files.slice(i, i + concurrencyLimit);
            const batchPromises = batch.map((file) => this.uploadMessageMedia(file, messageId, options));
            const batchResults = await Promise.allSettled(batchPromises);
            batchResults.forEach((result) => {
                if (result.status === "fulfilled") {
                    results.push(result.value);
                }
                else {
                    logger_1.logger.error("Batch media upload failed:", result.reason);
                }
            });
        }
        return results;
    }
    // Image compression using Sharp
    static async compressImage(file, // multer file object
    _options) {
        try {
            const { maxWidth = 1920, maxHeight = 1080, quality = 80 } = _options;
            logger_1.logger.info(`Compressing image with options: width=${maxWidth}, height=${maxHeight}, quality=${quality}`);
            const compressedBuffer = await (0, sharp_1.default)(file.path)
                .resize(maxWidth, maxHeight, {
                fit: "inside",
                withoutEnlargement: true,
            })
                .jpeg({ quality })
                .png({ compressionLevel: 9 })
                .toBuffer();
            // Create new file object with compressed data
            const compressedFile = {
                ...file,
                buffer: compressedBuffer,
                size: compressedBuffer.length,
                mimetype: file.mimetype,
            };
            // Write compressed file to temp location
            const tempPath = `${file.path}_compressed`;
            await fs_extra_1.default.writeFile(tempPath, compressedBuffer);
            return {
                ...compressedFile,
                path: tempPath,
            };
        }
        catch (error) {
            logger_1.logger.error("Image compression failed:", error);
            return file; // Return original file if compression fails
        }
    }
    // Video processing using FFmpeg
    static async processVideo(file, // multer file object
    _options) {
        return new Promise((resolve, reject) => {
            logger_1.logger.info(`Processing video with options: ${JSON.stringify(_options)}`);
            const outputPath = `${file.path}_processed.mp4`;
            (0, fluent_ffmpeg_1.default)(file.path)
                .videoCodec("libx264")
                .audioCodec("aac")
                .size("1280x720")
                .videoBitrate("1000k")
                .audioBitrate("128k")
                .fps(30)
                .output(outputPath)
                .on("end", async () => {
                try {
                    const stats = await fs_extra_1.default.stat(outputPath);
                    resolve({
                        ...file,
                        path: outputPath,
                        size: stats.size,
                        mimetype: "video/mp4",
                    });
                }
                catch (error) {
                    reject(error);
                }
            })
                .on("error", reject)
                .run();
        });
    }
    // Generate image thumbnail
    static async generateImageThumbnail(file) {
        try {
            const thumbnailDir = path_1.default.join("uploads", "thumbnails");
            await fs_extra_1.default.ensureDir(thumbnailDir);
            const thumbnailName = `thumb_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
            const thumbnailPath = path_1.default.join(thumbnailDir, thumbnailName);
            await (0, sharp_1.default)(file.path)
                .resize(300, 300, {
                fit: "cover",
                position: "center",
            })
                .jpeg({ quality: 70 })
                .toFile(thumbnailPath);
            return thumbnailPath;
        }
        catch (error) {
            logger_1.logger.error("Thumbnail generation failed:", error);
            throw error;
        }
    }
    // Generate video thumbnail
    static async generateVideoThumbnail(file) {
        return new Promise((resolve, reject) => {
            const thumbnailDir = path_1.default.join("uploads", "thumbnails");
            const thumbnailName = `thumb_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
            const thumbnailPath = path_1.default.join(thumbnailDir, thumbnailName);
            (0, fluent_ffmpeg_1.default)(file.path)
                .screenshots({
                count: 1,
                folder: thumbnailDir,
                filename: thumbnailName,
                size: "300x300",
                timemarks: ["1"], // Take thumbnail at 1 second
            })
                .on("end", () => resolve(thumbnailPath))
                .on("error", reject);
        });
    }
    // Progressive media loading - get media with range support
    static async getMediaWithRange(mediaId, range) {
        try {
            // Check cache first
            const cached = this.getCachedMedia(mediaId);
            if (cached && !range) {
                return cached;
            }
            const media = await prisma_1.prisma.media.findUnique({
                where: { id: mediaId },
            });
            if (!media) {
                throw new Error("Media not found");
            }
            const filePath = path_1.default.join(process.cwd(), media.url);
            const stat = await fs_extra_1.default.stat(filePath);
            const totalSize = stat.size;
            let start = 0;
            let end = totalSize - 1;
            // Parse range header for partial content
            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                start = parseInt(parts[0], 10);
                end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
            }
            const data = await fs_extra_1.default.readFile(filePath);
            // Cache small files
            if (totalSize < 1024 * 1024 && !range) {
                // Cache files under 1MB
                this.setCachedMedia(mediaId, data, media.type === "image" ? "image/jpeg" : "video/mp4");
            }
            return {
                data: range ? data.slice(start, end + 1) : data,
                mimeType: media.type === "image" ? "image/jpeg" : "video/mp4",
                range: range ? { start, end, total: totalSize } : undefined,
            };
        }
        catch (error) {
            logger_1.logger.error("Media retrieval failed:", error);
            throw error;
        }
    }
    // Clean up old media files
    static async cleanupOldMedia(daysOld = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            const oldMedia = await prisma_1.prisma.media.findMany({
                where: {
                    createdAt: {
                        lt: cutoffDate,
                    },
                },
                select: { id: true, url: true, thumbnailUrl: true },
            });
            for (const media of oldMedia) {
                // Delete files from filesystem
                if (media.url) {
                    const filePath = path_1.default.join(process.cwd(), media.url);
                    if (await fs_extra_1.default.pathExists(filePath)) {
                        await fs_extra_1.default.unlink(filePath);
                    }
                }
                if (media.thumbnailUrl) {
                    const thumbPath = path_1.default.join(process.cwd(), media.thumbnailUrl);
                    if (await fs_extra_1.default.pathExists(thumbPath)) {
                        await fs_extra_1.default.unlink(thumbPath);
                    }
                }
                // Delete from database
                await prisma_1.prisma.media.delete({
                    where: { id: media.id },
                });
            }
            logger_1.logger.info(`Cleaned up ${oldMedia.length} old media files`);
        }
        catch (error) {
            logger_1.logger.error("Media cleanup failed:", error);
        }
    }
    // Optimized typing indicators with debouncing
    static async handleTyping(data) {
        const { matchId, userId, isTyping } = data;
        const key = `${matchId}_${userId}`;
        if (isTyping) {
            // Clear existing timeout
            if (this.typingTimeouts.has(key)) {
                clearTimeout(this.typingTimeouts.get(key));
            }
            // Emit typing event (this would need to be passed from the WebSocket handler)
            // For now, we'll just manage the timeout
            const timeout = setTimeout(() => {
                this.typingTimeouts.delete(key);
            }, 3000);
            this.typingTimeouts.set(key, timeout);
        }
        else {
            // Clear timeout
            if (this.typingTimeouts.has(key)) {
                clearTimeout(this.typingTimeouts.get(key));
                this.typingTimeouts.delete(key);
            }
        }
    }
    // Memory cleanup
    static cleanup() {
        // Clear caches
        this.messageCache.clear();
        this.userMessageCounts.clear();
        // Clear typing timeouts
        for (const timeout of this.typingTimeouts.values()) {
            clearTimeout(timeout);
        }
        this.typingTimeouts.clear();
    }
}
exports.MessagingService = MessagingService;
//# sourceMappingURL=messaging.service.js.map