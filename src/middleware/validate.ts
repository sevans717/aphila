import { NextFunction, Request, Response } from "express";
import { ZodError, ZodObject, ZodRawShape, ZodSchema, z } from "zod";
import { logger } from "../utils/logger";
import { ResponseHelper } from "../utils/response";

export interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
  maxBodySize?: number; // in bytes
  allowedContentTypes?: string[];
}

export const validateRequest = (options: ValidationOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate content type for POST/PUT/PATCH requests
      if (["POST", "PUT", "PATCH"].includes(req.method)) {
        const contentType = req.headers["content-type"] || "";
        const allowedTypes = options.allowedContentTypes || [
          "application/json",
          "multipart/form-data",
          "application/x-www-form-urlencoded",
        ];

        const isValidContentType = allowedTypes.some((type) =>
          contentType.includes(type)
        );

        if (!isValidContentType) {
          return ResponseHelper.error(
            res,
            "INVALID_CONTENT_TYPE",
            `Content-Type must be one of: ${allowedTypes.join(", ")}`,
            415,
            { contentType, allowedTypes },
            false
          );
        }
      }

      // Validate body size
      if (options.maxBodySize && req.headers["content-length"]) {
        const contentLength = parseInt(req.headers["content-length"]);
        if (contentLength > options.maxBodySize) {
          return ResponseHelper.error(
            res,
            "PAYLOAD_TOO_LARGE",
            `Request body too large. Maximum size: ${options.maxBodySize} bytes`,
            413,
            { contentLength, maxBodySize: options.maxBodySize },
            false
          );
        }
      }

      // Validate schemas
      if (options.body) {
        req.body = options.body.parse(req.body);
      }
      if (options.query) {
        // Validate query without modifying the read-only req.query
        const validatedQuery = options.query.parse(req.query);
        (req as any).validatedQuery = validatedQuery;
      }
      if (options.params) {
        (req as any).params = options.params.parse(req.params);
      }
      if (options.headers) {
        (req as any).headers = options.headers.parse(req.headers);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn("Request validation failed:", {
          path: req.path,
          method: req.method,
          errors: error.issues,
          requestId: res.locals.requestId,
        });

        return ResponseHelper.validationError(res, {
          errors: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
            received: (err as any).received,
          })),
        });
      }

      logger.error("Validation middleware error:", error);
      next(error);
    }
  };
};

// Legacy validate function for backward compatibility
function validate(schema: ZodObject<ZodRawShape>) {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err: any) {
      return res
        .status(400)
        .json({ error: "ValidationError", issues: err.errors });
    }
  };
}

/**
 * Common validation schemas
 */
export const commonValidation = {
  pagination: z.object({
    page: z.string().optional().default("1").transform(Number),
    limit: z.string().optional().default("10").transform(Number),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),

  uuid: z.string().uuid("Invalid UUID format"),

  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
};

export { validate };
