"use strict";
/**
 * SAV3 Enhanced Terminal Manager
 *
 * Enhanced version with automatic cleanup, immediate error handling,
 * and project-specific integrations for both desktop and mobile versions.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAV3TerminalManager = void 0;
const events_1 = require("events");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const logger_1 = require("../utils/logger");
const sav3ErrorFixerConfig_1 = require("../utils/sav3ErrorFixerConfig");
class SAV3TerminalManager extends events_1.EventEmitter {
    sessions = new Map();
    processes = new Map();
    cleanupTimer = null;
    stats;
    config;
    logDir;
    constructor() {
        super();
        this.config = sav3ErrorFixerConfig_1.sav3ErrorFixerConfig.getConfig();
        this.stats = this.initializeStats();
        this.logDir = path.join(process.cwd(), "logs", "terminal");
        this.initializeLogDirectory();
        this.startAutoCleanup();
        logger_1.logger.info(`SAV3 Terminal Manager initialized for ${this.config.platform} platform`);
    }
    initializeStats() {
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
    async initializeLogDirectory() {
        try {
            await fs.mkdir(this.logDir, { recursive: true });
            logger_1.logger.info(`Terminal log directory initialized: ${this.logDir}`);
        }
        catch (_error) {
            logger_1.logger.error("Failed to create terminal log directory:", _error);
        }
    }
    async executeCommand(cmd) {
        const sessionId = this.generateSessionId();
        const session = {
            id: sessionId,
            command: cmd.command,
            args: cmd.args || [],
            cwd: cmd.cwd || process.cwd(),
            env: Object.fromEntries(Object.entries({ ...process.env, ...(cmd.env || {}) }).filter(([, value]) => value !== undefined)),
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
            const process = (0, child_process_1.spawn)(cmd.command, cmd.args || [], {
                cwd: session.cwd,
                env: session.env,
                stdio: ["pipe", "pipe", "pipe"],
                shell: true,
            });
            session.pid = process.pid;
            this.processes.set(sessionId, process);
            // Handle stdout
            process.stdout?.on("data", (data) => {
                const output = data.toString();
                session.output.push(output);
                cmd.onOutput?.(output);
                this.emit("output", { sessionId, output });
            });
            // Handle stderr
            process.stderr?.on("data", (data) => {
                const error = data.toString();
                session.errors.push(error);
                cmd.onError?.(error);
                this.emit("error", { sessionId, error });
                // Immediate error handling
                this.handleImmediateError(sessionId, error);
            });
            // Handle process completion
            process.on("close", async (code) => {
                session.endTime = new Date();
                session.exitCode = code;
                session.status = code === 0 ? "completed" : "failed";
                this.processes.delete(sessionId);
                this.stats.activeSessions--;
                if (session.status === "completed") {
                    this.stats.completedSessions++;
                }
                else {
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
                logger_1.logger.info(`Terminal session ${sessionId} completed with code ${code}`);
            });
            // Handle process errors
            process.on("error", (error) => {
                session.status = "failed";
                session.errors.push(error.message);
                this.processes.delete(sessionId);
                this.stats.activeSessions--;
                this.stats.failedSessions++;
                this.emit("processError", { sessionId, error: error.message });
                logger_1.logger.error(`Terminal process error for ${sessionId}:`, error);
            });
            // Handle timeout
            if (cmd.timeout) {
                setTimeout(() => {
                    if (this.processes.has(sessionId)) {
                        this.killSession(sessionId);
                    }
                }, cmd.timeout);
            }
            logger_1.logger.info(`Started terminal session ${sessionId}: ${cmd.command} ${cmd.args?.join(" ") || ""}`);
        }
        catch (error) {
            session.status = "failed";
            session.errors.push(error.message);
            this.stats.activeSessions--;
            this.stats.failedSessions++;
            logger_1.logger.error(`Failed to start terminal session ${sessionId}:`, error);
        }
        return session;
    }
    handleImmediateError(sessionId, error) {
        // Check for common errors and provide immediate fixes
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        let fix = null;
        if (error.includes("command not found")) {
            fix = `Install the required command or check PATH: ${session.command}`;
        }
        else if (error.includes("permission denied")) {
            fix = `Check file permissions or run with appropriate privileges`;
        }
        else if (error.includes("ENOENT")) {
            fix = `Check if the file or directory exists: ${session.cwd}`;
        }
        else if (error.includes("EACCES")) {
            fix = `Check access permissions for: ${session.cwd}`;
        }
        if (fix) {
            this.emit("immediateFix", { sessionId, error, fix });
            logger_1.logger.info(`Immediate fix suggested for session ${sessionId}: ${fix}`);
        }
    }
    updateAverageExecutionTime(session) {
        if (!session.endTime)
            return;
        const executionTime = session.endTime.getTime() - session.startTime.getTime();
        const totalSessions = this.stats.completedSessions + this.stats.failedSessions;
        if (totalSessions === 1) {
            this.stats.averageExecutionTime = executionTime;
        }
        else {
            this.stats.averageExecutionTime =
                (this.stats.averageExecutionTime * (totalSessions - 1) +
                    executionTime) /
                    totalSessions;
        }
    }
    async saveSessionLog(session) {
        try {
            const logFile = path.join(this.logDir, `session_${session.id}.log`);
            const logContent = {
                session,
                timestamp: new Date().toISOString(),
                output: session.output.join(""),
                errors: session.errors.join(""),
            };
            await fs.writeFile(logFile, JSON.stringify(logContent, null, 2));
        }
        catch (error) {
            logger_1.logger.error(`Failed to save session log for ${session.id}:`, error);
        }
    }
    killSession(sessionId) {
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
            logger_1.logger.info(`Killed terminal session ${sessionId}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Failed to kill session ${sessionId}:`, error);
            return false;
        }
    }
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    getAllSessions() {
        return Array.from(this.sessions.values());
    }
    getActiveSessions() {
        return Array.from(this.sessions.values()).filter((s) => s.status === "running");
    }
    async runScript(scriptPath, args = [], options = {}) {
        const fullPath = path.resolve(scriptPath);
        // Check if script exists
        try {
            await fs.access(fullPath);
        }
        catch (error) {
            console.error("Failed to access script file:", error);
            throw new Error(`Script not found: ${fullPath}`);
        }
        const command = {
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
    getScriptCommand(scriptPath) {
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
    async runInBackground(cmd) {
        cmd.background = true;
        return this.executeCommand(cmd);
    }
    async runWithRetry(cmd, maxRetries = 3) {
        let lastError = "";
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                const session = await this.executeCommand(cmd);
                // Wait for completion
                await new Promise((resolve, reject) => {
                    const onComplete = (data) => {
                        if (data.sessionId === session.id) {
                            this.removeListener("complete", onComplete);
                            if (session.status === "completed") {
                                resolve();
                            }
                            else {
                                reject(new Error(`Command failed with code ${session.exitCode}`));
                            }
                        }
                    };
                    this.on("complete", onComplete);
                });
                return session;
            }
            catch (error) {
                lastError = error.message;
                attempt++;
                logger_1.logger.warn(`Command attempt ${attempt} failed: ${lastError}`);
                if (attempt < maxRetries) {
                    // Wait before retry (exponential backoff)
                    await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }
        throw new Error(`Command failed after ${maxRetries} attempts: ${lastError}`);
    }
    startAutoCleanup() {
        if (this.config.autoCleanup) {
            this.cleanupTimer = setInterval(() => {
                this.performCleanup();
            }, 60 * 60 * 1000); // Run every hour
        }
    }
    async performCleanup() {
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
                if (session.endTime &&
                    now.getTime() - session.endTime.getTime() > retentionMs) {
                    this.sessions.delete(id);
                    cleaned++;
                }
            }
            this.stats.lastCleanup = now;
            // Update storage used
            await this.updateStorageUsed();
            logger_1.logger.info(`Cleaned up ${cleaned} old terminal items`);
        }
        catch (_error) {
            logger_1.logger.error("Failed to perform terminal cleanup:", _error);
        }
        return cleaned;
    }
    async updateStorageUsed() {
        try {
            let totalSize = 0;
            const files = await fs.readdir(this.logDir);
            for (const file of files) {
                const filePath = path.join(this.logDir, file);
                const stats = await fs.stat(filePath);
                totalSize += stats.size;
            }
            this.stats.storageUsed = totalSize;
        }
        catch (_error) {
            logger_1.logger.error("Failed to update storage used:", _error);
        }
    }
    getStats() {
        return { ...this.stats };
    }
    async clearLogs() {
        try {
            const files = await fs.readdir(this.logDir);
            for (const file of files) {
                await fs.unlink(path.join(this.logDir, file));
            }
            this.stats.storageUsed = 0;
            logger_1.logger.info("All terminal logs cleared");
        }
        catch (_error) {
            logger_1.logger.error("Failed to clear terminal logs:", _error);
        }
    }
    close() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        // Kill all active processes
        for (const [sessionId, process] of this.processes) {
            try {
                process.kill("SIGTERM");
                logger_1.logger.info(`Killed process for session ${sessionId}`);
            }
            catch {
                logger_1.logger.error(`Failed to kill process for session ${sessionId}`);
            }
        }
        this.processes.clear();
        this.sessions.clear();
        logger_1.logger.info("SAV3 Terminal Manager closed");
    }
    generateSessionId() {
        return `sav3_terminal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.SAV3TerminalManager = SAV3TerminalManager;
//# sourceMappingURL=sav3TerminalManager.service.js.map