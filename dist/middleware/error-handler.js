"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const env_1 = require("../config/env");
function errorHandler(err, req, res, _next) {
    // Zod validation errors -> formatted validation response
    if (err instanceof zod_1.ZodError) {
        logger_1.logger.warn("Validation error in request", {
            path: req.path,
            issues: err.issues,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.validationError(res, {
            errors: err.issues.map((i) => ({
                field: i.path.join("."),
                message: i.message,
            })),
        });
    }
    // Known shaped errors
    if (err && err.status && err.code) {
        // allow services/controllers to throw { status, code, message, details }
        return response_1.ResponseHelper.error(res, err.code, err.message || "Error", err.status, err.details, !!err.retryable);
    }
    // Fallback - log and return internal server error
    try {
        logger_1.logger.error("Unhandled error", {
            msg: err?.message,
            stack: err?.stack,
            path: req.path,
            requestId: res.locals.requestId,
        });
    }
    catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to log error", e);
    }
    return response_1.ResponseHelper.serverError(res, env_1.env.nodeEnv === "production"
        ? "Internal server error"
        : err?.message || "Internal server error");
}
exports.default = errorHandler;
//# sourceMappingURL=error-handler.js.map