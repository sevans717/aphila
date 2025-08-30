import { EventEmitter } from "events";
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
export declare class TerminalManager extends EventEmitter {
    private terminals;
    private activeCommands;
    private maxTerminals;
    private commandTimeout;
    constructor(maxTerminals?: number);
    private setupProcessHandlers;
    /**
     * Check if an Error-Fixer terminal already exists
     */
    hasErrorFixerTerminal(): boolean;
    /**
     * Get existing Error-Fixer terminal
     */
    getErrorFixerTerminal(): TerminalConfig | undefined;
    /**
     * Create a new background terminal for Error-Fixer
     */
    createErrorFixerTerminal(): Promise<TerminalConfig>;
    /**
     * Execute a command in the Error-Fixer terminal
     */
    executeInErrorFixerTerminal(command: string, options?: Partial<TerminalCommand>): Promise<CommandResult>;
    /**
     * Execute a command in a specific terminal
     */
    private executeCommand;
    /**
     * Simulate command execution (replace with actual terminal integration)
     */
    private simulateCommandExecution;
    /**
     * Get all active terminals
     */
    getActiveTerminals(): TerminalConfig[];
    /**
     * Get terminal by ID
     */
    getTerminal(id: string): TerminalConfig | undefined;
    /**
     * Close a specific terminal
     */
    closeTerminal(id: string): boolean;
    /**
     * Close Error-Fixer terminal
     */
    closeErrorFixerTerminal(): boolean;
    /**
     * Get active commands
     */
    getActiveCommands(): CommandResult[];
    /**
     * Set command timeout
     */
    setCommandTimeout(timeout: number): void;
    /**
     * Set maximum terminals
     */
    setMaxTerminals(max: number): void;
    /**
     * Cleanup all terminals and active commands
     */
    cleanup(): void;
    /**
     * Get terminal statistics
     */
    getStats(): {
        totalTerminals: number;
        activeTerminals: number;
        activeCommands: number;
        maxTerminals: number;
    };
}
//# sourceMappingURL=terminalManager.service.d.ts.map