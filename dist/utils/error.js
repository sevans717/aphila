"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleServiceError = handleServiceError;
const logger_1 = require("./logger");
const env_1 = require("../config/env");
/**
 * Centralized helper for service-level errors.
 * - Logs the error
 * - In production re-throws so middleware can handle it
 * - In dev returns a rejected promise to avoid crashing synchronous flows
 */
function handleServiceError(error) {
    try {
        logger_1.logger.error("Service error:", error);
    }
    catch (e) {
        // swallow logging errors
        // eslint-disable-next-line no-console
        console.error("Service error failed to log", e);
    }
    if (env_1.env.nodeEnv === "production") {
        throw error;
    }
    return Promise.reject(error);
}
//# sourceMappingURL=error.js.map