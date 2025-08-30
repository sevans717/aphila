/**
 * SAV3 Enhanced Terminal Manager
 *
 * Enhanced version with automatic cleanup, immediate error handling,
 * and project-specific integrations for both desktop and mobile versions.
 */

import { EventEmitter } from "events";
import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs/promises";
import { logger } from "../utils/logger";
import {
  sav3ErrorFixerConfig,
  SAV3ErrorFixerConfig,
} from "../utils/sav3ErrorFixerConfig";

export interface SAV3TerminalSession {
  id: string;
  command: string;
  args: string[];
  cwd: string;
  env: Record<string, string>;
  startTime: Date;
  endTime?: Date;
  status: "running" | "completed" | "failed" | "killed";
  exitCode?: number;
  output: string[];
  errors: string[];
  pid?: number;
  platform: string;
  environment: string;
}

export interface SAV3TerminalCommand {
  id: string;
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  background?: boolean;
  onOutput?: (data: string) => void;
  onError?: (data: string) => void;
  onComplete?: (code: number, output: string[], errors: string[]) => void;
}

export interface SAV3TerminalStats {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  failedSessions: number;
  averageExecutionTime: number;
  lastCleanup: Date;
  storageUsed: number;
}

export class SAV3TerminalManager extends EventEmitter {
  private sessions: Map<string, SAV3TerminalSession> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private stats: SAV3TerminalStats;
  private config: SAV3ErrorFixerConfig;
  private logDir: string;

  constructor() {
    super();

    this.config = sav3ErrorFixerConfig.getConfig();
    this.stats = this.initializeStats();
    this.logDir = path.join(process.cwd(), "logs", "terminal");

    this.initializeLogDirectory();
    this.startAutoCleanup();

    logger.info(
      `SAV3 Terminal Manager initialized for ${this.config.platform} platform`
    );
  }

  private initializeStats(): SAV3TerminalStats {
    return {
      totalSessions: 0,
      activeSessions: 0,
      completedSessions: 0,
      failedSessions: 0,
      averageExecutionTime: 0,
      lastCleanup: new Date(),
      storageUsed: 0,
    };
  }

