import { EventEmitter } from "events";
import * as WebSocket from "ws";
import * as http from "http";
import express from "express";
import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { ResponseHelper } from "../utils/response";

export interface ErrorData {
  id: string;
  type: "javascript" | "network" | "cors" | "auth" | "validation" | "server";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  stack?: string;
  url?: string;
  statusCode?: number;
  timestamp: Date;
  userAgent?: string;
  source: "console" | "network" | "server";
  context?: {
    file?: string;
    line?: number;
    column?: number;
    function?: string;
  };
}

export interface QuickFix {
  id: string;
  title: string;
  description: string;
  code?: string;
  file?: string;
  line?: number;
  priority: number;
  category: "immediate" | "configuration" | "template" | "suggestion";
}

export interface ErrorFixerConfig {
  port: number;
  wsPort: number;
  maxTerminals: number;
  autoFix: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
}

export class ErrorFixerService extends EventEmitter {
  private server!: http.Server;
  private wss: WebSocket.Server;
  private terminals: Map<string, any> = new Map();
  private errors: Map<string, ErrorData> = new Map();
  private config: ErrorFixerConfig;

  constructor(config: Partial<ErrorFixerConfig> = {}) {
    super();

    this.config = {
      port: config.port || 3002,
      wsPort: config.wsPort || 3003,
      maxTerminals: config.maxTerminals || 3,
      autoFix: config.autoFix || false,
      logLevel: config.logLevel || "info",
    };

    this.initializeServer();
    this.initializeWebSocket();
    this.setupErrorHandlers();
  }

