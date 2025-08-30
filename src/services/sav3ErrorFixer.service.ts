/**
 * SAV3 Enhanced Error Fixer Service
 *
 * Enhanced version with automatic log cleanup, immediate error handling,
 * and project-specific integrations for both desktop and mobile versions.
 */

import { EventEmitter } from "events";
import * as WebSocket from "ws";
import * as http from "http";
import express from "express";
import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { ResponseHelper } from "../utils/response";
import {
  sav3ErrorFixerConfig,
  SAV3ErrorFixerConfig,
} from "../utils/sav3ErrorFixerConfig";

export interface SAV3ErrorData {
  id: string;
  type:
    | "javascript"
    | "network"
    | "cors"
    | "auth"
    | "validation"
    | "server"
    | "react";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  stack?: string;
  url?: string;
  statusCode?: number;
  timestamp: Date;
  userAgent?: string;
  source: "console" | "network" | "server" | "react";
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

export interface SAV3QuickFix {
  id: string;
  title: string;
  description: string;
  code?: string;
  file?: string;
  line?: number;
  priority: number;
  category: "immediate" | "configuration" | "template" | "suggestion";
  autoApply?: boolean;
  requiresRestart?: boolean;
}

export interface SAV3ErrorFixerStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  autoFixesApplied: number;
  manualFixesApplied: number;
  averageResolutionTime: number;
  lastCleanup: Date;
  storageUsed: number;
}

export class SAV3ErrorFixerService extends EventEmitter {
  private server!: http.Server;
  private wss: WebSocket.Server;
  private errors: Map<string, SAV3ErrorData> = new Map();
  private sessions: Map<
    string,
    { userId?: string; startTime: Date; errors: string[] }
  > = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private stats: SAV3ErrorFixerStats;
  private config: SAV3ErrorFixerConfig;

  constructor() {
    super();

    this.config = sav3ErrorFixerConfig.getConfig();
    this.stats = this.initializeStats();

    this.initializeServer();
    this.initializeWebSocket();
    this.setupErrorHandlers();
    this.startAutoCleanup();

    logger.info(
      `SAV3 Error-Fixer service initialized for ${this.config.platform} platform`
    );
  }

  private initializeStats(): SAV3ErrorFixerStats {
    return {
      totalErrors: 0,
      errorsByType: {},
      errorsBySeverity: {},
      autoFixesApplied: 0,
      manualFixesApplied: 0,
      averageResolutionTime: 0,
      lastCleanup: new Date(),
      storageUsed: 0,
    };
  }

