"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonValidation = exports.validateRequest = void 0;
exports.validate = validate;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
const validateRequest = (options) => {
    return (req, res, next) => {
        try {
            // Validate content type for POST/PUT/PATCH requests
            if (["POST", "PUT", "PATCH"].includes(req.method)) {
                const contentType = req.headers["content-type"] || "";
                const allowedTypes = options.allowedContentTypes || [
                    "application/json",
                    "multipart/form-data",
                    "application/x-www-form-urlencoded",
                ];
                const isValidContentType = allowedTypes.some((type) => contentType.includes(type));
                if (!isValidContentType) {
                    return response_1.ResponseHelper.error(res, "INVALID_CONTENT_TYPE", `Content-Type must be one of: ${allowedTypes.join(", ")}`, 415, { contentType, allowedTypes }, false);
                }
            }
            // Validate body size
            if (options.maxBodySize && req.headers["content-length"]) {
                const contentLength = parseInt(req.headers["content-length"]);
                if (contentLength > options.maxBodySize) {
                    return response_1.ResponseHelper.error(res, "PAYLOAD_TOO_LARGE", `Request body too large. Maximum size: ${options.maxBodySize} bytes`, 413, { contentLength, maxBodySize: options.maxBodySize }, false);
                }
            }
            // Validate schemas
            if (options.body) {
                req.body = options.body.parse(req.body);
            }
            if (options.query) {
                // Validate query without modifying the read-only req.query
                const validatedQuery = options.query.parse(req.query);
                req.validatedQuery = validatedQuery;
            }
            if (options.params) {
                req.params = options.params.parse(req.params);
            }
            if (options.headers) {
                req.headers = options.headers.parse(req.headers);
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                logger_1.logger.warn("Request validation failed:", {
                    path: req.path,
                    method: req.method,
                    errors: error.issues,
                    requestId: res.locals.requestId,
                });
                return response_1.ResponseHelper.validationError(res, {
                    errors: error.issues.map((err) => ({
                        field: err.path.join("."),
                        message: err.message,
                        code: err.code,
                        received: err.received,
                    })),
                });
            }
            logger_1.logger.error("Validation middleware error:", error);
            next(error);
        }
    };
};
exports.validateRequest = validateRequest;
// Legacy validate function for backward compatibility
function validate(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (err) {
            return res
                .status(400)
                .json({ error: "ValidationError", issues: err.errors });
        }
    };
}
/**
 * Common validation schemas
 */
exports.commonValidation = {
    pagination: zod_1.z.object({
        page: zod_1.z.string().optional().default("1").transform(Number),
        limit: zod_1.z.string().optional().default("10").transform(Number),
        sortBy: zod_1.z.string().optional(),
        sortOrder: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
    }),
    uuid: zod_1.z.string().uuid("Invalid UUID format"),
    coordinates: zod_1.z.object({
        latitude: zod_1.z.number().min(-90).max(90),
        longitude: zod_1.z.number().min(-180).max(180),
    }),
};
//# sourceMappingURL=validate.js.map