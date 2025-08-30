import { EventEmitter } from "events";
import { logger } from "../utils/logger";

export interface TerminalConfig {
  id: string;
  name: string;
  shell?: string;
  cwd?: string;
  env?: Record<string, string>;
  isBackground: boolean;
  autoClose?: boolean;
}

export interface TerminalCommand {
  id: string;
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
}

export interface CommandResult {
  id: string;
  command: string;
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  timestamp: Date;
}

export class TerminalManager extends EventEmitter {
  private terminals: Map<string, TerminalConfig> = new Map();
  private activeCommands: Map<string, CommandResult> = new Map();
  private maxTerminals: number = 5;
  private commandTimeout: number = 30000; // 30 seconds

  constructor(maxTerminals: number = 5) {
    super();
    this.maxTerminals = maxTerminals;
    this.setupProcessHandlers();
  }

  private setupProcessHandlers(): void {
    // Handle process termination to cleanup terminals
    process.on("SIGINT", () => this.cleanup());
    process.on("SIGTERM", () => this.cleanup());
    process.on("exit", () => this.cleanup());
  }

  /**
   * Check if an Error-Fixer terminal already exists
   */
  public hasErrorFixerTerminal(): boolean {
    return Array.from(this.terminals.values()).some(
      (terminal) => terminal.name === "Error-Fixer"
    );
  }

  /**
   * Get existing Error-Fixer terminal
   */
  public getErrorFixerTerminal(): TerminalConfig | undefined {
    return Array.from(this.terminals.values()).find(
      (terminal) => terminal.name === "Error-Fixer"
    );
  }

  /**
   * Create a new background terminal for Error-Fixer
   */
  public async createErrorFixerTerminal(): Promise<TerminalConfig> {
    // Check if we already have an Error-Fixer terminal
    const existing = this.getErrorFixerTerminal();
    if (existing) {
      logger.info("Reusing existing Error-Fixer terminal");
      return existing;
    }

    // Check terminal limit
    if (this.terminals.size >= this.maxTerminals) {
      throw new Error(`Maximum terminal limit reached (${this.maxTerminals})`);
    }

    const terminal: TerminalConfig = {
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

    logger.info(`Created Error-Fixer terminal: ${terminal.id}`);

    return terminal;
  }

  /**
   * Execute a command in the Error-Fixer terminal
   */
  public async executeInErrorFixerTerminal(
    command: string,
    options: Partial<TerminalCommand> = {}
  ): Promise<CommandResult> {
    const terminal = await this.createErrorFixerTerminal();

    const commandConfig: TerminalCommand = {
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
  private async executeCommand(
    terminal: TerminalConfig,
    cmd: TerminalCommand
  ): Promise<CommandResult> {
    const startTime = Date.now();
    const result: CommandResult = {
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

      logger.info(
        `Executing command in terminal ${terminal.id}: ${cmd.command}`
      );

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
        logger.info(`Command completed successfully: ${cmd.command}`);
      } else {
        logger.warn(
          `Command failed with exit code ${result.exitCode}: ${cmd.command}`
        );
      }
    } catch (error) {
      result.stderr = `Execution error: ${error instanceof Error ? error.message : String(error)}`;
      result.duration = Date.now() - startTime;
      logger.error(`Command execution failed: ${cmd.command}`, error);
    } finally {
      this.activeCommands.delete(cmd.id);
      this.emit("commandCompleted", { terminal, command: cmd, result });
    }

    return result;
  }

  /**
   * Simulate command execution (replace with actual terminal integration)
   */
  private async simulateCommandExecution(cmd: TerminalCommand): Promise<{
    success: boolean;
    exitCode: number;
    stdout: string;
    stderr: string;
  }> {
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
  public getActiveTerminals(): TerminalConfig[] {
    return Array.from(this.terminals.values());
  }

  /**
   * Get terminal by ID
   */
  public getTerminal(id: string): TerminalConfig | undefined {
    return this.terminals.get(id);
  }

  /**
   * Close a specific terminal
   */
  public closeTerminal(id: string): boolean {
    const terminal = this.terminals.get(id);
    if (!terminal) {
      return false;
    }

    this.terminals.delete(id);
    this.emit("terminalClosed", terminal);

    logger.info(`Terminal closed: ${id}`);
    return true;
  }

  /**
   * Close Error-Fixer terminal
   */
  public closeErrorFixerTerminal(): boolean {
    const terminal = this.getErrorFixerTerminal();
    if (!terminal) {
      return false;
    }

    return this.closeTerminal(terminal.id);
  }

  /**
   * Get active commands
   */
  public getActiveCommands(): CommandResult[] {
    return Array.from(this.activeCommands.values());
  }

  /**
   * Set command timeout
   */
  public setCommandTimeout(timeout: number): void {
    this.commandTimeout = timeout;
    logger.info(`Command timeout set to ${timeout}ms`);
  }

  /**
   * Set maximum terminals
   */
  public setMaxTerminals(max: number): void {
    this.maxTerminals = max;
    logger.info(`Maximum terminals set to ${max}`);
  }

  /**
   * Cleanup all terminals and active commands
   */
  public cleanup(): void {
    logger.info("Cleaning up terminal manager...");

    // Close all terminals
    for (const [id] of this.terminals) {
      this.closeTerminal(id);
    }

    // Clear active commands
    this.activeCommands.clear();

    this.emit("cleanup");
    logger.info("Terminal manager cleanup completed");
  }

  /**
   * Get terminal statistics
   */
  public getStats(): {
    totalTerminals: number;
    activeTerminals: number;
    activeCommands: number;
    maxTerminals: number;
  } {
    return {
      totalTerminals: this.terminals.size,
      activeTerminals: this.terminals.size,
      activeCommands: this.activeCommands.size,
      maxTerminals: this.maxTerminals,
    };
  }
}
