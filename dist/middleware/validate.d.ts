import { NextFunction, Request, Response } from "express";
import { ZodObject, ZodRawShape, ZodSchema, z } from "zod";
export interface ValidationOptions {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
    headers?: ZodSchema;
    maxBodySize?: number;
    allowedContentTypes?: string[];
}
export declare const validateRequest: (options: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
declare function validate(schema: ZodObject<ZodRawShape>): (req: any, res: any, next: any) => any;
/**
 * Common validation schemas
 */
export declare const commonValidation: {
    pagination: ZodObject<{
        page: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
        limit: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<number, string>>;
        sortBy: z.ZodOptional<z.ZodString>;
        sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            asc: "asc";
            desc: "desc";
        }>>>;
    }, z.core.$strip>;
    uuid: z.ZodString;
    coordinates: ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    }, z.core.$strip>;
};
export { validate };
//# sourceMappingURL=validate.d.ts.map