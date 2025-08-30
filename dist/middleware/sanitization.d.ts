import { Request, Response, NextFunction } from "express";
/**
 * Middleware to sanitize request body, query, and params
 */
export declare function sanitizeInput(req: Request, res: Response, next: NextFunction): void;
/**
 * Enhanced sanitization for specific fields that might contain HTML
 */
export declare function sanitizeHtmlInput(allowedTags?: string[]): (req: Request, res: Response, next: NextFunction) => void;
export default sanitizeInput;
//# sourceMappingURL=sanitization.d.ts.map