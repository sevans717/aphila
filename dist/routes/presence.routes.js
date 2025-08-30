"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Validation schemas
const updatePresenceSchema = zod_1.z.object({
    status: zod_1.z.enum(["ONLINE", "AWAY", "OFFLINE"]),
    deviceId: zod_1.z.string().optional(),
});
const updateActivitySchema = zod_1.z.object({
    type: zod_1.z.enum([
        "TYPING",
        "VIEWING_PROFILE",
        "VIEWING_MATCH",
        "VIEWING_MESSAGE",
        "VIEWING_POST",
        "VIEWING_STORY",
        "SEARCHING",
        "EDITING_PROFILE",
        "UPLOADING_MEDIA",
    ]),
    targetId: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
// Get user's presence status
router.get("/me", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const presence = await prisma.presence.findUnique({
            where: { userId },
            include: {
                activities: {
                    where: { endedAt: null },
                    orderBy: { startedAt: "desc" },
                    take: 1,
                },
            },
        });
        if (!presence) {
            return res.json({
                status: "OFFLINE",
                lastSeen: new Date(),
                isActive: false,
                currentActivity: null,
            });
        }
        res.json({
            status: presence.status,
            lastSeen: presence.lastSeen,
            lastActivity: presence.lastActivity,
            isActive: presence.isActive,
            deviceId: presence.deviceId,
            currentActivity: presence.activities[0] || null,
        });
    }
    catch (error) {
        console.error("Error fetching presence:", error);
        res.status(500).json({ error: "Failed to fetch presence status" });
    }
});
// Update user's presence status
router.put("/me", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, deviceId } = updatePresenceSchema.parse(req.body);
        const presence = await prisma.presence.upsert({
            where: { userId },
            update: {
                status,
                deviceId,
                lastActivity: new Date(),
                isActive: status === "ONLINE",
                updatedAt: new Date(),
            },
            create: {
                userId,
                status,
                deviceId,
                isActive: status === "ONLINE",
            },
        });
        // Emit presence update via WebSocket (will be handled by socket service)
        req.app.locals.io?.emit(`presence:${userId}`, {
            userId,
            status: presence.status,
            lastActivity: presence.lastActivity,
            isActive: presence.isActive,
        });
        res.json({
            status: presence.status,
            lastSeen: presence.lastSeen,
            lastActivity: presence.lastActivity,
            isActive: presence.isActive,
            deviceId: presence.deviceId,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res
                .status(400)
                .json({ error: "Invalid input", details: error.issues });
        }
        console.error("Error updating presence:", error);
        res.status(500).json({ error: "Failed to update presence status" });
    }
});
// Start user activity
router.post("/activity", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, targetId, metadata } = updateActivitySchema.parse(req.body);
        // First, end any existing activities for this user
        await prisma.userActivity.updateMany({
            where: {
                presence: { userId },
                endedAt: null,
            },
            data: { endedAt: new Date() },
        });
        // Get or create presence record
        const presence = await prisma.presence.upsert({
            where: { userId },
            update: {
                lastActivity: new Date(),
                updatedAt: new Date(),
            },
            create: {
                userId,
                status: "ONLINE",
                isActive: true,
            },
        });
        // Create new activity
        const activity = await prisma.userActivity.create({
            data: {
                presenceId: presence.id,
                type,
                targetId,
                metadata: metadata,
            },
        });
        // Emit activity update via WebSocket
        req.app.locals.io?.emit(`activity:${userId}`, {
            userId,
            activity: {
                type: activity.type,
                targetId: activity.targetId,
                metadata: activity.metadata,
                startedAt: activity.startedAt,
            },
        });
        res.json({
            id: activity.id,
            type: activity.type,
            targetId: activity.targetId,
            metadata: activity.metadata,
            startedAt: activity.startedAt,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res
                .status(400)
                .json({ error: "Invalid input", details: error.issues });
        }
        console.error("Error starting activity:", error);
        res.status(500).json({ error: "Failed to start activity" });
    }
});
// End current activity
router.delete("/activity", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const updatedActivities = await prisma.userActivity.updateMany({
            where: {
                presence: { userId },
                endedAt: null,
            },
            data: { endedAt: new Date() },
        });
        // Emit activity end via WebSocket
        req.app.locals.io?.emit(`activity:${userId}`, {
            userId,
            activity: null,
        });
        res.json({ message: "Activity ended", updated: updatedActivities.count });
    }
    catch (error) {
        console.error("Error ending activity:", error);
        res.status(500).json({ error: "Failed to end activity" });
    }
});
// Get presence status of multiple users (for friends/matches)
router.post("/bulk", auth_1.requireAuth, async (req, res) => {
    try {
        const { userIds } = zod_1.z
            .object({
            userIds: zod_1.z.array(zod_1.z.string()).max(50), // Limit to 50 users at once
        })
            .parse(req.body);
        const presences = await prisma.presence.findMany({
            where: {
                userId: { in: userIds },
                isActive: true,
            },
            include: {
                activities: {
                    where: { endedAt: null },
                    orderBy: { startedAt: "desc" },
                    take: 1,
                },
            },
        });
        const presenceMap = presences.reduce((acc, presence) => {
            acc[presence.userId] = {
                status: presence.status,
                lastSeen: presence.lastSeen,
                lastActivity: presence.lastActivity,
                isActive: presence.isActive,
                currentActivity: presence.activities[0] || null,
            };
            return acc;
        }, {});
        // Fill in offline users
        userIds.forEach((userId) => {
            if (!presenceMap[userId]) {
                presenceMap[userId] = {
                    status: "OFFLINE",
                    lastSeen: new Date(),
                    isActive: false,
                    currentActivity: null,
                };
            }
        });
        res.json(presenceMap);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res
                .status(400)
                .json({ error: "Invalid input", details: error.issues });
        }
        console.error("Error fetching bulk presence:", error);
        res.status(500).json({ error: "Failed to fetch presence data" });
    }
});
// Get online users count (for stats)
router.get("/online-count", async (req, res) => {
    try {
        logger_1.logger.debug(`Online count requested from ${req.ip} at ${new Date().toISOString()}`);
        const onlineCount = await prisma.presence.count({
            where: {
                status: "ONLINE",
                isActive: true,
            },
        });
        res.json({ onlineCount });
    }
    catch (error) {
        console.error("Error fetching online count:", error);
        res.status(500).json({ error: "Failed to fetch online count" });
    }
});
exports.default = router;
//# sourceMappingURL=presence.routes.js.map