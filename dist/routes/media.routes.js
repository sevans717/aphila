"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const zod_1 = require("zod");
const env_1 = require("../config/env");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const analytics_service_1 = require("../services/analytics.service");
const media_service_1 = require("../services/media.service");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
// Configure multer for file uploads
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: env_1.env.maxFileSize, // 5MB default
    },
    fileFilter: (req, file, cb) => {
        if (env_1.env.allowedFileTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type'));
        }
    },
});
// Validation schemas
const uploadMetadataSchema = zod_1.z.object({
    body: zod_1.z.object({
        type: zod_1.z.enum(['profile', 'community', 'message']).optional().default('profile'),
        description: zod_1.z.string().optional(),
    }),
});
const deleteMediaSchema = zod_1.z.object({
    params: zod_1.z.object({
        mediaId: zod_1.z.string().min(1),
    }),
});
// Chunked upload schemas
const startChunkedUploadSchema = zod_1.z.object({
    filename: zod_1.z.string().min(1),
    totalSize: zod_1.z.number().min(1).max(100 * 1024 * 1024), // Max 100MB
    chunkSize: zod_1.z.number().optional(),
    uploadType: zod_1.z.enum(['image', 'video', 'audio', 'document']).optional().default('image'),
});
const uploadChunkSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid(),
    chunkIndex: zod_1.z.number().min(0),
});
const completeUploadSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid(),
    uploadType: zod_1.z.enum(['image', 'video', 'audio', 'document']).optional().default('image'),
});
/**
 * Start chunked upload session for large files
 * POST /api/v1/media/chunked/start
 */
router.post('/chunked/start', auth_1.requireAuth, (0, validate_1.validateRequest)({
    body: startChunkedUploadSchema,
}), async (req, res) => {
    try {
        const { filename, totalSize, chunkSize, uploadType } = req.body;
        const userId = req.user.id;
        const sessionId = media_service_1.MediaService.startChunkedUpload(userId, filename, totalSize, chunkSize);
        logger_1.logger.info('Chunked upload session started:', {
            sessionId,
            userId,
            filename,
            totalSize,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, {
            sessionId,
            filename,
            totalSize,
            chunkSize: chunkSize || 1024 * 1024,
            uploadType,
        }, 201);
    }
    catch (error) {
        logger_1.logger.error('Failed to start chunked upload:', error);
        return response_1.ResponseHelper.serverError(res, 'Failed to start upload session');
    }
});
/**
 * Upload a chunk
 * POST /api/v1/media/chunked/upload
 */
router.post('/chunked/upload', auth_1.requireAuth, upload.single('chunk'), (0, validate_1.validateRequest)({
    body: uploadChunkSchema,
}), async (req, res) => {
    try {
        const { sessionId, chunkIndex } = req.body;
        if (!req.file) {
            return response_1.ResponseHelper.error(res, 'BAD_REQUEST', 'No chunk data provided', 400);
        }
        const progress = media_service_1.MediaService.uploadChunk(sessionId, parseInt(chunkIndex), req.file.buffer);
        logger_1.logger.debug('Chunk uploaded:', {
            sessionId,
            chunkIndex,
            progress: progress.progress,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, progress);
    }
    catch (error) {
        logger_1.logger.error('Failed to upload chunk:', error);
        return response_1.ResponseHelper.serverError(res, error.message);
    }
});
/**
 * Complete chunked upload
 * POST /api/v1/media/chunked/complete
 */
router.post('/chunked/complete', auth_1.requireAuth, (0, validate_1.validateRequest)({
    body: completeUploadSchema,
}), async (req, res) => {
    try {
        const { sessionId, uploadType } = req.body;
        const userId = req.user.id;
        const result = await media_service_1.MediaService.completeChunkedUpload(sessionId, uploadType);
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: 'media_upload_completed',
            properties: {
                mediaId: result.id,
                type: result.type,
                size: result.size,
                uploadMethod: 'chunked',
            }
        }).catch(err => {
            logger_1.logger.warn('Failed to track analytics:', err);
        });
        logger_1.logger.info('Chunked upload completed:', {
            sessionId,
            userId,
            mediaId: result.id,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, result, 201);
    }
    catch (error) {
        logger_1.logger.error('Failed to complete chunked upload:', error);
        return response_1.ResponseHelper.serverError(res, error.message);
    }
});
/**
 * Get upload progress
 * GET /api/v1/media/chunked/progress/:sessionId
 */
router.get('/chunked/progress/:sessionId', auth_1.requireAuth, (0, validate_1.validateRequest)({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid(),
    }),
}), async (req, res) => {
    try {
        const { sessionId } = req.params;
        const progress = media_service_1.MediaService.getUploadProgress(sessionId);
        if (!progress) {
            return response_1.ResponseHelper.notFound(res, 'Upload session');
        }
        return response_1.ResponseHelper.success(res, progress);
    }
    catch (error) {
        logger_1.logger.error('Failed to get upload progress:', error);
        return response_1.ResponseHelper.serverError(res, 'Failed to get progress');
    }
});
/**
 * Cancel upload session
 * DELETE /api/v1/media/chunked/:sessionId
 */
