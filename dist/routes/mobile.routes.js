"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
// Validation schemas
const pushTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string().min(1),
        platform: zod_1.z.enum(["ios", "android", "web"]),
        deviceId: zod_1.z.string().optional(),
    }),
});
const deviceInfoSchema = zod_1.z.object({
    body: zod_1.z.object({
        deviceId: zod_1.z.string(),
        platform: zod_1.z.enum(["ios", "android", "web"]),
        version: zod_1.z.string(),
        model: zod_1.z.string().optional(),
        osVersion: zod_1.z.string().optional(),
        appVersion: zod_1.z.string().optional(),
    }),
});
const syncSchema = zod_1.z.object({
    body: zod_1.z.object({
        lastSync: zod_1.z.string().datetime().optional(),
        syncType: zod_1.z.enum(["full", "incremental"]).optional().default("incremental"),
    }),
});
const offlineQueueSchema = zod_1.z.object({
    body: zod_1.z.object({
        actions: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            type: zod_1.z.string(),
            data: zod_1.z.any(),
            timestamp: zod_1.z.string().datetime(),
        })),
    }),
});
/**
 * Mobile app configuration
 * GET /api/v1/mobile/config
 */
router.get("/config", async (req, res) => {
    try {
        // Log analytics for mobile config access
        logger_1.logger.info(`Mobile config requested from ${req.ip} with user-agent: ${req.headers["user-agent"]}`);
        // Get app configuration from database or environment
        const config = {
            version: process.env.APP_VERSION || "1.0.0",
            minVersion: process.env.MIN_APP_VERSION || "1.0.0",
            features: {
                pushNotifications: true,
                offlineMode: true,
                geolocation: true,
                mediaUpload: true,
                realtimeMessaging: true,
                stories: true,
                communities: true,
                analytics: true,
            },
            limits: {
                maxMediaSize: 10 * 1024 * 1024, // 10MB
                maxPostsPerDay: 50,
                maxStoriesPerDay: 10,
                maxMessageLength: 1000,
            },
            api: {
                baseUrl: process.env.API_BASE_URL || "http://localhost:4000",
                websocketUrl: process.env.WEBSOCKET_URL || "ws://localhost:4000",
            },
            updatedAt: new Date().toISOString(),
        };
        return response_1.ResponseHelper.success(res, config);
    }
    catch (error) {
        logger_1.logger.error("Failed to get mobile config:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to get mobile config");
    }
});
/**
 * Mobile push token registration
 * POST /api/v1/mobile/push-token
 */
