/**
 * Centralized helper for service-level errors.
 * - Logs the error
 * - In production re-throws so middleware can handle it
 * - In dev returns a rejected promise to avoid crashing synchronous flows
 */
export declare function handleServiceError(error: any): Promise<never>;
//# sourceMappingURL=error.d.ts.map