import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";
import { handleServiceError } from "../utils/error";
import fs from "fs-extra";
import path from "path";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";

// using shared singleton `prisma` from src/lib/prisma

interface CreateMessageData {
  senderId: string;
  receiverId: string;
  content: string;
  messageType?: "text" | "image" | "gif" | "emoji";
}

interface MessageFilters {
  matchId: string;
  limit?: number;
  before?: string; // messageId for pagination
}

interface MediaProcessingOptions {
  compress?: boolean;
  generateThumbnail?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

interface BatchMediaUpload {
  files: any[]; // multer file objects
  messageId: string;
  options?: MediaProcessingOptions;
}

export class MessagingService {
  // Performance optimizations
  private static messageCache = new Map<
    string,
    { messages: any[]; timestamp: number }
  >();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CACHED_MESSAGES = 1000;

  // Rate limiting for message sending
  private static userMessageCounts = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private static readonly MAX_MESSAGES_PER_MINUTE = 60;

  // Debounce typing indicators
  private static typingTimeouts = new Map<string, NodeJS.Timeout>();

  // Media processing queue for background processing (placeholder - not currently used in main flow)
  private static _mediaProcessingQueue: Array<{
    file: Express.Multer.File;
    messageId: string;
    options: MediaProcessingOptions;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private static _isProcessingMedia = false;

  // Media cache for frequently accessed media
  private static mediaCache = new Map<
    string,
    { data: Buffer; timestamp: number; mimeType: string }
  >();
  private static readonly MEDIA_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private static readonly MAX_CACHED_MEDIA = 50;

  // Cache management
  private static getCachedMessages(matchId: string): any[] | null {
    const cached = this.messageCache.get(matchId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.messages;
    }
    return null;
  }

  private static setCachedMessages(matchId: string, messages: any[]): void {
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
  private static getCachedMedia(
    mediaId: string
  ): { data: Buffer; mimeType: string } | null {
    const cached = this.mediaCache.get(mediaId);
    if (cached && Date.now() - cached.timestamp < this.MEDIA_CACHE_TTL) {
      return { data: cached.data, mimeType: cached.mimeType };
    }
    return null;
  }

  private static setCachedMedia(
    mediaId: string,
    data: Buffer,
    mimeType: string
  ): void {
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
  private static checkRateLimit(userId: string): boolean {
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
  static async sendMessage(data: CreateMessageData) {
    const { senderId, receiverId, content, messageType = "text" } = data;

    // Rate limiting check
    if (!this.checkRateLimit(senderId)) {
      throw new Error(
        "Rate limit exceeded. Please wait before sending more messages."
      );
    }

    // Verify match exists and is active
    const match = await prisma.match.findFirst({
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
      logger.warn("sendMessage no active match", { senderId, receiverId });
      return handleServiceError(err);
    }

    // Create message
    const message = await prisma.message.create({
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
    await prisma.match.update({
      where: { id: match.id },
      data: { updatedAt: new Date() },
    });

    // Create notification for receiver
    // @ts-ignore - notification type field might not exist in schema
    await prisma.notification.create({
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
  static async getMatchMessages(filters: MessageFilters) {
    const { matchId, limit = 50, before } = filters;

    // Check cache first
    const cached = this.getCachedMessages(matchId);
    if (cached && !before) {
      return cached.slice(0, limit);
    }

    const messages = await prisma.message.findMany({
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
  static async markMessagesAsRead(matchId: string, userId: string) {
    await prisma.message.updateMany({
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
  static async getUnreadCount(userId: string) {
    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        readAt: null,
      },
    });

    return count;
  }

  // Delete message (soft delete)
  static async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      const err = new Error("Message not found");
      logger.warn("deleteMessage message not found", { messageId });
      return handleServiceError(err);
    }

    if (message.senderId !== userId) {
      const err = new Error("Can only delete your own messages");
      logger.warn("deleteMessage unauthorized", { messageId, userId });
      return handleServiceError(err);
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        content: "This message was deleted",
      },
    });

    return { success: true };
  }

  // Get match details with recent messages
  static async getMatchDetails(matchId: string, userId: string) {
    const match = await prisma.match.findFirst({
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
      logger.warn("getMatchDetails match not found", { matchId, userId });
      return handleServiceError(err);
    }

    const otherUser =
      match.initiatorId === userId ? match.receiver : match.initiator;

    return {
      ...match,
      otherUser,
      messages: match.messages.reverse(),
    };
  }

  // Report a message
  static async reportMessage(
    messageId: string,
    reporterId: string,
    reason: string
  ) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      const err = new Error("Message not found");
      logger.warn("reportMessage message not found", { messageId });
      return handleServiceError(err);
    }

    if (message.senderId === reporterId) {
      const err = new Error("Cannot report your own message");
      logger.warn("reportMessage self-report", { messageId, reporterId });
      return handleServiceError(err);
    }

    await prisma.report.create({
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
  static async addReaction(
    messageId: string,
    userId: string,
    reaction: string
  ) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      const err = new Error("Message not found");
      logger.warn("addReaction message not found", { messageId });
      return handleServiceError(err);
    }

    // Check if user can react to this message (must be in the match)
    const match = await prisma.match.findFirst({
      where: {
        id: message.matchId,
        OR: [{ initiatorId: userId }, { receiverId: userId }],
      },
    });

    if (!match) {
      const err = new Error("Unauthorized to react to this message");
      logger.warn("addReaction unauthorized", { messageId, userId });
      return handleServiceError(err);
    }

    // Check if reaction already exists
    const existingReaction = await prisma.messageReaction.findUnique({
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
      logger.warn("addReaction duplicate reaction", {
        messageId,
        userId,
        reaction,
      });
      return handleServiceError(err);
    }

    const newReaction = await prisma.messageReaction.create({
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
  static async removeReaction(
    messageId: string,
    userId: string,
    reaction: string
  ) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      const err = new Error("Message not found");
      logger.warn("removeReaction message not found", { messageId });
      return handleServiceError(err);
    }

    // Check if user can react to this message (must be in the match)
    const match = await prisma.match.findFirst({
      where: {
        id: message.matchId,
        OR: [{ initiatorId: userId }, { receiverId: userId }],
      },
    });

    if (!match) {
      const err = new Error("Unauthorized to react to this message");
      logger.warn("removeReaction unauthorized", { messageId, userId });
      return handleServiceError(err);
    }

    const deletedReaction = await prisma.messageReaction.findUnique({
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
      logger.warn("removeReaction reaction not found", {
        messageId,
        userId,
        reaction,
      });
      return handleServiceError(err);
    }

    await prisma.messageReaction.delete({
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
  static async getMessageReactions(messageId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      const err = new Error("Message not found");
      logger.warn("getMessageReactions message not found", { messageId });
      return handleServiceError(err);
    }

    const reactions = await prisma.messageReaction.findMany({
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
    const reactionCounts: { [key: string]: { count: number; users: any[] } } =
      {};

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
  static async uploadMessageMedia(
    file: any, // multer file object
    messageId: string,
    _options: MediaProcessingOptions = {}
  ): Promise<any> {
    try {
      logger.info(
        `Uploading media for message ${messageId} with options: ${JSON.stringify(_options)}`
      );

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
          logger.info(
            `Media processing queued for message ${messageId}, queue size: ${this._mediaProcessingQueue.length}`
          );
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
      let thumbnailPath: string | null = null;

      if (file.mimetype.startsWith("image/") && _options.compress !== false) {
        processedFile = await this.compressImage(file, _options);
      } else if (file.mimetype.startsWith("video/")) {
        processedFile = await this.processVideo(file, _options);
      }

      // Generate thumbnail for supported media types
      if (_options.generateThumbnail !== false) {
        if (file.mimetype.startsWith("image/")) {
          thumbnailPath = await this.generateImageThumbnail(processedFile);
        } else if (file.mimetype.startsWith("video/")) {
          thumbnailPath = await this.generateVideoThumbnail(processedFile);
        }
      }

      // Generate unique filename
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(processedFile.originalname || file.originalname)}`;
      const filePath = path.join("uploads", "messages", fileName);

      // Ensure directory exists
      await fs.ensureDir(path.dirname(filePath));

      // Move processed file to permanent location
      await fs.move(processedFile.path, filePath);

      // Create media record
      const media = await prisma.media.create({
        data: {
          url: `/uploads/messages/${fileName}`,
          type: processedFile.mimetype.startsWith("image/") ? "image" : "video",
          messageId,
          thumbnailUrl: thumbnailPath
            ? `/uploads/thumbnails/${path.basename(thumbnailPath)}`
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
    } catch (error) {
      // Clean up temp file if it exists
      if (file.path && (await fs.pathExists(file.path))) {
        await fs.unlink(file.path);
      }
      throw error;
    } finally {
      // Reset processing flag and process next in queue
      this._isProcessingMedia = false;
      if (this._mediaProcessingQueue.length > 0) {
        const next = this._mediaProcessingQueue.shift();
        if (next) {
          // Log queue processing for analytics
          logger.info(
            `Processing next media item from queue, remaining: ${this._mediaProcessingQueue.length}`
          );
          this.uploadMessageMedia(next.file, next.messageId, next.options)
            .then(next.resolve)
            .catch(next.reject);
        }
      }
    }
  }

  // Batch media upload with concurrent processing
  static async uploadBatchMedia(batchData: BatchMediaUpload): Promise<any[]> {
    const { files, messageId, options = {} } = batchData;

    logger.info(
      `Batch uploading ${files.length} files for message ${messageId} with options: ${JSON.stringify(options)}`
    );

    // Process files concurrently with limit
    const concurrencyLimit = 3;
    const results: any[] = [];

    for (let i = 0; i < files.length; i += concurrencyLimit) {
      const batch = files.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map((file) =>
        this.uploadMessageMedia(file, messageId, options)
      );

      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach((result) => {
        if (result.status === "fulfilled") {
          results.push(result.value);
        } else {
          logger.error("Batch media upload failed:", result.reason);
        }
      });
    }

    return results;
  }

  // Image compression using Sharp
  private static async compressImage(
    file: any, // multer file object
    _options: MediaProcessingOptions
  ): Promise<any> {
    try {
      const { maxWidth = 1920, maxHeight = 1080, quality = 80 } = _options;

      logger.info(
        `Compressing image with options: width=${maxWidth}, height=${maxHeight}, quality=${quality}`
      );

      const compressedBuffer = await sharp(file.path)
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
      await fs.writeFile(tempPath, compressedBuffer);

      return {
        ...compressedFile,
        path: tempPath,
      };
    } catch (error) {
      logger.error("Image compression failed:", error);
      return file; // Return original file if compression fails
    }
  }

  // Video processing using FFmpeg
  private static async processVideo(
    file: any, // multer file object
    _options: MediaProcessingOptions
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      logger.info(`Processing video with options: ${JSON.stringify(_options)}`);

      const outputPath = `${file.path}_processed.mp4`;

      ffmpeg(file.path)
        .videoCodec("libx264")
        .audioCodec("aac")
        .size("1280x720")
        .videoBitrate("1000k")
        .audioBitrate("128k")
        .fps(30)
        .output(outputPath)
        .on("end", async () => {
          try {
            const stats = await fs.stat(outputPath);
            resolve({
              ...file,
              path: outputPath,
              size: stats.size,
              mimetype: "video/mp4",
            });
          } catch (error) {
            reject(error);
          }
        })
        .on("error", reject)
        .run();
    });
  }

  // Generate image thumbnail
  private static async generateImageThumbnail(file: any): Promise<string> {
    try {
      const thumbnailDir = path.join("uploads", "thumbnails");
      await fs.ensureDir(thumbnailDir);

      const thumbnailName = `thumb_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const thumbnailPath = path.join(thumbnailDir, thumbnailName);

      await sharp(file.path)
        .resize(300, 300, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 70 })
        .toFile(thumbnailPath);

      return thumbnailPath;
    } catch (error) {
      logger.error("Thumbnail generation failed:", error);
      throw error;
    }
  }

  // Generate video thumbnail
  private static async generateVideoThumbnail(file: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const thumbnailDir = path.join("uploads", "thumbnails");
      const thumbnailName = `thumb_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const thumbnailPath = path.join(thumbnailDir, thumbnailName);

      ffmpeg(file.path)
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
  static async getMediaWithRange(
    mediaId: string,
    range?: string
  ): Promise<{
    data: Buffer;
    mimeType: string;
    range?: { start: number; end: number; total: number };
  }> {
    try {
      // Check cache first
      const cached = this.getCachedMedia(mediaId);
      if (cached && !range) {
        return cached;
      }

      const media = await prisma.media.findUnique({
        where: { id: mediaId },
      });

      if (!media) {
        throw new Error("Media not found");
      }

      const filePath = path.join(process.cwd(), media.url);
      const stat = await fs.stat(filePath);
      const totalSize = stat.size;

      let start = 0;
      let end = totalSize - 1;

      // Parse range header for partial content
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        start = parseInt(parts[0], 10);
        end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
      }

      const data = await fs.readFile(filePath);

      // Cache small files
      if (totalSize < 1024 * 1024 && !range) {
        // Cache files under 1MB
        this.setCachedMedia(
          mediaId,
          data,
          media.type === "image" ? "image/jpeg" : "video/mp4"
        );
      }

      return {
        data: range ? data.slice(start, end + 1) : data,
        mimeType: media.type === "image" ? "image/jpeg" : "video/mp4",
        range: range ? { start, end, total: totalSize } : undefined,
      };
    } catch (error) {
      logger.error("Media retrieval failed:", error);
      throw error;
    }
  }

  // Clean up old media files
  static async cleanupOldMedia(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const oldMedia = await prisma.media.findMany({
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
          const filePath = path.join(process.cwd(), media.url);
          if (await fs.pathExists(filePath)) {
            await fs.unlink(filePath);
          }
        }

        if (media.thumbnailUrl) {
          const thumbPath = path.join(process.cwd(), media.thumbnailUrl);
          if (await fs.pathExists(thumbPath)) {
            await fs.unlink(thumbPath);
          }
        }

        // Delete from database
        await prisma.media.delete({
          where: { id: media.id },
        });
      }

      logger.info(`Cleaned up ${oldMedia.length} old media files`);
    } catch (error) {
      logger.error("Media cleanup failed:", error);
    }
  }

  // Optimized typing indicators with debouncing
  static async handleTyping(data: {
    matchId: string;
    userId: string;
    isTyping: boolean;
  }): Promise<void> {
    const { matchId, userId, isTyping } = data;
    const key = `${matchId}_${userId}`;

    if (isTyping) {
      // Clear existing timeout
      if (this.typingTimeouts.has(key)) {
        clearTimeout(this.typingTimeouts.get(key)!);
      }

      // Emit typing event (this would need to be passed from the WebSocket handler)
      // For now, we'll just manage the timeout
      const timeout = setTimeout(() => {
        this.typingTimeouts.delete(key);
      }, 3000);

      this.typingTimeouts.set(key, timeout);
    } else {
      // Clear timeout
      if (this.typingTimeouts.has(key)) {
        clearTimeout(this.typingTimeouts.get(key));
        this.typingTimeouts.delete(key);
      }
    }
  }

  // Memory cleanup
  static cleanup(): void {
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
