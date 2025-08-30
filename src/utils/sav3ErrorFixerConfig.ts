/**
 * SAV3 Project-Specific Error Fixer Configuration
 *
 * This module provides project-specific configuration and integration
 * for the Error-Fixer system, tailored for both desktop and mobile versions.
 */

// Browser global type declarations for Node.js compatibility
declare const window: any;
declare const navigator: any;

export interface SAV3ErrorFixerConfig {
  // Service endpoints
  serviceUrl: string;
  wsUrl: string;

  // Platform-specific settings
  platform: "desktop" | "mobile" | "web";
  environment: "development" | "staging" | "production";

  // Error handling settings
  enabled: boolean;
  captureConsole: boolean;
  captureNetwork: boolean;
  captureUnhandled: boolean;
  captureReact: boolean;

  // Log management
  maxErrors: number;
  logRetentionHours: number;
  autoCleanup: boolean;

  // Immediate handling
  immediateFixes: boolean;
  showNotifications: boolean;
  autoRetry: boolean;

  // Project-specific
  apiBaseUrl: string;
  projectName: string;
  version: string;
}

export class SAV3ErrorFixerConfigManager {
  private static instance: SAV3ErrorFixerConfigManager;
  private config: SAV3ErrorFixerConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): SAV3ErrorFixerConfigManager {
    if (!SAV3ErrorFixerConfigManager.instance) {
      SAV3ErrorFixerConfigManager.instance = new SAV3ErrorFixerConfigManager();
    }
    return SAV3ErrorFixerConfigManager.instance;
  }

  private loadConfig(): SAV3ErrorFixerConfig {
    // Detect platform
    const platform = this.detectPlatform();

    // Get environment
    const environment = this.detectEnvironment();

    // Base configuration
    const baseConfig: SAV3ErrorFixerConfig = {
      serviceUrl: this.getServiceUrl(environment),
      wsUrl: this.getWebSocketUrl(environment),
      platform,
      environment,
      enabled: this.getEnabledState(),
      captureConsole: true,
      captureNetwork: true,
      captureUnhandled: true,
      captureReact: platform !== "web", // React-specific errors for apps
      maxErrors: 200,
      logRetentionHours: 24,
      autoCleanup: true,
      immediateFixes: true,
      showNotifications: true,
      autoRetry: true,
      apiBaseUrl: this.getApiBaseUrl(environment),
      projectName: "SAV3",
      version: process.env.REACT_APP_VERSION || "1.0.0",
    };

    // Platform-specific overrides
    return this.applyPlatformOverrides(baseConfig);
  }

  private detectPlatform(): "desktop" | "mobile" | "web" {
    // Check for Electron (desktop)
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      return "desktop";
    }

    // Check for React Native (mobile)
    if (
      typeof navigator !== "undefined" &&
      navigator.product === "ReactNative"
    ) {
      return "mobile";
    }

    // Default to web
    return "web";
  }

  private detectEnvironment(): "development" | "staging" | "production" {
    const hostname =
      typeof window !== "undefined" ? window.location.hostname : "";

    if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
      return "development";
    }

    if (hostname.includes("staging") || hostname.includes("dev")) {
      return "staging";
    }

    return "production";
  }

  private getServiceUrl(environment: string): string {
    const urls = {
      development: "http://localhost:3002",
      staging: "https://sav3-staging-error-fixer.herokuapp.com",
      production: "https://sav3-error-fixer.herokuapp.com",
    };
    return urls[environment as keyof typeof urls] || urls.development;
  }

  private getWebSocketUrl(environment: string): string {
    const urls = {
      development: "ws://localhost:3003",
      staging: "wss://sav3-staging-error-fixer.herokuapp.com",
      production: "wss://sav3-error-fixer.herokuapp.com",
    };
    return urls[environment as keyof typeof urls] || urls.development;
  }

  private getApiBaseUrl(environment: string): string {
    const urls = {
      development: "http://localhost:10010",
      staging: "https://sav3-staging-api.herokuapp.com",
      production: "https://sav3-api.herokuapp.com",
    };
    return urls[environment as keyof typeof urls] || urls.development;
  }

  private getEnabledState(): boolean {
    // Check environment variables
    if (typeof process !== "undefined" && process.env) {
      if (process.env.REACT_APP_ERROR_FIXER_ENABLED === "false") return false;
      if (process.env.ERROR_FIXER_ENABLED === "false") return false;
    }

    // Check localStorage for user preference
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = window.localStorage.getItem("sav3_error_fixer_enabled");
      if (stored === "false") return false;
    }

    // Default to enabled in development, disabled in production
    return this.detectEnvironment() === "development";
  }

  private applyPlatformOverrides(
    config: SAV3ErrorFixerConfig
  ): SAV3ErrorFixerConfig {
    switch (config.platform) {
      case "desktop":
        return {
          ...config,
          maxErrors: 500, // More errors for desktop
          logRetentionHours: 48, // Longer retention for desktop
          showNotifications: true,
          autoRetry: true,
        };

      case "mobile":
        return {
          ...config,
          maxErrors: 100, // Limited for mobile performance
          logRetentionHours: 12, // Shorter retention for mobile
          showNotifications: false, // Use native notifications
          autoRetry: false, // Let user decide on mobile
        };

      case "web":
      default:
        return {
          ...config,
          maxErrors: 150,
          logRetentionHours: 24,
          showNotifications: true,
          autoRetry: true,
        };
    }
  }

  public getConfig(): SAV3ErrorFixerConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<SAV3ErrorFixerConfig>): void {
    this.config = { ...this.config, ...updates };

    // Save user preferences
    if (typeof window !== "undefined" && window.localStorage) {
      if (updates.enabled !== undefined) {
        window.localStorage.setItem(
          "sav3_error_fixer_enabled",
          updates.enabled.toString()
        );
      }
    }

    // Emit config change event
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("sav3-error-fixer-config-changed", {
          detail: this.config,
        })
      );
    }
  }

  public resetToDefaults(): void {
    this.config = this.loadConfig();
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem("sav3_error_fixer_enabled");
    }
  }

  public getEnvironmentInfo(): {
    platform: string;
    environment: string;
    userAgent: string;
    url: string;
    timestamp: string;
  } {
    return {
      platform: this.config.platform,
      environment: this.config.environment,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
      url: typeof window !== "undefined" ? window.location.href : "Unknown",
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const sav3ErrorFixerConfig = SAV3ErrorFixerConfigManager.getInstance();
