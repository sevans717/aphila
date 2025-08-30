import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AnalyticsEvent,
  UserAction,
  ScreenView,
  CustomEvent,
  AnalyticsConfig,
  EventContext,
  DeviceInfo,
} from "../types/analytics";
import { authService } from "./authService";
import { apiClient } from "./apiClient";

/**
 * Analytics Service
 * Handles user analytics, event tracking, and performance monitoring
 */
class AnalyticsService {
  private eventQueue: AnalyticsEvent[] = [];
  private config: AnalyticsConfig = {
    batchSize: 50,
    flushInterval: 30000, // 30 seconds
    enableAutoTracking: true,
    enablePerformanceTracking: true,
    enableErrorTracking: true,
    enableOfflineQueue: true,
    maxQueueSize: 1000,
  };
  private sessionId: string | null = null;
  private userId: string | null = null;
  private sessionStartTime: Date | null = null;
  private flushInterval: NodeJS.Timeout | null = null;
  private currentScreen: string | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize analytics service
   */
  private async initialize(): Promise<void> {
    try {
      // Load stored session data
      await this.loadSession();

      // Start auto-flush if enabled
      if (this.config.enableOfflineQueue) {
        this.startAutoFlush();
      }

      // Set initial user ID from current auth state
      const currentUser = authService.getCurrentUser();
      this.setUserId(currentUser?.id || null);
    } catch (error) {
      console.error("Failed to initialize analytics service:", error);
    }
  }

  /**
   * Set user ID for tracking
   */
  public setUserId(userId: string | null): void {
    this.userId = userId;
  }

  /**
   * Start new session
   */
  public async startSession(): Promise<void> {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.sessionStartTime = new Date();

    await AsyncStorage.setItem("analytics_session_id", this.sessionId);
    await AsyncStorage.setItem(
      "analytics_session_start",
      this.sessionStartTime.toISOString()
    );

    // Track session start
    await this.trackEvent({
      name: "session_started",
      category: "session",
      type: "custom",
      properties: {
        sessionId: this.sessionId,
      },
    });
  }

  /**
   * End current session
   */
  public async endSession(): Promise<void> {
    if (!this.sessionId || !this.sessionStartTime) return;

    const duration = Date.now() - this.sessionStartTime.getTime();

    // Track session end
    await this.trackEvent({
      name: "session_ended",
      category: "session",
      type: "custom",
      properties: {
        sessionId: this.sessionId,
        duration,
      },
    });

    // Flush remaining events
    await this.flush();

    // Clear session data
    this.sessionId = null;
    this.sessionStartTime = null;
    await AsyncStorage.removeItem("analytics_session_id");
    await AsyncStorage.removeItem("analytics_session_start");
  }