  private async initializeLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      logger.info(`Terminal log directory initialized: ${this.logDir}`);
    } catch (_error) {
      logger.error("Failed to create terminal log directory:", _error);
    }
  }

  public async executeCommand(
    cmd: SAV3TerminalCommand
  ): Promise<SAV3TerminalSession> {
    const sessionId = this.generateSessionId();

    const session: SAV3TerminalSession = {
      id: sessionId,
      command: cmd.command,
      args: cmd.args || [],
      cwd: cmd.cwd || process.cwd(),
      env: Object.fromEntries(
        Object.entries({ ...process.env, ...(cmd.env || {}) }).filter(
          ([, value]) => value !== undefined
        )
      ) as Record<string, string>,
      startTime: new Date(),
      status: "running",
      output: [],
      errors: [],
      platform: this.config.platform,
      environment: this.config.environment,
    };

    this.sessions.set(sessionId, session);
    this.stats.totalSessions++;
    this.stats.activeSessions++;

    try {
      const process = spawn(cmd.command, cmd.args || [], {
        cwd: session.cwd,
        env: session.env,
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
      });

      session.pid = process.pid;
      this.processes.set(sessionId, process);

      // Handle stdout
      process.stdout?.on("data", (data: Buffer) => {
        const output = data.toString();
        session.output.push(output);
        cmd.onOutput?.(output);
        this.emit("output", { sessionId, output });
      });

      // Handle stderr
      process.stderr?.on("data", (data: Buffer) => {
        const error = data.toString();
        session.errors.push(error);
        cmd.onError?.(error);
        this.emit("error", { sessionId, error });

        // Immediate error handling
        this.handleImmediateError(sessionId, error);
      });

      // Handle process completion
      process.on("close", async (code: number) => {
        session.endTime = new Date();
        session.exitCode = code;
        session.status = code === 0 ? "completed" : "failed";

        this.processes.delete(sessionId);
        this.stats.activeSessions--;

        if (session.status === "completed") {
          this.stats.completedSessions++;
        } else {
          this.stats.failedSessions++;
        }

        // Update average execution time
        this.updateAverageExecutionTime(session);

        // Save session log
        await this.saveSessionLog(session);

        cmd.onComplete?.(code, session.output, session.errors);
        this.emit("complete", {
          sessionId,
          code,
          output: session.output,
          errors: session.errors,
        });

        logger.info(
          `Terminal session ${sessionId} completed with code ${code}`
        );
      });

      // Handle process errors
      process.on("error", (error) => {
        session.status = "failed";
        session.errors.push(error.message);
        this.processes.delete(sessionId);
        this.stats.activeSessions--;
        this.stats.failedSessions++;

        this.emit("processError", { sessionId, error: error.message });
        logger.error(`Terminal process error for ${sessionId}:`, error);
      });

      // Handle timeout
      if (cmd.timeout) {
        setTimeout(() => {
          if (this.processes.has(sessionId)) {
            this.killSession(sessionId);
          }
        }, cmd.timeout);
      }

      logger.info(
        `Started terminal session ${sessionId}: ${cmd.command} ${cmd.args?.join(" ") || ""}`
      );
    } catch (error) {
      session.status = "failed";
      session.errors.push((error as Error).message);
      this.stats.activeSessions--;
      this.stats.failedSessions++;

      logger.error(`Failed to start terminal session ${sessionId}:`, error);
    }

    return session;
  }

  private handleImmediateError(sessionId: string, error: string): void {
    // Check for common errors and provide immediate fixes
    const session = this.sessions.get(sessionId);
    if (!session) return;

    let fix: string | null = null;

    if (error.includes("command not found")) {
      fix = `Install the required command or check PATH: ${session.command}`;
    } else if (error.includes("permission denied")) {
      fix = `Check file permissions or run with appropriate privileges`;
    } else if (error.includes("ENOENT")) {
      fix = `Check if the file or directory exists: ${session.cwd}`;
    } else if (error.includes("EACCES")) {
      fix = `Check access permissions for: ${session.cwd}`;
    }

    if (fix) {
      this.emit("immediateFix", { sessionId, error, fix });
      logger.info(`Immediate fix suggested for session ${sessionId}: ${fix}`);
    }
  }

  private updateAverageExecutionTime(session: SAV3TerminalSession): void {
    if (!session.endTime) return;

    const executionTime =
      session.endTime.getTime() - session.startTime.getTime();
    const totalSessions =
      this.stats.completedSessions + this.stats.failedSessions;

    if (totalSessions === 1) {
      this.stats.averageExecutionTime = executionTime;
    } else {
      this.stats.averageExecutionTime =
        (this.stats.averageExecutionTime * (totalSessions - 1) +
          executionTime) /
        totalSessions;
    }
  }

  private async saveSessionLog(session: SAV3TerminalSession): Promise<void> {
    try {
      const logFile = path.join(this.logDir, `session_${session.id}.log`);
      const logContent = {
        session,
        timestamp: new Date().toISOString(),
        output: session.output.join(""),
        errors: session.errors.join(""),
      };

      await fs.writeFile(logFile, JSON.stringify(logContent, null, 2));
    } catch (error) {
      logger.error(`Failed to save session log for ${session.id}:`, error);
    }
  }

  public killSession(sessionId: string): boolean {
    const process = this.processes.get(sessionId);
    const session = this.sessions.get(sessionId);

    if (!process || !session) {
      return false;
    }

    try {
      process.kill("SIGTERM");

      // Force kill after 5 seconds
      setTimeout(() => {
        if (this.processes.has(sessionId)) {
          process.kill("SIGKILL");
        }
      }, 5000);

      session.status = "killed";
      session.endTime = new Date();

      this.emit("killed", { sessionId });
      logger.info(`Killed terminal session ${sessionId}`);

      return true;
    } catch (error) {
      logger.error(`Failed to kill session ${sessionId}:`, error);
      return false;
    }
  }

  public getSession(sessionId: string): SAV3TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getAllSessions(): SAV3TerminalSession[] {
    return Array.from(this.sessions.values());
  }

  public getActiveSessions(): SAV3TerminalSession[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.status === "running"
    );
  }

  public async runScript(
    scriptPath: string,
    args: string[] = [],
    options: Partial<SAV3TerminalCommand> = {}
  ): Promise<SAV3TerminalSession> {
    const fullPath = path.resolve(scriptPath);

    // Check if script exists
    try {
      await fs.access(fullPath);
    } catch (error) {
      console.error("Failed to access script file:", error);
      throw new Error(`Script not found: ${fullPath}`);
    }

    const command: SAV3TerminalCommand = {
      id: this.generateSessionId(),
      command: this.getScriptCommand(fullPath),
      args: [fullPath, ...args],
      cwd: options.cwd || path.dirname(fullPath),
      env: options.env,
      timeout: options.timeout,
      background: options.background,
      onOutput: options.onOutput,
      onError: options.onError,
      onComplete: options.onComplete,
    };

    return this.executeCommand(command);
  }

  private getScriptCommand(scriptPath: string): string {
    const ext = path.extname(scriptPath).toLowerCase();

    switch (ext) {
      case ".js":
        return "node";
      case ".ts":
        return "npx ts-node";
      case ".py":
        return "python";
      case ".sh":
        return "bash";
      case ".ps1":
        return "powershell";
      case ".bat":
      case ".cmd":
        return scriptPath;
      default:
        return "node"; // Default to node
    }
  }

  public async runInBackground(
    cmd: SAV3TerminalCommand
  ): Promise<SAV3TerminalSession> {
    cmd.background = true;
    return this.executeCommand(cmd);
  }

  public async runWithRetry(
    cmd: SAV3TerminalCommand,
    maxRetries: number = 3
  ): Promise<SAV3TerminalSession> {
    let lastError: string = "";
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const session = await this.executeCommand(cmd);

        // Wait for completion
        await new Promise<void>((resolve, reject) => {
          const onComplete = (data: any) => {
            if (data.sessionId === session.id) {
              this.removeListener("complete", onComplete);
              if (session.status === "completed") {
                resolve();
              } else {
                reject(
                  new Error(`Command failed with code ${session.exitCode}`)
                );
              }
            }
          };
          this.on("complete", onComplete);
        });

        return session;
      } catch (error) {
        lastError = (error as Error).message;
        attempt++;
        logger.warn(`Command attempt ${attempt} failed: ${lastError}`);

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    throw new Error(
      `Command failed after ${maxRetries} attempts: ${lastError}`
    );
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

  private async performCleanup(): Promise<number> {
    const now = new Date();
    const retentionMs = this.config.logRetentionHours * 60 * 60 * 1000;
    let cleaned = 0;

    try {
      // Clean up old session logs
      const files = await fs.readdir(this.logDir);
      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stats = await fs.stat(filePath);

        if (now.getTime() - stats.mtime.getTime() > retentionMs) {
          await fs.unlink(filePath);
          cleaned++;
        }
      }

      // Clean up old sessions from memory
      for (const [id, session] of this.sessions) {
        if (
          session.endTime &&
          now.getTime() - session.endTime.getTime() > retentionMs
        ) {
          this.sessions.delete(id);
          cleaned++;
        }
      }

      this.stats.lastCleanup = now;

      // Update storage used
      await this.updateStorageUsed();

      logger.info(`Cleaned up ${cleaned} old terminal items`);
    } catch (_error) {
      logger.error("Failed to perform terminal cleanup:", _error);
    }

    return cleaned;
  }

  private async updateStorageUsed(): Promise<void> {
    try {
      let totalSize = 0;
      const files = await fs.readdir(this.logDir);

      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      this.stats.storageUsed = totalSize;
    } catch (_error) {
      logger.error("Failed to update storage used:", _error);
    }
  }

  public getStats(): SAV3TerminalStats {
    return { ...this.stats };
  }

  public async clearLogs(): Promise<void> {
    try {
      const files = await fs.readdir(this.logDir);
      for (const file of files) {
        await fs.unlink(path.join(this.logDir, file));
      }
      this.stats.storageUsed = 0;
      logger.info("All terminal logs cleared");
    } catch (_error) {
      logger.error("Failed to clear terminal logs:", _error);
    }
  }

  public close(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Kill all active processes
    for (const [sessionId, process] of this.processes) {
      try {
        process.kill("SIGTERM");
        logger.info(`Killed process for session ${sessionId}`);
      } catch {
        logger.error(`Failed to kill process for session ${sessionId}`);
      }
    }

    this.processes.clear();
    this.sessions.clear();

    logger.info("SAV3 Terminal Manager closed");
  }

  private generateSessionId(): string {
    return `sav3_terminal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
