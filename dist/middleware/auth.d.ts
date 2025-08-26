import { NextFunction, Request, Response } from 'express';
export declare function auth(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function requireAuth(req: any, res: any, next: any): any;
//# sourceMappingURL=auth.d.ts.map