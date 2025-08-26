import { NextFunction, Request, Response } from 'express';
export interface CacheOptions {
    ttl?: number;
    vary?: string[];
    private?: boolean;
    staleWhileRevalidate?: number;
    etag?: boolean;
    lastModified?: boolean;
}
/**
 * Enhanced caching middleware for mobile optimization
 */
export declare function cache(options?: CacheOptions): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * No-cache middleware for sensitive endpoints
 */
export declare function noCache(req: Request, res: Response, next: NextFunction): void;
/**
 * Short cache for frequently changing data
 */
export declare function shortCache(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
/**
 * Medium cache for semi-static data
 */
export declare function mediumCache(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
/**
 * Long cache for static data
 */
export declare function longCache(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
/**
 * User-specific cache for private data
 */
export declare function userCache(ttl?: number): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=cache.d.ts.map