  private initializeServer(): void {
    const app = express();
    app.use(express.json());

    // CORS for cross-origin requests
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      if (req.method === "OPTIONS") {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Health check endpoint
    app.get("/health", (req: Request, res: Response) => {
      ResponseHelper.success(res, {
        status: "healthy",
        timestamp: new Date().toISOString(),
        platform: this.config.platform,
        environment: this.config.environment,
        activeConnections: this.wss.clients.size,
        totalErrors: this.errors.size,
        stats: this.stats,
      });
    });

    // Get all errors with filtering
    app.get("/errors", (req: Request, res: Response) => {
      const {
        type,
        severity,
        source,
        limit = 50,
        offset = 0,
        sessionId,
        userId,
      } = req.query;

      let filteredErrors = Array.from(this.errors.values());

      if (type) filteredErrors = filteredErrors.filter((e) => e.type === type);
      if (severity)
        filteredErrors = filteredErrors.filter((e) => e.severity === severity);
      if (source)
        filteredErrors = filteredErrors.filter((e) => e.source === source);
      if (sessionId)
        filteredErrors = filteredErrors.filter(
          (e) => e.sessionId === sessionId
        );
      if (userId)
        filteredErrors = filteredErrors.filter((e) => e.userId === userId);

      const paginatedErrors = filteredErrors
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(Number(offset), Number(offset) + Number(limit));

      ResponseHelper.success(res, {
        errors: paginatedErrors,
        total: filteredErrors.length,
        limit: Number(limit),
        offset: Number(offset),
      });
    });

    // Get error by ID
    app.get("/errors/:id", (req: Request, res: Response) => {
      const error = this.errors.get(req.params.id);
      if (!error) {
        return ResponseHelper.notFound(res, "Error not found");
      }
      ResponseHelper.success(res, { error });
    });

    // Get quick fixes for error
    app.get("/errors/:id/fixes", (req: Request, res: Response) => {
      const error = this.errors.get(req.params.id);
      if (!error) {
        return ResponseHelper.notFound(res, "Error not found");
      }

      const fixes = this.generateQuickFixes(error);
      ResponseHelper.success(res, { fixes });
    });

    // Apply a fix
    app.post(
      "/errors/:id/fixes/:fixId/apply",
      async (req: Request, res: Response) => {
        const error = this.errors.get(req.params.id);
        if (!error) {
          return ResponseHelper.notFound(res, "Error not found");
        }

        const fixes = this.generateQuickFixes(error);
        const fix = fixes.find((f) => f.id === req.params.fixId);

        if (!fix) {
          return ResponseHelper.notFound(res, "Fix not found");
        }

        try {
          const result = await this.applyFix(error, fix);
          ResponseHelper.success(res, { result });
        } catch (error) {
          logger.error("Failed to apply fix:", error);
          ResponseHelper.error(res, "Failed to apply fix", "500");
        }
      }
    );

    // Get statistics
    app.get("/stats", (req: Request, res: Response) => {
      ResponseHelper.success(res, { stats: this.stats });
    });

    // Manual cleanup
    app.post("/cleanup", (req: Request, res: Response) => {
      const cleaned = this.performCleanup();
      ResponseHelper.success(res, {
        cleaned,
        timestamp: new Date().toISOString(),
      });
    });

    // Get configuration
    app.get("/config", (req: Request, res: Response) => {
      ResponseHelper.success(res, { config: this.config });
    });

    this.server = http.createServer(app);
    this.server.listen(this.config.serviceUrl.split(":")[2] || 3002, () => {
      logger.info(
        `SAV3 Error-Fixer service listening on ${this.config.serviceUrl}`
      );
    });
  }

  private initializeWebSocket(): void {
    const wsPort = this.config.wsUrl.split(":")[2] || 3003;
    this.wss = new WebSocket.Server({ port: Number(wsPort) });

    this.wss.on("connection", (ws: WebSocket, req) => {
      const sessionId = this.generateSessionId();
      const clientInfo = this.parseClientInfo(req);

      logger.info(
        `New WebSocket connection: ${sessionId} from ${clientInfo.platform}`
      );

      // Create session
      this.sessions.set(sessionId, {
        userId: clientInfo.userId,
        startTime: new Date(),
        errors: [],
      });

      ws.on("message", (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(ws, message, sessionId);
        } catch (error) {
          logger.error("Failed to parse WebSocket message:", error);
        }
      });

      ws.on("close", () => {
        logger.info(`WebSocket connection closed: ${sessionId}`);
        this.sessions.delete(sessionId);
      });

      ws.on("error", (error) => {
        logger.error(`WebSocket error for ${sessionId}:`, error);
      });

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: "welcome",
          sessionId,
          config: this.config,
          timestamp: Date.now(),
        })
      );
    });

    logger.info(`WebSocket server listening on ${this.config.wsUrl}`);
  }

  private parseClientInfo(req: any): { platform: string; userId?: string } {
    const userAgent = req.headers["user-agent"] || "";
    const authHeader = req.headers["authorization"];

    let platform = "web";
    if (userAgent.includes("Electron")) platform = "desktop";
    if (userAgent.includes("ReactNative")) platform = "mobile";

    let userId: string | undefined;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // In a real implementation, you'd decode the JWT to get user ID
      userId = "extracted-from-jwt";
    }

    return { platform, userId };
  }

  private setupErrorHandlers(): void {
    process.on("uncaughtException", (error) => {
      this.handleServerError("uncaughtException", error);
    });

    process.on("unhandledRejection", (reason, _promise) => {
      this.handleServerError("unhandledRejection", reason as Error);
    });
  }

  private handleWebSocketMessage(
    ws: WebSocket,
    message: any,
    sessionId: string
  ): void {
    switch (message.type) {
      case "error":
        this.handleIncomingError(message.data, sessionId);
        break;
      case "ping":
        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        break;
      case "get-fixes": {
        const error = this.errors.get(message.errorId);
        if (error) {
          const fixes = this.generateQuickFixes(error);
          ws.send(
            JSON.stringify({
              type: "fixes",
              errorId: message.errorId,
              fixes,
              timestamp: Date.now(),
            })
          );
        }
        break;
      }
      default:
        logger.warn(`Unknown WebSocket message type: ${message.type}`);
    }
  }

  private handleIncomingError(
    errorData: Partial<SAV3ErrorData>,
    sessionId: string
  ): void {
    const error: SAV3ErrorData = {
      id: this.generateErrorId(),
      type: errorData.type || "javascript",
      severity: errorData.severity || "medium",
      message: errorData.message || "Unknown error",
      stack: errorData.stack,
      url: errorData.url,
      statusCode: errorData.statusCode,
      timestamp: new Date(),
      userAgent: errorData.userAgent,
      source: errorData.source || "console",
      context: errorData.context,
      platform: this.config.platform,
      environment: this.config.environment,
      sessionId,
      userId: errorData.userId,
      autoFixed: false,
    };

    this.errors.set(error.id, error);
    this.updateStats(error);

    // Add to session
    const session = this.sessions.get(sessionId);
    if (session) {
      session.errors.push(error.id);
    }

    // Immediate handling
    this.handleErrorImmediately(error);

    this.emit("error", error);

    logger.info(`Error captured: ${error.type} - ${error.message}`);

    // Generate and send quick fixes
    const fixes = this.generateQuickFixes(error);
    if (fixes.length > 0) {
      this.emit("fixes", { error, fixes });
    }

    // Broadcast to all connected clients
    this.broadcastError(error, fixes);
  }

  private handleErrorImmediately(error: SAV3ErrorData): void {
    // Check for auto-fixable errors
    const fixes = this.generateQuickFixes(error);
    const autoFix = fixes.find(
      (fix) => fix.autoApply && fix.category === "immediate"
    );

    if (autoFix && this.config.immediateFixes) {
      this.applyAutoFix(error, autoFix);
    }

    // Send notification if enabled
    if (this.config.showNotifications && error.severity === "critical") {
      this.sendNotification(error);
    }
  }

  private async applyAutoFix(
    error: SAV3ErrorData,
    fix: SAV3QuickFix
  ): Promise<void> {
    try {
      // In a real implementation, this would apply the fix to the codebase
      logger.info(`Applying auto-fix for error ${error.id}: ${fix.title}`);

      error.autoFixed = true;
      error.fixApplied = fix.id;
      this.stats.autoFixesApplied++;

      this.emit("autoFixApplied", { error, fix });
    } catch (fixError) {
      logger.error(`Failed to apply auto-fix:`, fixError);
    }
  }

  private sendNotification(error: SAV3ErrorData): void {
    // Send notification to connected clients
    const notification = {
      type: "notification",
      title: "Critical Error Detected",
      message: error.message,
      severity: error.severity,
      errorId: error.id,
      timestamp: Date.now(),
    };

    this.broadcast(notification);
  }

  private handleServerError(type: string, error: Error): void {
    const errorData: SAV3ErrorData = {
      id: this.generateErrorId(),
      type: "server",
      severity: "critical",
      message: `${type}: ${error.message}`,
      stack: error.stack,
      timestamp: new Date(),
      source: "server",
      platform: this.config.platform,
      environment: this.config.environment,
      sessionId: "server",
      autoFixed: false,
    };

    this.errors.set(errorData.id, errorData);
    this.updateStats(errorData);

    this.emit("serverError", errorData);

    logger.error(`Server error: ${error.message}`, error);
  }

  private updateStats(error: SAV3ErrorData): void {
    this.stats.totalErrors++;

    if (!this.stats.errorsByType[error.type]) {
      this.stats.errorsByType[error.type] = 0;
    }
    this.stats.errorsByType[error.type]++;

    if (!this.stats.errorsBySeverity[error.severity]) {
      this.stats.errorsBySeverity[error.severity] = 0;
    }
    this.stats.errorsBySeverity[error.severity]++;

    // Update storage used (rough estimate)
    this.stats.storageUsed = JSON.stringify(
      Array.from(this.errors.values())
    ).length;
  }

  private generateErrorId(): string {
    return `sav3_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `sav3_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateQuickFixes(error: SAV3ErrorData): SAV3QuickFix[] {
    const fixes: SAV3QuickFix[] = [];

    switch (error.type) {
      case "javascript":
        fixes.push(...this.generateJavaScriptFixes(error));
        break;
      case "network":
        fixes.push(...this.generateNetworkFixes(error));
        break;
      case "cors":
        fixes.push(...this.generateCORsFixes(error));
        break;
      case "auth":
        fixes.push(...this.generateAuthFixes(error));
        break;
      case "validation":
        fixes.push(...this.generateValidationFixes(error));
        break;
      case "react":
        fixes.push(...this.generateReactFixes(error));
        break;
      case "server":
        fixes.push(...this.generateServerFixes(error));
        break;
    }

    return fixes.sort((a, b) => b.priority - a.priority);
  }

  private generateJavaScriptFixes(error: SAV3ErrorData): SAV3QuickFix[] {
    const fixes: SAV3QuickFix[] = [];

    if (error.message.includes("Cannot read property")) {
      fixes.push({
        id: `fix_${Date.now()}_nullcheck`,
        title: "Add null/undefined check",
        description:
          "Add a null or undefined check before accessing the property",
        code: "if (obj && obj.property) { /* use obj.property */ }",
        priority: 9,
        category: "immediate",
        autoApply: true,
      });
    }

    if (error.message.includes("is not a function")) {
      fixes.push({
        id: `fix_${Date.now()}_typecheck`,
        title: "Add type check",
        description: "Verify the variable is a function before calling it",
        code: "if (typeof func === 'function') { func(); }",
        priority: 8,
        category: "immediate",
        autoApply: true,
      });
    }

    return fixes;
  }

  private generateNetworkFixes(error: SAV3ErrorData): SAV3QuickFix[] {
    const fixes: SAV3QuickFix[] = [];

    if (error.statusCode === 404) {
      fixes.push({
        id: `fix_${Date.now()}_endpoint`,
        title: "Verify API endpoint exists",
        description:
          "Check if the API endpoint is correctly defined and accessible",
        code: `GET ${error.url || "/api/endpoint"}`,
        priority: 9,
        category: "configuration",
      });
    }

    if (error.statusCode === 401) {
      fixes.push({
        id: `fix_${Date.now()}_token_refresh`,
        title: "Refresh authentication token",
        description: "Automatically refresh the expired token",
        priority: 10,
        category: "immediate",
        autoApply: true,
      });
    }

    return fixes;
  }

  private generateCORsFixes(_error: SAV3ErrorData): SAV3QuickFix[] {
    return [
      {
        id: `fix_${Date.now()}_cors`,
        title: "Configure CORS headers",
        description: "Add proper CORS headers to allow cross-origin requests",
        code: `app.use(cors({
  origin: '${this.config.apiBaseUrl}',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));`,
        file: "src/app.ts",
        priority: 10,
        category: "configuration",
      },
    ];
  }

  private generateAuthFixes(error: SAV3ErrorData): SAV3QuickFix[] {
    const fixes: SAV3QuickFix[] = [];

    if (error.statusCode === 401) {
      fixes.push({
        id: `fix_${Date.now()}_authheader`,
        title: "Add authorization header",
        description: "Include proper authorization header in requests",
        code: `headers: {
  'Authorization': 'Bearer ' + token
}`,
        priority: 9,
        category: "immediate",
        autoApply: true,
      });
    }

    return fixes;
  }

  private generateValidationFixes(_error: SAV3ErrorData): SAV3QuickFix[] {
    return [
      {
        id: `fix_${Date.now()}_validation`,
        title: "Add input validation",
        description: "Implement proper input validation using Zod or similar",
        code: `const schema = z.object({
  field: z.string().min(1, 'Field is required')
});

const validated = schema.parse(input);`,
        priority: 8,
        category: "template",
      },
    ];
  }

  private generateReactFixes(error: SAV3ErrorData): SAV3QuickFix[] {
    const fixes: SAV3QuickFix[] = [];

    if (error.context?.component) {
      fixes.push({
        id: `fix_${Date.now()}_error_boundary`,
        title: "Add Error Boundary",
        description: "Wrap component in error boundary to prevent crashes",
        code: `import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong in ${error.context.component}.</div>;
    }
    return this.props.children;
  }
}`,
        priority: 9,
        category: "template",
      });
    }

    return fixes;
  }

  private generateServerFixes(_error: SAV3ErrorData): SAV3QuickFix[] {
    const fixes: SAV3QuickFix[] = [];

    fixes.push({
      id: `fix_${Date.now()}_errorhandling`,
      title: "Add error handling middleware",
      description: "Implement comprehensive error handling in Express",
      code: `app.use((error, req, res, next) => {
  logger.error(error);
  res.status(500).json({ error: 'Internal server error' });
});`,
      file: "src/app.ts",
      priority: 9,
      category: "configuration",
    });

    return fixes;
  }

  private async applyFix(
    error: SAV3ErrorData,
    fix: SAV3QuickFix
  ): Promise<any> {
    // In a real implementation, this would apply the fix to the actual codebase
    logger.info(`Applying fix ${fix.id} for error ${error.id}`);

    error.fixApplied = fix.id;
    this.stats.manualFixesApplied++;

    return { success: true, fix: fix.id };
  }

  private broadcastError(error: SAV3ErrorData, fixes: SAV3QuickFix[]): void {
    const message = JSON.stringify({
      type: "error",
      data: { error, fixes },
      timestamp: Date.now(),
    });

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  private broadcast(message: any): void {
    const data = JSON.stringify(message);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  private startAutoCleanup(): void {
    if (this.config.autoCleanup) {
      this.cleanupTimer = setInterval(
        () => {
          this.performCleanup();
        },
        60 * 60 * 1000
      ); // Run every hour
    }
  }

  private performCleanup(): number {
    const now = new Date();
    const retentionMs = this.config.logRetentionHours * 60 * 60 * 1000;
    let cleaned = 0;

    for (const [id, error] of this.errors) {
      if (now.getTime() - error.timestamp.getTime() > retentionMs) {
        this.errors.delete(id);
        cleaned++;
      }
    }

    // Clean up old sessions
    for (const [sessionId, session] of this.sessions) {
      if (now.getTime() - session.startTime.getTime() > retentionMs) {
        this.sessions.delete(sessionId);
      }
    }

    this.stats.lastCleanup = now;
    logger.info(`Cleaned up ${cleaned} old errors`);

    return cleaned;
  }

  public getErrors(): SAV3ErrorData[] {
    return Array.from(this.errors.values());
  }

  public getError(id: string): SAV3ErrorData | undefined {
    return this.errors.get(id);
  }

  public clearErrors(): void {
    this.errors.clear();
    logger.info("All errors cleared");
  }

  public getStats(): SAV3ErrorFixerStats {
    return { ...this.stats };
  }

  public getSessions(): any[] {
    return Array.from(this.sessions.values());
  }

  public close(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    if (this.wss) {
      this.wss.close();
    }

    if (this.server) {
      this.server.close();
    }

    this.errors.clear();
    this.sessions.clear();

    logger.info("SAV3 Error-Fixer service closed");
  }
}
