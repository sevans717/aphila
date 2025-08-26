import { ZodObject, ZodRawShape } from "zod";
import { Request, Response, NextFunction } from "express";
export declare const validate: (schema: ZodObject<ZodRawShape>) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export default validate;
//# sourceMappingURL=requestValidation.d.ts.map