router.delete('/chunked/:sessionId', auth_1.requireAuth, (0, validate_1.validateRequest)({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid(),
    }),
}), async (req, res) => {
    try {
        const { sessionId } = req.params;
        const cancelled = media_service_1.MediaService.cancelUploadSession(sessionId);
        if (!cancelled) {
            return response_1.ResponseHelper.notFound(res, 'Upload session');
        }
        logger_1.logger.info('Upload session cancelled:', {
            sessionId,
            userId: req.user.id,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, {
            cancelled: true,
            sessionId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to cancel upload session:', error);
        return response_1.ResponseHelper.serverError(res, 'Failed to cancel session');
    }
});
/**
 * Upload media file
 * POST /api/v1/media/upload
 */
router.post('/upload', auth_1.requireAuth, upload.single('file'), (0, validate_1.validateRequest)({
    body: uploadMetadataSchema.shape.body,
}), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'BadRequest',
                message: 'No file provided',
            });
        }
        const { type, description } = req.body;
        const userId = req.user.userId;
        // Upload file using MediaService
        const uploadResult = await media_service_1.MediaService.uploadFile(req.file, userId);
        // Save media asset to database
        const mediaAsset = await prisma_1.prisma.mediaAsset.create({
            data: {
                userId,
                url: uploadResult.url,
                type: req.file.mimetype.startsWith('image/') ? 'IMAGE' :
                    req.file.mimetype.startsWith('video/') ? 'VIDEO' : 'OTHER',
                width: uploadResult.width,
                height: uploadResult.height,
                duration: uploadResult.duration,
            },
        });
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: 'media_uploaded',
            platform: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web',
            properties: {
                mediaType: mediaAsset.type,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                uploadType: type,
            },
        });
        res.status(201).json({
            id: mediaAsset.id,
            url: mediaAsset.url,
            type: mediaAsset.type,
            width: mediaAsset.width,
            height: mediaAsset.height,
            duration: mediaAsset.duration,
            createdAt: mediaAsset.createdAt,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to upload media:', error);
        if (error.message === 'Invalid file type') {
            return res.status(400).json({
                error: 'BadRequest',
                message: 'Invalid file type. Allowed types: ' + env_1.env.allowedFileTypes.join(', '),
            });
        }
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to upload media',
        });
    }
});
/**
 * Upload multiple files
 * POST /api/v1/media/upload-multiple
 */
