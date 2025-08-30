"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestId = requestId;
const logger_1 = require("../utils/logger");
function requestId(req, res, next) {
    const rid = req.headers["x-request-id"] ||
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.locals.requestId = String(rid);
    // Attach a child logger for this request
    try {
        // @ts-ignore - pino child exists at runtime
        res.locals.logger = logger_1.logger.child
            ? logger_1.logger.child({ requestId: res.locals.requestId })
            : logger_1.logger;
    }
    catch (e) {
        console.warn("Failed to create child logger, using default logger:", e);
        res.locals.logger = logger_1.logger;
    }
    next();
}
exports.default = requestId;
//# sourceMappingURL=request-id.js.map