import { Router } from "express";
import { env } from "../config/env";
import { auth } from "../middleware/auth";
import { logger } from "../utils/logger";

/**
 * Utility function to compare version strings
 */
function compareVersions(version1: string, version2: string): number {
  const v1parts = version1.split(".").map(Number);
  const v2parts = version2.split(".").map(Number);

  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;

    if (v1part < v2part) return -1;
    if (v1part > v2part) return 1;
  }

  return 0;
}

const router = Router();

/**
 * Get feature flags and remote configuration
 * GET /api/v1/config/features
 */
router.get("/features", auth, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Track analytics for feature flag request
    // This could be useful for A/B testing analysis
    logger.info(`Feature flags requested by user ${userId}`);

    const features = {
      pushNotifications: env.enablePushNotifications,
      emailNotifications: env.enableEmailNotifications,
      geospatial: env.enableGeospatial,
      analytics: env.enableAnalytics,

      // Feature flags for React Native
      videoUploads: true,
      multiplePhotos: true,
      premiumFeatures: true,
      socialLogin: true,
      darkMode: true,
      offlineMode: false, // Future feature
      liveVideo: false, // Future feature
      voiceMessages: false, // Future feature

      // Experimental features (could be based on user tier)
      betaFeatures: false,
      advancedFilters: true,
      locationSharing: env.enableGeospatial,
      readReceipts: true,
      typingIndicators: true,
    };

    const config = {
      maxFileSize: env.maxFileSize,
      allowedFileTypes: env.allowedFileTypes,
      nearbyRadius: 50, // Default nearby radius in km

      // App configuration
      minAppVersion: "1.0.0",
      forceUpdate: false,
      maintenanceMode: false,

      // Upload limits
      maxPhotosPerProfile: 6,
      maxVideoLength: 60, // seconds
      maxCommunityMembers: 1000,

      // Rate limits
      messagingRateLimit: 100, // messages per hour
      swipeRateLimit: 100, // swipes per hour

      // UI Configuration
      defaultTheme: "light",
      availableThemes: ["light", "dark", "auto"],

      // Notification settings
      notificationBadgeEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,

      // Discovery settings
      defaultDiscoveryRadius: 25, // km
      maxDiscoveryRadius: 100, // km
      discoveryRefreshInterval: 300, // seconds

      // Matching settings
      dailyLikesLimit: 100,
      superLikesLimit: 5,
      rewindLimit: 3,

      // Premium features config
      premiumFeatures: {
        unlimitedLikes: true,
        passportMode: true,
        superBoost: true,
        readReceipts: true,
        whoLikedYou: true,
        priorityMatching: true,
      },

      // Social features
      communitiesEnabled: true,
      friendsEnabled: true,
      groupChatsEnabled: false, // Future feature

      // Safety features
      photoVerificationEnabled: true,
      reportingEnabled: true,
      blockingEnabled: true,

      // Regional settings
      supportedCountries: ["US", "CA", "GB", "AU", "IN"], // Add more as needed
      defaultCountry: "US",
      distanceUnit: "km", // or 'miles'

      // API configuration
      apiVersion: "1.0",
      apiEndpoint: env.appUrl,
      wsEndpoint: env.appUrl.replace("http", "ws"),

      // Support configuration
      supportEmail: "support@sav3.app",
      helpUrl: "https://help.sav3.app",
      privacyPolicyUrl: "https://sav3.app/privacy",
      termsOfServiceUrl: "https://sav3.app/terms",

      // Debug settings (only in development)
      ...(env.nodeEnv === "development" && {
        debugMode: true,
        mockData: false,
        skipOnboarding: false,
      }),
    };

    res.json({
      features,
      config,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  } catch (error: any) {
    logger.error("Failed to get feature configuration:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to get feature configuration",
    });
  }
});

/**
 * Get app version info and update requirements
 * GET /api/v1/config/version
 */
router.get("/version", async (req, res) => {
  try {
    const platform = req.query.platform as string;
    const currentVersion = req.query.version as string;

    // Version requirements (in production, this would come from a database)
    const versionInfo = {
      latest: {
        ios: "1.2.0",
        android: "1.2.0",
        web: "1.1.0",
      },
      minimum: {
        ios: "1.0.0",
        android: "1.0.0",
        web: "1.0.0",
      },
      releaseNotes: {
        "1.2.0": [
          "New real-time messaging features",
          "Improved geospatial discovery",
          "Enhanced push notifications",
          "Bug fixes and performance improvements",
        ],
        "1.1.0": [
          "Community features",
          "Advanced filtering",
          "Photo verification",
          "Various bug fixes",
        ],
      },
      downloadUrls: {
        ios: "https://apps.apple.com/app/sav3",
        android: "https://play.google.com/store/apps/details?id=com.sav3.app",
        web: env.frontendUrl,
      },
    };

    const latest = platform
      ? versionInfo.latest[platform as keyof typeof versionInfo.latest]
      : null;
    const minimum = platform
      ? versionInfo.minimum[platform as keyof typeof versionInfo.minimum]
      : null;

    const needsUpdate =
      currentVersion && latest
        ? compareVersions(currentVersion, latest) < 0
        : false;

    const forceUpdate =
      currentVersion && minimum
        ? compareVersions(currentVersion, minimum) < 0
        : false;

    res.json({
      ...versionInfo,
      current: currentVersion,
      needsUpdate,
      forceUpdate,
      updateRequired: forceUpdate,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error("Failed to get version info:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to get version info",
    });
  }
});

/**
 * Get server status and health
 * GET /api/v1/config/status
 */
router.get("/status", async (_req, res) => {
  try {
    const status = {
      server: "online",
      database: "connected",
      storage: env.minioBucketName && env.minioEndpoint ? "minio" : "local",
      features: {
        pushNotifications: env.enablePushNotifications ? "enabled" : "disabled",
        geospatial: env.enableGeospatial ? "enabled" : "disabled",
        analytics: env.enableAnalytics ? "enabled" : "disabled",
      },
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: env.nodeEnv,
    };

    res.json(status);
  } catch (error: any) {
    logger.error("Failed to get server status:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to get server status",
    });
  }
});

/**
 * Get maintenance status
 * GET /api/v1/config/maintenance
 */
router.get("/maintenance", async (_req, res) => {
  try {
    // In production, this would check a database or external service
    const maintenanceInfo = {
      isMaintenanceMode: false,
      maintenanceMessage: null,
      estimatedDuration: null,
      maintenanceStart: null,
      maintenanceEnd: null,
      affectedServices: [],
      lastUpdate: new Date().toISOString(),
    };

    res.json(maintenanceInfo);
  } catch (error: any) {
    logger.error("Failed to get maintenance status:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to get maintenance status",
    });
  }
});

export default router;
