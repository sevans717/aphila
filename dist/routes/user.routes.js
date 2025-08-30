"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const user_service_1 = require("../services/user.service");
const user_schema_1 = require("../schemas/user.schema");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// Temporary profile creation endpoint for testing
router.post("/create-profile", auth_1.requireAuth, async (req, res) => {
    try {
        const authReq = req;
        const { displayName, bio, birthdate: _birthdate, gender: _gender, orientation: _orientation, location, latitude, longitude, } = req.body;
        const userId = authReq.user.userId;
        const profile = await (0, user_service_1.updateUserProfile)(userId, {
            displayName: displayName || "Test User",
            bio: bio || "Just testing the app",
            location: location || "Test City",
            latitude: latitude || 40.7128,
            longitude: longitude || -74.006,
        });
        res.json({
            success: true,
            data: profile,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Get current user profile
router.get("/profile", auth_1.requireAuth, async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.user.userId;
        // Get user with profile
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                photos: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
            });
        }
        res.json({
            success: true,
            data: {
                userId: user.id,
                email: user.email,
                profile: user.profile
                    ? {
                        displayName: user.profile.displayName,
                        bio: user.profile.bio,
                        location: user.profile.location,
                        latitude: user.profile.latitude,
                        longitude: user.profile.longitude,
                        birthdate: user.profile.birthdate,
                        gender: user.profile.gender,
                        orientation: user.profile.orientation,
                        createdAt: user.profile.createdAt,
                        updatedAt: user.profile.updatedAt,
                    }
                    : null,
                photos: user.photos.map((photo) => ({
                    id: photo.id,
                    url: photo.url,
                    isPrimary: photo.isPrimary,
                    createdAt: photo.createdAt,
                })),
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Update user profile
router.put("/profile", auth_1.requireAuth, (0, validate_1.validateRequest)({ body: user_schema_1.updateProfileSchema }), async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.user.userId;
        const updateData = req.body;
        const profile = await (0, user_service_1.updateUserProfile)(userId, updateData);
        res.json({
            success: true,
            data: {
                userId,
                profile: {
                    displayName: profile.displayName,
                    bio: profile.bio,
                    location: profile.location,
                    latitude: profile.latitude,
                    longitude: profile.longitude,
                    birthdate: profile.birthdate,
                    gender: profile.gender,
                    orientation: profile.orientation,
                    updatedAt: profile.updatedAt,
                },
                message: "Profile updated successfully",
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Get user settings
router.get("/settings", auth_1.requireAuth, async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.user.userId;
        // Get user settings from database
        const settings = await prisma_1.prisma.userSetting.findUnique({
            where: { userId },
        });
        // If no settings exist, return defaults
        const userSettings = settings || {
            darkMode: false,
            showOnlineStatus: true,
            hudCompact: false,
            enableSounds: true,
            notificationPreferences: null,
        };
        res.json({
            success: true,
            data: {
                userId,
                settings: userSettings,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Update user settings
router.put("/settings", auth_1.requireAuth, async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.user.userId;
        const { darkMode, showOnlineStatus, hudCompact, enableSounds, notificationPreferences, } = req.body;
        // Update or create settings
        const settings = await prisma_1.prisma.userSetting.upsert({
            where: { userId },
            update: {
                darkMode: darkMode ?? false,
                showOnlineStatus: showOnlineStatus ?? true,
                hudCompact: hudCompact ?? false,
                enableSounds: enableSounds ?? true,
                notificationPreferences: notificationPreferences || null,
            },
            create: {
                userId,
                darkMode: darkMode ?? false,
                showOnlineStatus: showOnlineStatus ?? true,
                hudCompact: hudCompact ?? false,
                enableSounds: enableSounds ?? true,
                notificationPreferences: notificationPreferences || null,
            },
        });
        res.json({
            success: true,
            data: {
                userId,
                settings: {
                    darkMode: settings.darkMode,
                    showOnlineStatus: settings.showOnlineStatus,
                    hudCompact: settings.hudCompact,
                    enableSounds: settings.enableSounds,
                    notificationPreferences: settings.notificationPreferences,
                    updatedAt: settings.updatedAt,
                },
                message: "Settings updated successfully",
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Get user preferences (using privacy settings for now)
router.get("/preferences", auth_1.requireAuth, async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.user.userId;
        // Get user privacy settings from database
        const privacySettings = await prisma_1.prisma.privacySetting.findUnique({
            where: { userId },
        });
        // If no privacy settings exist, return defaults
        const userPreferences = privacySettings || {
            showAge: true,
            showDistance: true,
            searchable: true,
            allowMessagesFrom: "matches",
        };
        res.json({
            success: true,
            data: {
                userId,
                preferences: userPreferences,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Update user preferences (using privacy settings for now)
router.put("/preferences", auth_1.requireAuth, async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.user.userId;
        const { showAge, showDistance, searchable, allowMessagesFrom } = req.body;
        // Update or create privacy settings
        const preferences = await prisma_1.prisma.privacySetting.upsert({
            where: { userId },
            update: {
                showAge: showAge ?? true,
                showDistance: showDistance ?? true,
                searchable: searchable ?? true,
                allowMessagesFrom: allowMessagesFrom || "matches",
            },
            create: {
                userId,
                showAge: showAge ?? true,
                showDistance: showDistance ?? true,
                searchable: searchable ?? true,
                allowMessagesFrom: allowMessagesFrom || "matches",
            },
        });
        res.json({
            success: true,
            data: {
                userId,
                preferences: {
                    showAge: preferences.showAge,
                    showDistance: preferences.showDistance,
                    searchable: preferences.searchable,
                    allowMessagesFrom: preferences.allowMessagesFrom,
                    updatedAt: preferences.updatedAt,
                },
                message: "Preferences updated successfully",
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=user.routes.js.map