  /**
   * Track custom event
   */
  public async trackEvent(event: Partial<AnalyticsEvent>): Promise<void> {
    try {
      const fullEvent: AnalyticsEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: event.name || "unknown",
        category: event.category || "custom",
        type: event.type || "custom",
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId || "",
        userId: this.userId || undefined,
        properties: {
          ...this.getDefaultProperties(),
          ...event.properties,
        },
        context: {
          ...this.getDefaultContext(),
          ...event.context,
        },
        deviceInfo: this.getDeviceInfo(),
      };

      await this.queueEvent(fullEvent);
    } catch (error) {
      console.error("Failed to track event:", error);
    }
  }

  /**
   * Track user action
   */
  public async trackUserAction(action: UserAction): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: action.type,
        category: "user_action",
        type: "custom",
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId || "",
        userId: this.userId || undefined,
        properties: {
          ...this.getDefaultProperties(),
          target: action.target,
          data: action.data,
        },
        context: this.getDefaultContext(),
        deviceInfo: this.getDeviceInfo(),
      };

      await this.queueEvent(event);
    } catch (error) {
      console.error("Failed to track user action:", error);
    }
  }

  /**
   * Track screen view
   */
  public async trackScreenView(screenView: ScreenView): Promise<void> {
    try {
      this.currentScreen = screenView.screenName;

      const event: AnalyticsEvent = {
        id: `screen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: "screen_view",
        category: "navigation",
        type: "screen_view",
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId || "",
        userId: this.userId || undefined,
        properties: {
          ...this.getDefaultProperties(),
          screenName: screenView.screenName,
          route: screenView.route,
          previousScreen: screenView.previousScreen,
          duration: screenView.duration,
        },
        context: this.getDefaultContext(),
        deviceInfo: this.getDeviceInfo(),
      };

      await this.queueEvent(event);
    } catch (error) {
      console.error("Failed to track screen view:", error);
    }
  }

  /**
   * Track performance metric
   */
  public async trackPerformance(metric: {
    name: string;
    value: number;
    unit?: string;
    context?: Record<string, any>;
  }): Promise<void> {
    if (!this.config.enablePerformanceTracking) return;

    try {
      const event: AnalyticsEvent = {
        id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: "performance_metric",
        category: "performance",
        type: "performance",
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId || "",
        userId: this.userId || undefined,
        properties: {
          ...this.getDefaultProperties(),
          metricName: metric.name,
          metricValue: metric.value,
          metricUnit: metric.unit || "",
          currentScreen: this.currentScreen,
        },
        context: {
          ...this.getDefaultContext(),
          ...metric.context,
        },
        deviceInfo: this.getDeviceInfo(),
      };

      await this.queueEvent(event);
    } catch (error) {
      console.error("Failed to track performance metric:", error);
    }
  }

  /**
   * Queue event for batching
   */
  private async queueEvent(event: AnalyticsEvent): Promise<void> {
    this.eventQueue.push(event);

    // Auto-flush if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      await this.flush();
    }
  }

  /**
   * Load session data from storage
   */
  private async loadSession(): Promise<void> {
    try {
      const sessionId = await AsyncStorage.getItem("analytics_session_id");
      const sessionStart = await AsyncStorage.getItem(
        "analytics_session_start"
      );

      if (sessionId && sessionStart) {
        this.sessionId = sessionId;
        this.sessionStartTime = new Date(sessionStart);
      } else {
        await this.startSession();
      }
    } catch (error) {
      console.error("Failed to load session:", error);
      await this.startSession();
    }
  }

  /**
   * Get default properties for events
   */
  private getDefaultProperties(): Record<string, any> {
    return {
      platform: "mobile",
      timestamp: new Date().toISOString(),
      currentScreen: this.currentScreen,
      sessionDuration: this.sessionStartTime
        ? Date.now() - this.sessionStartTime.getTime()
        : null,
    };
  }

  /**
   * Get default context for events
   */
  private getDefaultContext(): EventContext {
    return {
      app: {
        version: "1.0.0",
        build: "1",
        platform: "android",
        environment: "development",
        locale: "en-US",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      screen: {
        name: this.currentScreen || "unknown",
        route: this.currentScreen || "unknown",
        path: this.currentScreen || "unknown",
      },
      user: {
        id: this.userId,
        isAuthenticated: !!this.userId,
      },
      session: {
        id: this.sessionId || "",
        startTime:
          this.sessionStartTime?.toISOString() || new Date().toISOString(),
        duration: this.sessionStartTime
          ? Date.now() - this.sessionStartTime.getTime()
          : 0,
        pageViews: 0,
        isFirstSession: false,
      },
    };
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      id: "device_id",
      type: "mobile",
      os: "unknown",
      osVersion: "unknown",
      manufacturer: "unknown",
      model: "unknown",
      screenResolution: "unknown",
      orientation: "portrait",
      connectionType: "unknown",
      platform: "mobile",
      appVersion: "1.0.0",
      buildNumber: "1",
      language: "en",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    this.flushInterval = setInterval(() => {
      this.flush().catch(console.error);
    }, this.config.flushInterval);
  }

  /**
   * Stop auto-flush timer
   */
  private stopAutoFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Flush events to server
   */
  public async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Send to analytics endpoint
      await apiClient.post("/analytics/events", {
        events: eventsToSend,
        sessionId: this.sessionId,
        userId: this.userId,
      });
    } catch (error) {
      console.error("Failed to flush events:", error);
      // Re-queue events if sending failed
      this.eventQueue.unshift(...eventsToSend);
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart auto-flush with new interval
    if (config.flushInterval) {
      this.stopAutoFlush();
      this.startAutoFlush();
    }
  }

  /**
   * Clear all queued events
   */
  public clearQueue(): void {
    this.eventQueue = [];
  }
}

export const analyticsService = new AnalyticsService();
