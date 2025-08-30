"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pino = require("pino");
const isDev = process.env.NODE_ENV !== "production";
const options = { level: process.env.LOG_LEVEL || "info" };
// Only enable pretty output in interactive dev (best-effort).
// Some pino versions/platforms throw when resolving transports; guard that.
const enablePretty = isDev && !process.env.JEST_WORKER_ID && !process.env.CI;
if (enablePretty) {
    try {
        // Try the modern transport API first
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const tryRequire = (name) => {
            try {
                // use require to detect presence without crashing
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                return require(name);
            }
            catch {
                return null;
            }
        };
        const pretty = tryRequire("pino-pretty");
        if (pretty) {
            // prefer transport when available
            options.transport = {
                target: "pino-pretty",
                options: { colorize: true, translateTime: "SYS:standard" },
            };
        }
        else {
            // fallback to older prettyPrint option if supported by pino version
            options.prettyPrint = {
                colorize: true,
                translateTime: "SYS:standard",
            };
        }
    }
    catch (_err) {
        // ignore — run without pretty transport
        console.warn("Failed to set up pretty transport for logger, using default:", _err);
    }
}
// Create a pino logger instance with custom error method to accept any type
let pinoLogger;
try {
    pinoLogger = pino(options);
}
catch (_err) {
    // Fall back to default pino if options are incompatible with installed pino
    console.warn("Failed to create pino logger with options, using default:", _err);
    pinoLogger = pino();
}
// Create a wrapper that allows any error type
const logger = {
    ...pinoLogger,
    error: (message, ...args) => {
        // @ts-ignore - Allow any type for flexible logging
        pinoLogger.error(message, ...args);
    },
    warn: (message, ...args) => {
        // @ts-ignore - Allow any type for flexible logging
        pinoLogger.warn(message, ...args);
    },
    info: (message, ...args) => {
        // @ts-ignore - Allow any type for flexible logging
        pinoLogger.info(message, ...args);
    },
    debug: (message, ...args) => {
        // @ts-ignore - Allow any type for flexible logging
        pinoLogger.debug(message, ...args);
    },
};
exports.logger = logger;
//# sourceMappingURL=logger.js.map