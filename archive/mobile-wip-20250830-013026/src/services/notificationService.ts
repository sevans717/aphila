import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  NotificationData,
  PushNotification,
  NotificationPreferences,
  NotificationChannel,
  Notification,
} from "../types/notifications";
import { realtimeService } from "./realtimeService";

/**
 * Notification Service
 * Handles push notifications, in-app notifications, and notification preferences
 */
class NotificationService {
  private notificationQueue: Notification[] = [];
  private preferences: NotificationPreferences = {
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    inAppEnabled: true,
    channels: {},
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00",
    },
    categories: {
      dating: true,
      social: true,
      community: true,
      content: true,
      account: true,
      security: true,
      promotion: false,
      news: true,
    },
  };

  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private notificationHistory: Notification[] = [];

  constructor() {
    this.loadPreferences();
  }

  /**
   * Initialize notification service
   */
  public async initialize(): Promise<void> {
    await this.loadPreferences();
    await this.requestPermissions();
    this.setupEventListeners();
  }

  /**
   * Request notification permissions
   */
  public async requestPermissions(): Promise<boolean> {
    try {
      // This would typically use Expo Notifications
      // For now, return true as placeholder
      return true;
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      return false;
    }
  }

  /**
   * Load notification preferences
   */
  private async loadPreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem("notification_preferences");
      if (stored) {
        this.preferences = { ...this.preferences, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
    }
  }

  /**
   * Save notification preferences
   */
  public async savePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      this.preferences = { ...this.preferences, ...preferences };
      await AsyncStorage.setItem(
        "notification_preferences",
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.error("Error saving notification preferences:", error);
    }
  }

  /**
   * Display notification
   */
  public async displayNotification(notification: Notification): Promise<void> {
    // Check if category is enabled
    if (!this.preferences.categories[notification.category]) {
      return;
    }

    // Show notification
    this.showNotification(notification);

    // Emit to listeners
    this.emitNotification(notification.type, notification);
  }

  /**
   * Show notification
   */
  public async showNotification(notification: Notification): Promise<void> {
    try {
      // Add to queue
      this.notificationQueue.push(notification);

      // Show push notification if enabled
      if (this.preferences.pushEnabled) {
        await this.showPushNotification(notification);
      }

      // Show in-app notification if enabled
      if (this.preferences.inAppEnabled) {
        this.showInAppNotification(notification);
      }

      // Store notification for history
      this.storeNotification(notification);

      // Mark as delivered
      this.markAsDelivered(notification.id);
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }

  /**
   * Show push notification
   */
  private async showPushNotification(
    notification: Notification
  ): Promise<void> {
    try {
      const pushNotification: PushNotification = {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        priority: notification.priority,
      };

      // This would use Expo Notifications API
      console.log("Showing push notification:", pushNotification);
    } catch (error) {
      console.error("Error showing push notification:", error);
    }
  }

  /**
   * Show in-app notification
   */
  private showInAppNotification(notification: Notification): void {
    // This would show an in-app notification component
    this.emitNotification("in_app_notification", notification);
  }

  /**
   * Store notification in local storage
   */
  private async storeNotification(notification: Notification): Promise<void> {
    try {
      const key = `notification_${notification.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(notification));

      // Add to history
      this.notificationHistory.unshift(notification);

      // Keep only last 100 notifications
      if (this.notificationHistory.length > 100) {
        this.notificationHistory = this.notificationHistory.slice(0, 100);
      }
    } catch (error) {
      console.error("Error storing notification:", error);
    }
  }

  /**
   * Check if channel is enabled
   */
  public isChannelEnabled(channel: string): boolean {
    switch (channel) {
      case "push":
        return this.preferences.pushEnabled;
      case "email":
        return this.preferences.emailEnabled;
      case "sms":
        return this.preferences.smsEnabled;
      case "in_app":
        return this.preferences.inAppEnabled;
      default:
        return this.preferences.channels[channel] ?? false;
    }
  }

  /**
   * Get notification priority mapping
   */
  private getNotificationPriority(
    priority: string
  ): "low" | "normal" | "high" | "urgent" {
    switch (priority) {
      case "low":
      case "min":
        return "low";
      case "high":
      case "max":
        return "high";
      case "urgent":
        return "urgent";
      default:
        return "normal";
    }
  }

  /**
   * Add event listener
   */
  public addEventListener(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(
    event: string,
    callback: (data: any) => void
  ): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit notification event
   */
  private emitNotification(event: string, data: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for foreground notifications
    // This would typically use Expo Notifications listeners
    // Listen for background notifications
    // This would handle background notification responses
  }

  /**
   * Mark notification as delivered
   */
  private markAsDelivered(notificationId: string): void {
    const notification = this.notificationHistory.find(
      (n) => n.id === notificationId
    );
    if (notification) {
      notification.status = "delivered";
      notification.sentAt = new Date().toISOString();
    }
  }

  /**
   * Get current preferences
   */
  public getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Test notification
   */
  public async sendTestNotification(): Promise<void> {
    const testNotification: Notification = {
      id: `test_${Date.now()}`,
      userId: "test_user",
      type: "system",
      category: "account",
      title: "Test Notification",
      body: "This is a test notification to verify the system is working.",
      priority: "normal",
      status: "pending",
      channels: ["push", "in_app"],
      actions: [],
      metadata: {
        source: "test",
        version: "1.0.0",
        locale: "en-US",
        timezone: "UTC",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.displayNotification(testNotification);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