router.post('/upload-multiple', auth_1.requireAuth, upload.array('files', 10), // Max 10 files
(0, validate_1.validateRequest)({
    body: uploadMetadataSchema.shape.body,
}), async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({
                error: 'BadRequest',
                message: 'No files provided',
            });
        }
        const { type } = req.body;
        const userId = req.user.userId;
        // Upload all files
        const uploadPromises = files.map(async (file) => {
            const uploadResult = await media_service_1.MediaService.uploadFile(file, userId);
            return prisma_1.prisma.mediaAsset.create({
                data: {
                    userId,
                    url: uploadResult.url,
                    type: file.mimetype.startsWith('image/') ? 'IMAGE' :
                        file.mimetype.startsWith('video/') ? 'VIDEO' : 'OTHER',
                    width: uploadResult.width,
                    height: uploadResult.height,
                    duration: uploadResult.duration,
                },
            });
        });
        const mediaAssets = await Promise.all(uploadPromises);
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: 'multiple_media_uploaded',
            platform: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web',
            properties: {
                fileCount: files.length,
                totalSize: files.reduce((sum, file) => sum + file.size, 0),
                uploadType: type,
            },
        });
        res.status(201).json({
            files: mediaAssets.map(asset => ({
                id: asset.id,
                url: asset.url,
                type: asset.type,
                width: asset.width,
                height: asset.height,
                duration: asset.duration,
                createdAt: asset.createdAt,
            })),
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to upload multiple media:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to upload media files',
        });
    }
});
/**
 * Get user's media assets
 * GET /api/v1/media
 */
router.get('/', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { type, limit = '20', offset = '0' } = req.query;
        const whereClause = { userId };
        if (type) {
            whereClause.type = type.toUpperCase();
        }
        const mediaAssets = await prisma_1.prisma.mediaAsset.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
        });
        const total = await prisma_1.prisma.mediaAsset.count({
            where: whereClause,
        });
        res.json({
            media: mediaAssets,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + parseInt(limit) < total,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get media assets:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to get media assets',
        });
    }
});
/**
 * Get specific media asset
 * GET /api/v1/media/:mediaId
 */
router.get('/:mediaId', auth_1.requireAuth, async (req, res) => {
    try {
        const { mediaId } = req.params;
        const userId = req.user.userId;
        const mediaAsset = await prisma_1.prisma.mediaAsset.findFirst({
            where: {
                id: mediaId,
                userId, // Ensure user owns the media
            },
        });
        if (!mediaAsset) {
            return res.status(404).json({
                error: 'NotFound',
                message: 'Media asset not found',
            });
        }
        res.json(mediaAsset);
    }
    catch (error) {
        logger_1.logger.error('Failed to get media asset:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to get media asset',
        });
    }
});
/**
 * Delete media asset
 * DELETE /api/v1/media/:mediaId
 */
router.delete('/:mediaId', auth_1.requireAuth, async (req, res) => {
    try {
        const { mediaId } = req.params;
        const userId = req.user.userId;
        // Check if media exists and user owns it
        const mediaAsset = await prisma_1.prisma.mediaAsset.findFirst({
            where: {
                id: mediaId,
                userId,
            },
        });
        if (!mediaAsset) {
            return res.status(404).json({
                error: 'NotFound',
                message: 'Media asset not found',
            });
        }
        // Delete from storage
        await media_service_1.MediaService.deleteFile(mediaAsset.url);
        // Delete from database
        await prisma_1.prisma.mediaAsset.delete({
            where: { id: mediaId },
        });
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: 'media_deleted',
            platform: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web',
            properties: {
                mediaType: mediaAsset.type,
                mediaId,
            },
        });
        res.json({
            success: true,
            message: 'Media asset deleted successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to delete media asset:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to delete media asset',
        });
    }
});
/**
 * Mark media as favorite
 * PUT /api/v1/media/:mediaId/favorite
 */
router.put('/:mediaId/favorite', auth_1.requireAuth, async (req, res) => {
    try {
        const { mediaId } = req.params;
        const userId = req.user.userId;
        const { isFavorite } = req.body;
        const mediaAsset = await prisma_1.prisma.mediaAsset.updateMany({
            where: {
                id: mediaId,
                userId,
            },
            data: {
                isFavorite: isFavorite ?? true,
            },
        });
        if (mediaAsset.count === 0) {
            return res.status(404).json({
                error: 'NotFound',
                message: 'Media asset not found',
            });
        }
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: 'media_favorited',
            platform: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web',
            properties: {
                mediaId,
                isFavorite,
            },
        });
        res.json({
            success: true,
            message: `Media ${isFavorite ? 'added to' : 'removed from'} favorites`,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update media favorite status:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to update media favorite status',
        });
    }
});
exports.default = router;
//# sourceMappingURL=media.routes.js.map