  private initializeServer(): void {
    const app = express();
    app.use(express.json());

    // Health check endpoint
    app.get("/health", (req: Request, res: Response) => {
      ResponseHelper.success(res, {
        status: "healthy",
        timestamp: new Date().toISOString(),
        activeTerminals: this.terminals.size,
        totalErrors: this.errors.size,
      });
    });

    // Get all errors
    app.get("/errors", (req: Request, res: Response) => {
      const errors = Array.from(this.errors.values());
      ResponseHelper.success(res, { errors });
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

    // Create background terminal
    app.post("/terminals", async (req: Request, res: Response) => {
      try {
        const terminal = await this.createBackgroundTerminal();
        ResponseHelper.success(res, {
          id: terminal.id,
          name: terminal.name,
          status: "created",
        });
      } catch (error) {
        logger.error("Failed to create terminal:", error);
        ResponseHelper.error(res, "Failed to create terminal", "500");
      }
    });

    // Execute command in terminal
    app.post("/terminals/:id/execute", async (req: Request, res: Response) => {
      const { command } = req.body;
      const terminal = this.terminals.get(req.params.id);

      if (!terminal) {
        return ResponseHelper.notFound(res, "Terminal not found");
      }

      try {
        const result = await this.executeInTerminal(terminal, command);
        ResponseHelper.success(res, { result });
      } catch (error) {
        logger.error("Command execution failed:", error);
        ResponseHelper.error(res, "Command execution failed", "500");
      }
    });

    this.server = http.createServer(app);
    this.server.listen(this.config.port, () => {
      logger.info(`Error-Fixer service listening on port ${this.config.port}`);
    });
  }

  private initializeWebSocket(): void {
    this.wss = new WebSocket.Server({ port: this.config.wsPort });

    this.wss.on("connection", (ws: WebSocket) => {
      logger.info("New WebSocket connection established");

      ws.on("message", (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(ws, message);
        } catch (error) {
          logger.error("Failed to parse WebSocket message:", error);
        }
      });

      ws.on("close", () => {
        logger.info("WebSocket connection closed");
      });

      ws.on("error", (error) => {
        logger.error("WebSocket error:", error);
      });
    });

    logger.info(`WebSocket server listening on port ${this.config.wsPort}`);
  }

  private setupErrorHandlers(): void {
    process.on("uncaughtException", (error) => {
      this.handleServerError("uncaughtException", error);
    });

    process.on("unhandledRejection", (reason, _promise) => {
      this.handleServerError("unhandledRejection", reason as Error);
    });
  }

  private handleWebSocketMessage(ws: WebSocket, message: any): void {
    switch (message.type) {
      case "error":
        this.handleIncomingError(message.data);
        break;
      case "ping":
        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        break;
      default:
        logger.warn("Unknown WebSocket message type:", message.type);
    }
  }

  private handleIncomingError(errorData: Partial<ErrorData>): void {
    const error: ErrorData = {
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
    };

    this.errors.set(error.id, error);
    this.emit("error", error);

    logger.info(`Error captured: ${error.type} - ${error.message}`);

    // Generate quick fixes
    const fixes = this.generateQuickFixes(error);
    if (fixes.length > 0) {
      this.emit("fixes", { error, fixes });
    }

    // Broadcast to all connected clients
    this.broadcastError(error, fixes);
  }

  private handleServerError(type: string, error: Error): void {
    const errorData: ErrorData = {
      id: this.generateErrorId(),
      type: "server",
      severity: "critical",
      message: `${type}: ${error.message}`,
      stack: error.stack,
      timestamp: new Date(),
      source: "server",
    };

    this.errors.set(errorData.id, errorData);
    this.emit("serverError", errorData);

    logger.error(`Server error: ${error.message}`, error);
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateQuickFixes(error: ErrorData): QuickFix[] {
    const fixes: QuickFix[] = [];

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
      case "server":
        fixes.push(...this.generateServerFixes(error));
        break;
    }

    return fixes.sort((a, b) => b.priority - a.priority);
  }

  private generateJavaScriptFixes(error: ErrorData): QuickFix[] {
    const fixes: QuickFix[] = [];

    if (error.message.includes("Cannot read property")) {
      fixes.push({
        id: `fix_${Date.now()}_nullcheck`,
        title: "Add null/undefined check",
        description:
          "Add a null or undefined check before accessing the property",
        code: "if (obj && obj.property) { /* use obj.property */ }",
        priority: 9,
        category: "immediate",
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
      });
    }

    if (error.message.includes("Cannot set property")) {
      fixes.push({
        id: `fix_${Date.now()}_objectinit`,
        title: "Initialize object properly",
        description:
          "Ensure the object is properly initialized before setting properties",
        code: "const obj = obj || {}; obj.property = value;",
        priority: 7,
        category: "immediate",
      });
    }

    return fixes;
  }

  private generateNetworkFixes(error: ErrorData): QuickFix[] {
    const fixes: QuickFix[] = [];

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

    if (error.statusCode === 500) {
      fixes.push({
        id: `fix_${Date.now()}_serverlogs`,
        title: "Check server logs",
        description: "Examine server logs for detailed error information",
        code: "tail -f /var/log/application.log",
        priority: 8,
        category: "suggestion",
      });
    }

    if (error.statusCode === 429) {
      fixes.push({
        id: `fix_${Date.now()}_ratelimit`,
        title: "Implement rate limiting",
        description: "Add rate limiting to prevent excessive requests",
        code: "app.use(rateLimit({ windowMs: 60000, max: 100 }));",
        file: "src/app.ts",
        priority: 7,
        category: "configuration",
      });
    }

    return fixes;
  }

  private generateCORsFixes(_error: ErrorData): QuickFix[] {
    return [
      {
        id: `fix_${Date.now()}_cors`,
        title: "Configure CORS headers",
        description: "Add proper CORS headers to allow cross-origin requests",
        code: `app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

  private generateAuthFixes(error: ErrorData): QuickFix[] {
    const fixes: QuickFix[] = [];

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
      });
    }

    if (error.statusCode === 403) {
      fixes.push({
        id: `fix_${Date.now()}_permissions`,
        title: "Check user permissions",
        description: "Verify user has required permissions for this action",
        code: `if (!user.permissions.includes('required_permission')) {
  throw new Error('Insufficient permissions');
}`,
        priority: 8,
        category: "immediate",
      });
    }

    return fixes;
  }

  private generateValidationFixes(_error: ErrorData): QuickFix[] {
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

  private generateServerFixes(_error: ErrorData): QuickFix[] {
    const fixes: QuickFix[] = [];

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

    fixes.push({
      id: `fix_${Date.now()}_healthcheck`,
      title: "Add health check endpoint",
      description: "Implement health check for monitoring service status",
      code: `app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});`,
      file: "src/routes/health.routes.ts",
      priority: 7,
      category: "template",
    });

    return fixes;
  }

  private async createBackgroundTerminal(): Promise<any> {
    // Check for existing error-fixer terminal
    const existingTerminal = Array.from(this.terminals.values()).find(
      (t) => t.name === "Error-Fixer"
    );

    if (existingTerminal) {
      return existingTerminal;
    }

    // Create new terminal if under limit
    if (this.terminals.size >= this.config.maxTerminals) {
      throw new Error("Maximum number of terminals reached");
    }

    const terminal = {
      id: `terminal_${Date.now()}`,
      name: "Error-Fixer",
      status: "active",
      created: new Date(),
    };

    this.terminals.set(terminal.id, terminal);
    this.emit("terminalCreated", terminal);

    logger.info(`Background terminal created: ${terminal.id}`);

    return terminal;
  }

  private async executeInTerminal(
    terminal: any,
    command: string
  ): Promise<string> {
    // This would integrate with VS Code terminal API
    // For now, return a placeholder response
    logger.info(`Executing in terminal ${terminal.id}: ${command}`);

    // Simulate command execution
    return `Command executed: ${command}`;
  }

  private broadcastError(error: ErrorData, fixes: QuickFix[]): void {
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

  public getErrors(): ErrorData[] {
    return Array.from(this.errors.values());
  }

  public getError(id: string): ErrorData | undefined {
    return this.errors.get(id);
  }

  public clearErrors(): void {
    this.errors.clear();
    logger.info("All errors cleared");
  }

  public getTerminals(): any[] {
    return Array.from(this.terminals.values());
  }

  public close(): void {
    if (this.wss) {
      this.wss.close();
    }
    if (this.server) {
      this.server.close();
    }
    this.terminals.clear();
    this.errors.clear();
    logger.info("Error-Fixer service closed");
  }
}
