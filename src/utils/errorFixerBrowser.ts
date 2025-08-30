// Error Fixer - Browser client
// Lightweight, browser-only implementation for capturing console/network/unhandled errors

const isBrowser =
  typeof window !== "undefined" && typeof navigator !== "undefined";

interface ErrorFixerConfig {
  serviceUrl: string;
  wsUrl: string;
  enabled: boolean;
  captureConsole: boolean;
  captureNetwork: boolean;
  captureUnhandled: boolean;
  maxErrors: number;
  reconnectInterval: number;
}

interface CapturedError {
  id: string;
  type: "javascript" | "network" | "cors" | "resource";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  stack?: string;
  url?: string;
  statusCode?: number;
  timestamp: number;
  userAgent?: string;
  source?: string;
  context?: Record<string, any>;
}

class ErrorFixerExtension {
  private config: ErrorFixerConfig;
  private ws: WebSocket | null = null;
  private errors: CapturedError[] = [];
  private reconnectTimer: number | null = null;
  private originalConsoleError: typeof console.error = console.error;
  private originalConsoleWarn: typeof console.warn = console.warn;
  private originalOnError: any = null;
  private originalOnUnhandledRejection: any = null;

  constructor(config: Partial<ErrorFixerConfig> = {}) {
    this.config = {
      serviceUrl: config.serviceUrl || "http://localhost:3002",
      wsUrl: config.wsUrl || "ws://localhost:3003",
      enabled: config.enabled !== false,
      captureConsole: config.captureConsole !== false,
      captureNetwork: config.captureNetwork !== false,
      captureUnhandled: config.captureUnhandled !== false,
      maxErrors: config.maxErrors || 100,
      reconnectInterval: config.reconnectInterval || 5000,
    };

    if (!isBrowser) {
      // No-op in non-browser contexts
      return;
    }

    this.originalOnError = (window as any).onerror || null;

    if (this.config.enabled) {
      this.initialize();
    }
  }

  private initialize() {
    if (!isBrowser) return;
    try {
      if (this.config.captureConsole) this.setupConsoleCapture();
      if (this.config.captureUnhandled) this.setupUnhandledCapture();
      if (this.config.captureNetwork) this.setupNetworkCapture();
      this.connectWebSocket();
      (window as any).errorFixerExtension = this;
      console.log("[Error-Fixer] initialized");
    } catch {
      console.warn("[Error-Fixer] init failed");
    }
  }

  private connectWebSocket() {
    if (!isBrowser) return;
    try {
      this.ws = new WebSocket(this.config.wsUrl);
      this.ws.onopen = () => {
        this.clearReconnectTimer();
      };
      this.ws.onmessage = (ev: MessageEvent) => {
        try {
          const msg = JSON.parse(String(ev.data));
          this.handleWebSocketMessage(msg);
        } catch {
          // ignore
        }
      };
      this.ws.onclose = () => this.scheduleReconnect();
      this.ws.onerror = () => this.scheduleReconnect();
    } catch {
      console.warn("[Error-Fixer] init failed");
    }
  }

  private scheduleReconnect() {
    if (!isBrowser) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = window.setTimeout(
      () => this.connectWebSocket(),
      this.config.reconnectInterval
    );
  }

