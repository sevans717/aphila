import { Response } from 'express';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
        retryable?: boolean;
    };
    meta?: {
        timestamp: string;
        requestId?: string;
        version: string;
        responseTime?: number;
    };
    pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    total: number;
}
export declare class ResponseHelper {
    /**
     * Send successful response with data
     */
    static success<T>(res: Response, data: T, statusCode?: number, pagination?: PaginationParams): Response;
    /**
     * Send error response
     */
    static error(res: Response, code: string, message: string, statusCode?: number, details?: any, retryable?: boolean): Response;
    /**
     * Handle validation errors from Zod
     */
    static validationError(res: Response, errors: any): Response;
    /**
     * Handle not found errors
     */
    static notFound(res: Response, resource?: string): Response;
    /**
     * Handle unauthorized errors
     */
    static unauthorized(res: Response, message?: string): Response;
    /**
     * Handle forbidden errors
     */
    static forbidden(res: Response, message?: string): Response;
    /**
     * Handle rate limit errors
     */
    static rateLimited(res: Response, retryAfter?: number): Response;
    /**
     * Handle server errors
     */
    static serverError(res: Response, message?: string): Response;
}
/**
 * Middleware to add request tracking
 */
export declare function addRequestTracking(req: any, res: any, next: any): void;
//# sourceMappingURL=response.d.ts.map