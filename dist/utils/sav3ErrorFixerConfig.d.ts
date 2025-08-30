/**
 * SAV3 Project-Specific Error Fixer Configuration
 *
 * This module provides project-specific configuration and integration
 * for the Error-Fixer system, tailored for both desktop and mobile versions.
 */
export interface SAV3ErrorFixerConfig {
    serviceUrl: string;
    wsUrl: string;
    platform: "desktop" | "mobile" | "web";
    environment: "development" | "staging" | "production";
    enabled: boolean;
    captureConsole: boolean;
    captureNetwork: boolean;
    captureUnhandled: boolean;
    captureReact: boolean;
    maxErrors: number;
    logRetentionHours: number;
    autoCleanup: boolean;
    immediateFixes: boolean;
    showNotifications: boolean;
    autoRetry: boolean;
    apiBaseUrl: string;
    projectName: string;
    version: string;
}
export declare class SAV3ErrorFixerConfigManager {
    private static instance;
    private config;
    private constructor();
    static getInstance(): SAV3ErrorFixerConfigManager;
    private loadConfig;
    private detectPlatform;
    private detectEnvironment;
    private getServiceUrl;
    private getWebSocketUrl;
    private getApiBaseUrl;
    private getEnabledState;
    private applyPlatformOverrides;
    getConfig(): SAV3ErrorFixerConfig;
    updateConfig(updates: Partial<SAV3ErrorFixerConfig>): void;
    resetToDefaults(): void;
    getEnvironmentInfo(): {
        platform: string;
        environment: string;
        userAgent: string;
        url: string;
        timestamp: string;
    };
}
export declare const sav3ErrorFixerConfig: SAV3ErrorFixerConfigManager;
//# sourceMappingURL=sav3ErrorFixerConfig.d.ts.map