import { Request, Response, NextFunction, RequestHandler } from "express";
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        roles?: string[];
        id: string;
    } | undefined;
}
export declare function withAuth(handler: (req: AuthRequest, res: Response, next: NextFunction) => any): RequestHandler;
export declare function auth(req: AuthRequest, _res: Response, next: NextFunction): void;
export declare function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
//# sourceMappingURL=auth.d.ts.map