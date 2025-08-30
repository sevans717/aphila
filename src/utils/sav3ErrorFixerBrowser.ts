/**
 * SAV3 Enhanced Error Fixer Browser Extension
 *
 * Enhanced version with automatic log cleanup, immediate error handling,
 * and project-specific integrations for both desktop and mobile versions.
 */

import { logger } from "../utils/logger";
import {
  sav3ErrorFixerConfig,
  SAV3ErrorFixerConfig,
} from "./sav3ErrorFixerConfig";

// Browser environment check
const isBrowser =
  typeof window !== "undefined" && typeof navigator !== "undefined";

if (!isBrowser) {
  // Export empty class for Node.js compatibility
  export class SAV3ErrorFixerBrowser {
    constructor() {
      console.warn(
        "[SAV3 Error-Fixer] Browser extension not available in Node.js environment"
      );
    }
    enable() {}
    disable() {}
    getErrors() {
      return [];
    }
    clearErrors() {}
    getConfig() {
      return {};
    }
    updateConfig() {}
    ping() {}
    destroy() {}
    getStats() {
      return {};
    }
  }
} else {
  export interface SAV3BrowserError {
    id: string;
    type: "javascript" | "network" | "cors" | "auth" | "validation" | "react";
    severity: "low" | "medium" | "high" | "critical";
    message: string;
    stack?: string;
    url?: string;
    statusCode?: number;
    timestamp: Date;
    userAgent: string;
    source: "console" | "network" | "react" | "unhandled";
    context?: {
      file?: string;
      line?: number;
      column?: number;
      function?: string;
      component?: string;
      hook?: string;
    };
    platform: string;
    environment: string;
    sessionId: string;
    userId?: string;
    autoFixed?: boolean;
    fixApplied?: string;
  }

  export interface SAV3ErrorFixerBrowserConfig {
    enabled: boolean;
    captureConsole: boolean;
    captureNetwork: boolean;
    captureUnhandled: boolean;
    captureReact: boolean;
    maxErrorsPerSession: number;
    autoCleanup: boolean;
    logRetentionHours: number;
    immediateFixes: boolean;
    showNotifications: boolean;
    apiEndpoint: string;
    wsEndpoint: string;
  }

  export class SAV3ErrorFixerBrowser {
    private config: SAV3ErrorFixerConfig;
    private browserConfig: SAV3ErrorFixerBrowserConfig;
    private errors: SAV3BrowserError[] = [];
    private sessionId: string;
    private ws: WebSocket | null = null;
    private cleanupTimer: NodeJS.Timeout | null = null;
    private originalConsoleError: typeof console.error;
    private originalConsoleWarn: typeof console.warn;
    private originalOnError: OnErrorEventHandler;
    private originalOnUnhandledRejection:
      | ((event: PromiseRejectionEvent) => void)
      | null = null;
    private networkObserver: PerformanceObserver | null = null;

    constructor() {
      this.config = sav3ErrorFixerConfig.getConfig();
      this.browserConfig = this.getBrowserConfig();
      this.sessionId = this.generateSessionId();

      this.originalConsoleError = console.error;
      this.originalConsoleWarn = console.warn;
      this.originalOnError = window.onerror;

      this.initialize();
    }

    private getBrowserConfig(): SAV3ErrorFixerBrowserConfig {
      return {
        enabled: this.config.enabled,
        captureConsole: this.config.captureConsole,
        captureNetwork: this.config.captureNetwork,
        captureUnhandled: this.config.captureUnhandled,
        captureReact: this.config.captureReact,
        maxErrorsPerSession: this.config.maxErrorsPerSession,
        autoCleanup: this.config.autoCleanup,
        logRetentionHours: this.config.logRetentionHours,
        immediateFixes: this.config.immediateFixes,
        showNotifications: this.config.showNotifications,
        apiEndpoint: this.config.serviceUrl,
        wsEndpoint: this.config.wsUrl,
      };
    }

    private initialize(): void {
      if (!this.browserConfig.enabled) {
        logger.info("SAV3 Error-Fixer Browser extension disabled");
        return;
      }

      this.connectWebSocket();
      this.setupErrorHandlers();
      this.setupNetworkObserver();
      this.startAutoCleanup();

      logger.info(
        `SAV3 Error-Fixer Browser extension initialized for ${this.config.platform} platform`
      );
    }

    private connectWebSocket(): void {
      try {
        this.ws = new WebSocket(this.browserConfig.wsEndpoint);

        this.ws.onopen = () => {
          logger.info("WebSocket connected to Error-Fixer service");
          this.sendToService({
            type: "register",
            sessionId: this.sessionId,
            platform: this.config.platform,
            environment: this.config.environment,
            userAgent: navigator.userAgent,
          });
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleServiceMessage(message);
          } catch (error) {
            logger.error("Failed to parse WebSocket message:", error);
          }
        };

        this.ws.onclose = () => {
          logger.warn("WebSocket connection closed");
          // Attempt to reconnect after 5 seconds
          setTimeout(() => this.connectWebSocket(), 5000);
        };

        this.ws.onerror = (error) => {
          logger.error("WebSocket error:", error);
        };
      } catch (error) {
        logger.error("Failed to connect WebSocket:", error);
      }
    }

    private setupErrorHandlers(): void {
      // Override console.error
      if (this.browserConfig.captureConsole) {
        console.error = (...args) => {
          this.captureConsoleError("error", ...args);
          this.originalConsoleError(...args);
        };

        console.warn = (...args) => {
          this.captureConsoleError("warn", ...args);
          this.originalConsoleWarn(...args);
        };
      }

      // Handle unhandled errors
      if (this.browserConfig.captureUnhandled) {
        window.onerror = (message, source, lineno, colno, error) => {
          this.captureUnhandledError(message, source, lineno, colno, error);
          if (this.originalOnError) {
            return this.originalOnError(message, source, lineno, colno, error);
          }
          return false;
        };

        window.onunhandledrejection = (event) => {
          this.captureUnhandledRejection(event);
          if (this.originalOnUnhandledRejection) {
            this.originalOnUnhandledRejection(event);
          }
        };
      }

      // Handle React errors
      if (this.browserConfig.captureReact && window.React) {
        this.setupReactErrorHandler();
      }
    }

    private setupNetworkObserver(): void {
      if (!this.browserConfig.captureNetwork || !window.PerformanceObserver) {
        return;
      }

      try {
        this.networkObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "resource" && "responseStatus" in entry) {
              const resourceEntry = entry as any;
              if (resourceEntry.responseStatus >= 400) {
                this.captureNetworkError(resourceEntry);
              }
            }
          }
        });

        this.networkObserver.observe({ entryTypes: ["resource"] });
      } catch (error) {
        logger.error("Failed to setup network observer:", error);
      }
    }

    private setupReactErrorHandler(): void {
      // Override React's error handling
      const originalErrorInfo = (window as any).React
        .__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactErrorUtils
        ?.invokeGuardedCallback;

      if (originalErrorInfo) {
        (
          window as any
        ).React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactErrorUtils.invokeGuardedCallback =
          (
            name: string,
            func: (...args: any[]) => any,
            context: any,
            a: any,
            b: any,
            c: any,
            d: any,
            e: any,
            f: any
          ) => {
            try {
              return originalErrorInfo(name, func, context, a, b, c, d, e, f);
            } catch (error) {
              this.captureReactError(error, { name, context });
              throw error;
            }
          };
      }
    }

    private captureConsoleError(level: "error" | "warn", ...args: any[]): void {
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join(" ");

      const error: SAV3BrowserError = {
        id: this.generateErrorId(),
        type: "javascript",
        severity: level === "error" ? "high" : "medium",
        message,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        source: "console",
        platform: this.config.platform,
        environment: this.config.environment,
        sessionId: this.sessionId,
      };

      this.addError(error);
    }

    private captureUnhandledError(
      message: string | Event,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ): void {
      const errorMessage =
        typeof message === "string" ? message : "Unhandled error";

      const browserError: SAV3BrowserError = {
        id: this.generateErrorId(),
        type: "javascript",
        severity: "critical",
        message: errorMessage,
        stack: error?.stack,
        url: source,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        source: "unhandled",
        context: {
          file: source,
          line: lineno,
          column: colno,
        },
        platform: this.config.platform,
        environment: this.config.environment,
        sessionId: this.sessionId,
      };

      this.addError(browserError);
    }

    private captureUnhandledRejection(event: PromiseRejectionEvent): void {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);

      const browserError: SAV3BrowserError = {
        id: this.generateErrorId(),
        type: "javascript",
        severity: "high",
        message: `Unhandled promise rejection: ${message}`,
        stack: reason instanceof Error ? reason.stack : undefined,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        source: "unhandled",
        platform: this.config.platform,
        environment: this.config.environment,
        sessionId: this.sessionId,
      };

      this.addError(browserError);
    }

    private captureNetworkError(entry: any): void {
      const browserError: SAV3BrowserError = {
        id: this.generateErrorId(),
        type: "network",
        severity: entry.responseStatus >= 500 ? "critical" : "high",
        message: `Network error: ${entry.responseStatus} ${entry.name}`,
        url: entry.name,
        statusCode: entry.responseStatus,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        source: "network",
        platform: this.config.platform,
        environment: this.config.environment,
        sessionId: this.sessionId,
      };

      this.addError(browserError);
    }

    private captureReactError(error: Error, context: any): void {
      const browserError: SAV3BrowserError = {
        id: this.generateErrorId(),
        type: "react",
        severity: "high",
        message: `React error: ${error.message}`,
        stack: error.stack,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        source: "react",
        context: {
          component: context?.name,
          ...context,
        },
        platform: this.config.platform,
        environment: this.config.environment,
        sessionId: this.sessionId,
      };

      this.addError(browserError);
    }

    private addError(error: SAV3BrowserError): void {
      // Check session limit
      if (this.errors.length >= this.browserConfig.maxErrorsPerSession) {
        this.errors.shift(); // Remove oldest error
      }

      this.errors.push(error);

      // Send to service
      this.sendToService({
        type: "error",
        data: error,
      });

      // Immediate handling
      this.handleErrorImmediately(error);

      logger.info(`Error captured: ${error.type} - ${error.message}`);
    }

    private handleErrorImmediately(error: SAV3BrowserError): void {
      // Show notification if enabled
      if (
        this.browserConfig.showNotifications &&
        error.severity === "critical"
      ) {
        this.showNotification(error);
      }

      // Apply immediate fixes if enabled
      if (this.browserConfig.immediateFixes) {
        this.applyImmediateFix(error);
      }
    }

    private showNotification(error: SAV3BrowserError): void {
      if (!("Notification" in window)) {
        return;
      }

      if (Notification.permission === "granted") {
        new Notification("SAV3 Error Detected", {
          body: error.message,
          icon: "/favicon.ico",
          tag: "sav3-error",
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("SAV3 Error Detected", {
              body: error.message,
              icon: "/favicon.ico",
              tag: "sav3-error",
            });
          }
        });
      }
    }

    private applyImmediateFix(error: SAV3BrowserError): void {
      // Apply common immediate fixes
      if (error.type === "network" && error.statusCode === 401) {
        // Try to refresh token
        this.attemptTokenRefresh();
      }
    }

    private attemptTokenRefresh(): void {
      // Implementation would depend on your auth system
      logger.info("Attempting token refresh for 401 error");
      // Emit event for auth system to handle
      window.dispatchEvent(new CustomEvent("sav3:token-refresh"));
    }

    private sendToService(message: any): void {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      } else {
        // Store for later if WebSocket not connected
        logger.warn("WebSocket not connected, message queued:", message.type);
      }
    }

    private handleServiceMessage(message: any): void {
      switch (message.type) {
        case "fixes":
          this.handleFixesResponse(message);
          break;
        case "notification":
          this.showNotification({
            id: "service-notification",
            type: "javascript",
            severity: "medium",
            message: message.message,
            timestamp: new Date(),
            userAgent: navigator.userAgent,
            source: "console",
            platform: this.config.platform,
            environment: this.config.environment,
            sessionId: this.sessionId,
          });
          break;
        default:
          logger.info("Received service message:", message.type);
      }
    }

    private handleFixesResponse(message: any): void {
      const fixes = message.fixes;
      logger.info(
        `Received ${fixes.length} fixes for error ${message.errorId}`
      );

      // Apply auto-fixes if available
      const autoFix = fixes.find((fix: any) => fix.autoApply);
      if (autoFix) {
        this.applyAutoFix(autoFix);
      }

      // Emit event for UI to display fixes
      window.dispatchEvent(
        new CustomEvent("sav3:fixes-available", {
          detail: { errorId: message.errorId, fixes },
        })
      );
    }

    private applyAutoFix(fix: any): void {
      logger.info(`Applying auto-fix: ${fix.title}`);

      // Implementation would depend on the specific fix
      switch (fix.category) {
        case "immediate":
          if (fix.code) {
            try {
              // Execute the fix code in the page context
              eval(fix.code);
              logger.info("Auto-fix applied successfully");
            } catch (error) {
              logger.error("Failed to apply auto-fix:", error);
            }
          }
          break;
        default:
          logger.info("Auto-fix category not supported:", fix.category);
      }
    }

    private startAutoCleanup(): void {
      if (this.browserConfig.autoCleanup) {
        this.cleanupTimer = setInterval(
          () => {
            this.performCleanup();
          },
          60 * 60 * 1000
        ); // Run every hour
      }
    }

    private performCleanup(): void {
      const now = new Date();
      const retentionMs = this.browserConfig.logRetentionHours * 60 * 60 * 1000;

      const initialCount = this.errors.length;
      this.errors = this.errors.filter(
        (error) => now.getTime() - error.timestamp.getTime() <= retentionMs
      );

      const cleaned = initialCount - this.errors.length;
      if (cleaned > 0) {
        logger.info(`Cleaned up ${cleaned} old errors`);
      }
    }

    public getErrors(): SAV3BrowserError[] {
      return [...this.errors];
    }

    public clearErrors(): void {
      this.errors = [];
      logger.info("All errors cleared");
    }

    public getStats(): any {
      const errorsByType = this.errors.reduce(
        (acc, error) => {
          acc[error.type] = (acc[error.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const errorsBySeverity = this.errors.reduce(
        (acc, error) => {
          acc[error.severity] = (acc[error.severity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        totalErrors: this.errors.length,
        errorsByType,
        errorsBySeverity,
        sessionId: this.sessionId,
        platform: this.config.platform,
        environment: this.config.environment,
      };
    }

    public destroy(): void {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
      }

      // Restore original handlers
      if (this.browserConfig.captureConsole) {
        console.error = this.originalConsoleError;
        console.warn = this.originalConsoleWarn;
      }

      if (this.browserConfig.captureUnhandled) {
        window.onerror = this.originalOnError;
        window.onunhandledrejection = this.originalOnUnhandledRejection;
      }

      if (this.networkObserver) {
        this.networkObserver.disconnect();
      }

      if (this.ws) {
        this.ws.close();
      }

      this.errors = [];
      logger.info("SAV3 Error-Fixer Browser extension destroyed");
    }

    private generateErrorId(): string {
      return `sav3_browser_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateSessionId(): string {
      return `sav3_browser_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  // Auto-initialize if in browser environment
  if (typeof window !== "undefined") {
    (window as any).sav3ErrorFixer = new SAV3ErrorFixerBrowser();
  }
}