  private clearReconnectTimer() {
    if (!isBrowser) return;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setupConsoleCapture() {
    console.error = (...args: any[]) => {
      try {
        const err = this.createErrorFromArgs(
          "javascript",
          "high",
          args,
          "console"
        );
        this.captureError(err);
      } catch {
        // swallow
      }
      this.originalConsoleError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      try {
        const err = this.createErrorFromArgs(
          "javascript",
          "medium",
          args,
          "console"
        );
        this.captureError(err);
      } catch {
        // swallow
      }
      this.originalConsoleWarn.apply(console, args);
    };
  }

  private setupUnhandledCapture() {
    (window as any).onerror = (
      message: any,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ) => {
      try {
        const captured: CapturedError = {
          id: this.generateErrorId(),
          type: "javascript",
          severity: "critical",
          message: String(message),
          stack: error?.stack,
          url: source,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          source: "unhandled",
          context: {
            file: source,
            line: lineno,
            column: colno,
            fn: error?.name,
          },
        };
        this.captureError(captured);
      } catch {
        // swallow
      }

      if (this.originalOnError) {
        try {
          return (this.originalOnError as any).call(
            window,
            message,
            source,
            lineno,
            colno,
            error
          );
        } catch {
          // swallow
        }
      }
      return false;
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      try {
        const captured: CapturedError = {
          id: this.generateErrorId(),
          type: "javascript",
          severity: "high",
          message: `Unhandled promise rejection: ${event.reason}`,
          stack: (event.reason && (event.reason as any).stack) || undefined,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          source: "unhandled",
        };
        this.captureError(captured);
      } catch {
        // swallow
      }
    };

    window.addEventListener("unhandledrejection", rejectionHandler);
    this.originalOnUnhandledRejection = rejectionHandler;
  }

  private setupNetworkCapture() {
    if (!isBrowser) return;
    try {
      const originalOpen = XMLHttpRequest.prototype.open;
      const originalSend = XMLHttpRequest.prototype.send;

      XMLHttpRequest.prototype.open = function (
        method: string,
        url: any,
        async = true,
        user?: string | null,
        pass?: string | null
      ) {
        try {
          (this as any)._errorFixerUrl = url?.toString?.() ?? String(url);
        } catch {
          (this as any)._errorFixerUrl = String(url);
        }
        (this as any)._errorFixerMethod = method;
        const asyncFlag = typeof async === "boolean" ? async : Boolean(async);
        return originalOpen.call(this, method, url, asyncFlag, user, pass);
      };

      XMLHttpRequest.prototype.send = function (body?: any) {
        const url = (this as any)._errorFixerUrl;
        const _method = (this as any)._errorFixerMethod;
        const errorFixerInstance: any = (window as any).errorFixerExtension;

        const originalOnLoad = this.onload;
        const originalOnError = this.onerror;

        this.onload = function (ev: ProgressEvent<EventTarget>) {
          try {
            if (this.status >= 400 && errorFixerInstance) {
              const error: CapturedError = {
                id: errorFixerInstance.generateErrorId(),
                type: "network",
                severity: this.status >= 500 ? "high" : "medium",
                message: `HTTP ${this.status}: ${this.statusText} (${_method} ${url})`,
                url,
                statusCode: this.status,
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                source: "network",
              };
              errorFixerInstance.captureError(error);
            }
          } catch {
            // swallow
          }
          if (originalOnLoad) originalOnLoad.call(this, ev);
        };

        this.onerror = function (ev: ProgressEvent<EventTarget>) {
          try {
            if (errorFixerInstance) {
              const error: CapturedError = {
                id: errorFixerInstance.generateErrorId(),
                type: "network",
                severity: "high",
                message: "Network request failed",
                url,
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                source: "network",
              };
              errorFixerInstance.captureError(error);
            }
          } catch {
            // swallow
          }
          if (originalOnError) originalOnError.call(this, ev);
        };

        return originalSend.call(this, body);
      };

      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        try {
          const response = await originalFetch(input as any, init as any);
          if (!response.ok) {
            const url =
              typeof input === "string"
                ? input
                : input instanceof URL
                  ? input.href
                  : (input as Request).url;
            const error: CapturedError = {
              id: this.generateErrorId(),
              type: "network",
              severity: response.status >= 500 ? "high" : "medium",
              message: `HTTP ${response.status}: ${response.statusText}`,
              url,
              statusCode: response.status,
              timestamp: Date.now(),
              userAgent: navigator.userAgent,
              source: "network",
            };
            this.captureError(error);
          }
          return response;
        } catch (fetchErr) {
          const url =
            typeof input === "string"
              ? input
              : input instanceof URL
                ? input.href
                : (input as Request).url;
          const networkError: CapturedError = {
            id: this.generateErrorId(),
            type: "network",
            severity: "high",
            message: `Network request failed: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`,
            url,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            source: "network",
          };
          this.captureError(networkError);
          throw fetchErr;
        }
      };
    } catch {
      console.warn("[Error-Fixer] init failed");
    }
  }

  private createErrorFromArgs(
    type: CapturedError["type"],
    severity: CapturedError["severity"],
    args: any[],
    source?: string
  ): CapturedError {
    const message = args
      .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
      .join(" ");
    return {
      id: this.generateErrorId(),
      type,
      severity,
      message,
      timestamp: Date.now(),
      userAgent: isBrowser ? navigator.userAgent : undefined,
      source,
    };
  }

  private captureError(error: CapturedError) {
    try {
      this.errors.push(error);
      if (this.errors.length > this.config.maxErrors)
        this.errors = this.errors.slice(-this.config.maxErrors);
      this.sendErrorToService(error);
      this.sendErrorViaHttp(error).catch(() => {});
    } catch {
      // swallow
    }
  }

  private sendErrorToService(error: CapturedError) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(
          JSON.stringify({ type: "error", data: error, timestamp: Date.now() })
        );
      } catch {
        // swallow
      }
    }
  }

  private async sendErrorViaHttp(error: CapturedError): Promise<void> {
    if (!isBrowser) return;
    try {
      await fetch(`${this.config.serviceUrl}/errors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(error),
      });
    } catch {
      // swallow
    }
  }

  private handleWebSocketMessage(_message: any) {
    // noop for now
  }

  private generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  // Public API
  public enable() {
    this.config.enabled = true;
  }
  public disable() {
    this.config.enabled = false;
  }
  public getErrors() {
    return [...this.errors];
  }
  public clearErrors() {
    this.errors = [];
  }
  public getConfig() {
    return { ...this.config };
  }
  public updateConfig(cfg: Partial<ErrorFixerConfig>) {
    this.config = { ...this.config, ...cfg };
  }
  public ping() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN)
      this.ws.send(JSON.stringify({ type: "ping", timestamp: Date.now() }));
  }
  public destroy() {
    if (!isBrowser) return;
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
    (window as any).onerror = this.originalOnError;
    if (this.originalOnUnhandledRejection)
      window.removeEventListener(
        "unhandledrejection",
        this.originalOnUnhandledRejection
      );
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* swallow */
      }
      this.ws = null;
    }
    this.clearReconnectTimer();
    this.errors = [];
  }
}

if (isBrowser && !(window as any).errorFixerExtension) {
  const cfg = {
    serviceUrl:
      (window as any).ERROR_FIXER_SERVICE_URL || "http://localhost:3002",
    wsUrl: (window as any).ERROR_FIXER_WS_URL || "ws://localhost:3003",
    enabled: (window as any).ERROR_FIXER_ENABLED !== false,
  };
  (window as any).errorFixerExtension = new ErrorFixerExtension(cfg as any);
}

export { ErrorFixerExtension };
