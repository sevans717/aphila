/**
 * SAV3 Enhanced Terminal Manager
 *
 * Enhanced version with automatic cleanup, immediate error handling,
 * and project-specific integrations for both desktop and mobile versions.
 */
import { EventEmitter } from "events";
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
export declare class SAV3TerminalManager extends EventEmitter {
    private sessions;
    private processes;
    private cleanupTimer;
    private stats;
    private config;
    private logDir;
    constructor();
    private initializeStats;
    private initializeLogDirectory;
    executeCommand(cmd: SAV3TerminalCommand): Promise<SAV3TerminalSession>;
    private handleImmediateError;
    private updateAverageExecutionTime;
    private saveSessionLog;
    killSession(sessionId: string): boolean;
    getSession(sessionId: string): SAV3TerminalSession | undefined;
    getAllSessions(): SAV3TerminalSession[];
    getActiveSessions(): SAV3TerminalSession[];
    runScript(scriptPath: string, args?: string[], options?: Partial<SAV3TerminalCommand>): Promise<SAV3TerminalSession>;
    private getScriptCommand;
    runInBackground(cmd: SAV3TerminalCommand): Promise<SAV3TerminalSession>;
    runWithRetry(cmd: SAV3TerminalCommand, maxRetries?: number): Promise<SAV3TerminalSession>;
    private startAutoCleanup;
    private performCleanup;
    private updateStorageUsed;
    getStats(): SAV3TerminalStats;
    clearLogs(): Promise<void>;
    close(): void;
    private generateSessionId;
}
//# sourceMappingURL=sav3TerminalManager.service.d.ts.map