"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalManager = void 0;
const events_1 = require("events");
const logger_1 = require("../utils/logger");
class TerminalManager extends events_1.EventEmitter {
    terminals = new Map();
    activeCommands = new Map();
    maxTerminals = 5;
    commandTimeout = 30000; // 30 seconds
    constructor(maxTerminals = 5) {
        super();
        this.maxTerminals = maxTerminals;
        this.setupProcessHandlers();
    }
    setupProcessHandlers() {
        // Handle process termination to cleanup terminals
        process.on("SIGINT", () => this.cleanup());
        process.on("SIGTERM", () => this.cleanup());
        process.on("exit", () => this.cleanup());
    }
    /**
     * Check if an Error-Fixer terminal already exists
     */
    hasErrorFixerTerminal() {
        return Array.from(this.terminals.values()).some((terminal) => terminal.name === "Error-Fixer");
    }
    /**
     * Get existing Error-Fixer terminal
     */
    getErrorFixerTerminal() {
        return Array.from(this.terminals.values()).find((terminal) => terminal.name === "Error-Fixer");
    }
    /**
     * Create a new background terminal for Error-Fixer
     */
    async createErrorFixerTerminal() {
        // Check if we already have an Error-Fixer terminal
        const existing = this.getErrorFixerTerminal();
        if (existing) {
            logger_1.logger.info("Reusing existing Error-Fixer terminal");
            return existing;
        }
        // Check terminal limit
        if (this.terminals.size >= this.maxTerminals) {
            throw new Error(`Maximum terminal limit reached (${this.maxTerminals})`);
        }
        const terminal = {
            id: `error-fixer-${Date.now()}`,
            name: "Error-Fixer",
            shell: process.platform === "win32" ? "pwsh.exe" : "bash",
            cwd: process.cwd(),
            env: { ...process.env, TZ: process.env.TZ || "UTC" },
            isBackground: true,
            autoClose: false,
        };
        this.terminals.set(terminal.id, terminal);
        this.emit("terminalCreated", terminal);
        logger_1.logger.info(`Created Error-Fixer terminal: ${terminal.id}`);
        return terminal;
    }
    /**
     * Execute a command in the Error-Fixer terminal
     */
    async executeInErrorFixerTerminal(command, options = {}) {
        const terminal = await this.createErrorFixerTerminal();
        const commandConfig = {
            id: `cmd-${Date.now()}`,
            command,
            args: options.args || [],
            cwd: options.cwd || terminal.cwd,
            env: { ...terminal.env, ...options.env },
            timeout: options.timeout || this.commandTimeout,
        };
        return this.executeCommand(terminal, commandConfig);
    }
    /**
     * Execute a command in a specific terminal
     */
    async executeCommand(terminal, cmd) {
        const startTime = Date.now();
        const result = {
            id: cmd.id,
            command: cmd.command,
            success: false,
            exitCode: -1,
            stdout: "",
            stderr: "",
            duration: 0,
            timestamp: new Date(),
        };
        try {
            this.activeCommands.set(cmd.id, result);
            this.emit("commandStarted", { terminal, command: cmd });
            logger_1.logger.info(`Executing command in terminal ${terminal.id}: ${cmd.command}`);
            // For now, simulate command execution
            // In a real implementation, this would use VS Code's terminal API
            // or spawn child processes directly
            const simulatedResult = await this.simulateCommandExecution(cmd);
            result.success = simulatedResult.success;
            result.exitCode = simulatedResult.exitCode;
            result.stdout = simulatedResult.stdout;
            result.stderr = simulatedResult.stderr;
            result.duration = Date.now() - startTime;
            if (result.success) {
                logger_1.logger.info(`Command completed successfully: ${cmd.command}`);
            }
            else {
                logger_1.logger.warn(`Command failed with exit code ${result.exitCode}: ${cmd.command}`);
            }
        }
        catch (error) {
            result.stderr = `Execution error: ${error instanceof Error ? error.message : String(error)}`;
            result.duration = Date.now() - startTime;
            logger_1.logger.error(`Command execution failed: ${cmd.command}`, error);
        }
        finally {
            this.activeCommands.delete(cmd.id);
            this.emit("commandCompleted", { terminal, command: cmd, result });
        }
        return result;
    }
    /**
     * Simulate command execution (replace with actual terminal integration)
     */
    async simulateCommandExecution(cmd) {
        // Simulate different command behaviors
        if (cmd.command.includes("npm run dev")) {
            return {
                success: true,
                exitCode: 0,
                stdout: "Development server started on http://localhost:3000",
                stderr: "",
            };
        }
        if (cmd.command.includes("curl")) {
            if (cmd.command.includes("localhost:3000/health")) {
                return {
                    success: true,
                    exitCode: 0,
                    stdout: '{"status":"ok","timestamp":"2025-08-28T10:00:00.000Z"}',
                    stderr: "",
                };
            }
            return {
                success: false,
                exitCode: 7,
                stdout: "",
                stderr: "Failed to connect to localhost port 3000: Connection refused",
            };
        }
        if (cmd.command.includes("npx tsc")) {
            return {
                success: true,
                exitCode: 0,
                stdout: "Compilation completed successfully",
                stderr: "",
            };
        }
        // Default successful response
        return {
            success: true,
            exitCode: 0,
            stdout: `Command executed: ${cmd.command}`,
            stderr: "",
        };
    }
    /**
     * Get all active terminals
     */
    getActiveTerminals() {
        return Array.from(this.terminals.values());
    }
    /**
     * Get terminal by ID
     */
    getTerminal(id) {
        return this.terminals.get(id);
    }
    /**
     * Close a specific terminal
     */
    closeTerminal(id) {
        const terminal = this.terminals.get(id);
        if (!terminal) {
            return false;
        }
        this.terminals.delete(id);
        this.emit("terminalClosed", terminal);
        logger_1.logger.info(`Terminal closed: ${id}`);
        return true;
    }
    /**
     * Close Error-Fixer terminal
     */
    closeErrorFixerTerminal() {
        const terminal = this.getErrorFixerTerminal();
        if (!terminal) {
            return false;
        }
        return this.closeTerminal(terminal.id);
    }
    /**
     * Get active commands
     */
    getActiveCommands() {
        return Array.from(this.activeCommands.values());
    }
    /**
     * Set command timeout
     */
    setCommandTimeout(timeout) {
        this.commandTimeout = timeout;
        logger_1.logger.info(`Command timeout set to ${timeout}ms`);
    }
    /**
     * Set maximum terminals
     */
    setMaxTerminals(max) {
        this.maxTerminals = max;
        logger_1.logger.info(`Maximum terminals set to ${max}`);
    }
    /**
     * Cleanup all terminals and active commands
     */
    cleanup() {
        logger_1.logger.info("Cleaning up terminal manager...");
        // Close all terminals
        for (const [id] of this.terminals) {
            this.closeTerminal(id);
        }
        // Clear active commands
        this.activeCommands.clear();
        this.emit("cleanup");
        logger_1.logger.info("Terminal manager cleanup completed");
    }
    /**
     * Get terminal statistics
     */
    getStats() {
        return {
            totalTerminals: this.terminals.size,
            activeTerminals: this.terminals.size,
            activeCommands: this.activeCommands.size,
            maxTerminals: this.maxTerminals,
        };
    }
}
exports.TerminalManager = TerminalManager;
//# sourceMappingURL=terminalManager.service.js.map