router.post("/push-token", auth_1.requireAuth, (0, validate_1.validateRequest)({ body: pushTokenSchema.shape.body }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { token, platform, deviceId } = req.body;
        // Find or create device
        let device = await prisma_1.prisma.device.findFirst({
            where: {
                userId,
                deviceId: deviceId || token.substring(0, 50), // Use deviceId or first 50 chars of token
            },
        });
        if (!device) {
            device = await prisma_1.prisma.device.create({
                data: {
                    userId,
                    deviceId: deviceId || token.substring(0, 50),
                    platform: platform,
                    fcmToken: platform !== "web" ? token : null,
                },
            });
        }
        else {
            // Update existing device
            device = await prisma_1.prisma.device.update({
                where: { id: device.id },
                data: {
                    fcmToken: platform !== "web" ? token : null,
                    isActive: true,
                    lastUsedAt: new Date(),
                },
            });
        }
        // Create or update device token
        const deviceToken = await prisma_1.prisma.deviceToken.upsert({
            where: {
                token: token,
            },
            update: {
                isActive: true,
            },
            create: {
                userId,
                deviceId: device.id,
                token,
                platform: platform,
            },
        });
        logger_1.logger.info("Push token registered:", {
            userId,
            deviceId: device.id,
            platform,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, {
            deviceId: device.id,
            tokenId: deviceToken.id,
            registered: true,
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to register push token:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to register push token");
    }
});
/**
 * Mobile device info registration
 * POST /api/v1/mobile/device-info
 */
router.post("/device-info", auth_1.requireAuth, (0, validate_1.validateRequest)({ body: deviceInfoSchema.shape.body }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { deviceId, platform, version, model, osVersion, appVersion } = req.body;
        // Find or create device
        const device = await prisma_1.prisma.device.upsert({
            where: {
                deviceId: deviceId,
            },
            update: {
                platform: platform,
                isActive: true,
                lastUsedAt: new Date(),
            },
            create: {
                userId,
                deviceId,
                platform: platform,
            },
        });
        logger_1.logger.info("Device info registered:", {
            userId,
            deviceId,
            platform,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, {
            deviceId: device.id,
            registered: true,
            platform,
            version,
            model,
            osVersion,
            appVersion,
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to register device info:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to register device info");
    }
});
/**
 * Mobile app sync
 * POST /api/v1/mobile/sync
 */
router.post("/sync", auth_1.requireAuth, (0, validate_1.validateRequest)({ body: syncSchema.shape.body }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { lastSync, syncType } = req.body;
        const syncTimestamp = new Date();
        const lastSyncDate = lastSync ? new Date(lastSync) : new Date(0);
        // Get data changes since last sync
        const changes = {
            profile: await prisma_1.prisma.profile.findUnique({
                where: { userId },
                select: {
                    id: true,
                    displayName: true,
                    bio: true,
                    avatar: true,
                    updatedAt: true,
                },
            }),
            settings: await prisma_1.prisma.userSetting.findUnique({
                where: { userId },
                select: {
                    id: true,
                    darkMode: true,
                    showOnlineStatus: true,
                    updatedAt: true,
                },
            }),
            newMatches: await prisma_1.prisma.match.findMany({
                where: {
                    OR: [{ initiatorId: userId }, { receiverId: userId }],
                    createdAt: {
                        gt: lastSyncDate,
                    },
                },
                include: {
                    initiator: {
                        select: {
                            id: true,
                            profile: {
                                select: {
                                    displayName: true,
                                    avatar: true,
                                },
                            },
                        },
                    },
                    receiver: {
                        select: {
                            id: true,
                            profile: {
                                select: {
                                    displayName: true,
                                    avatar: true,
                                },
                            },
                        },
                    },
                },
                take: 50,
            }),
            newMessages: await prisma_1.prisma.message.findMany({
                where: {
                    OR: [{ senderId: userId }, { receiverId: userId }],
                    createdAt: {
                        gt: lastSyncDate,
                    },
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            profile: {
                                select: {
                                    displayName: true,
                                    avatar: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: 100,
            }),
            newNotifications: await prisma_1.prisma.notification.findMany({
                where: {
                    userId,
                    createdAt: {
                        gt: lastSyncDate,
                    },
                },
                orderBy: { createdAt: "desc" },
                take: 50,
            }),
        };
        logger_1.logger.info("Mobile sync completed:", {
            userId,
            syncType,
            lastSync,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, {
            syncTimestamp: syncTimestamp.toISOString(),
            lastSync,
            changes,
            hasChanges: Object.values(changes).some((change) => Array.isArray(change) ? change.length > 0 : !!change),
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to sync mobile data:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to sync mobile data");
    }
});
/**
 * Mobile offline queue processing
 * POST /api/v1/mobile/offline-queue
 */
router.post("/offline-queue", auth_1.requireAuth, (0, validate_1.validateRequest)({ body: offlineQueueSchema.shape.body }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { actions } = req.body;
        const results = [];
        const errors = [];
        // Process each offline action
        for (const action of actions) {
            try {
                let result;
                switch (action.type) {
                    case "like":
                        result = await prisma_1.prisma.like.create({
                            data: {
                                likerId: userId,
                                likedId: action.data.userId,
                                isSuper: action.data.isSuper || false,
                            },
                        });
                        break;
                    case "message": {
                        // Find or create match
                        let match = await prisma_1.prisma.match.findFirst({
                            where: {
                                OR: [
                                    { initiatorId: userId, receiverId: action.data.receiverId },
                                    { initiatorId: action.data.receiverId, receiverId: userId },
                                ],
                            },
                        });
                        if (!match) {
                            match = await prisma_1.prisma.match.create({
                                data: {
                                    initiatorId: userId,
                                    receiverId: action.data.receiverId,
                                },
                            });
                        }
                        result = await prisma_1.prisma.message.create({
                            data: {
                                matchId: match.id,
                                senderId: userId,
                                receiverId: action.data.receiverId,
                                content: action.data.content,
                                messageType: action.data.messageType || "text",
                            },
                        });
                        break;
                    }
                    case "post":
                        result = await prisma_1.prisma.post.create({
                            data: {
                                authorId: userId,
                                content: action.data.content,
                                isPublic: action.data.isPublic !== false,
                            },
                        });
                        break;
                    default:
                        throw new Error(`Unknown action type: ${action.type}`);
                }
                results.push({
                    id: action.id,
                    success: true,
                    result,
                });
            }
            catch (error) {
                logger_1.logger.warn(`Failed to process offline action ${action.id}:`, error);
                errors.push({
                    id: action.id,
                    error: error.message,
                });
            }
        }
        logger_1.logger.info("Offline queue processed:", {
            userId,
            totalActions: actions.length,
            successful: results.length,
            failed: errors.length,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, {
            processed: results.length,
            failed: errors.length,
            results,
            errors,
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to process offline queue:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to process offline queue");
    }
});
/**
 * Mobile app health check
 * GET /api/v1/mobile/health
 */
router.get("/health", async (_req, res) => {
    try {
        // Log health check request
        logger_1.logger.debug(`Health check requested from ${_req.ip} at ${new Date().toISOString()}`);
        // Check database connectivity
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        const health = {
            status: "healthy",
            timestamp: new Date().toISOString(),
            services: {
                database: "healthy",
                api: "healthy",
            },
            version: process.env.APP_VERSION || "1.0.0",
            uptime: process.uptime(),
        };
        return response_1.ResponseHelper.success(res, health);
    }
    catch (error) {
        logger_1.logger.error("Mobile health check failed:", error);
        return response_1.ResponseHelper.serverError(res, "Health check failed");
    }
});
/**
 * Get user's mobile devices
 * GET /api/v1/mobile/devices
 */
router.get("/devices", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const devices = await prisma_1.prisma.device.findMany({
            where: { userId },
            include: {
                deviceTokens: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        platform: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { lastUsedAt: "desc" },
        });
        return response_1.ResponseHelper.success(res, { devices });
    }
    catch (error) {
        logger_1.logger.error("Failed to get user devices:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to get user devices");
    }
});
/**
 * Remove device/push token
 * DELETE /api/v1/mobile/devices/:deviceId
 */
router.delete("/devices/:deviceId", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { deviceId } = req.params;
        // Verify device belongs to user
        const device = await prisma_1.prisma.device.findFirst({
            where: {
                id: deviceId,
                userId,
            },
        });
        if (!device) {
            return response_1.ResponseHelper.notFound(res, "Device");
        }
        // Deactivate device and tokens
        await prisma_1.prisma.device.update({
            where: { id: deviceId },
            data: { isActive: false },
        });
        await prisma_1.prisma.deviceToken.updateMany({
            where: { deviceId },
            data: { isActive: false },
        });
        logger_1.logger.info("Device deactivated:", {
            userId,
            deviceId,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, { deactivated: true });
    }
    catch (error) {
        logger_1.logger.error("Failed to deactivate device:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to deactivate device");
    }
});
exports.default = router;
//# sourceMappingURL=mobile.routes.js.map