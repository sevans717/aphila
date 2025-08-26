"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const isDev = process.env.NODE_ENV !== 'production';
const options = { level: process.env.LOG_LEVEL || 'info' };
if (isDev) {
    // @ts-ignore - transport type is permissive in runtime
    options.transport = { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } };
}
// Create a pino logger instance with custom error method to accept any type
const pinoLogger = (0, pino_1.default)(options);
// Create a wrapper that allows any error type
const logger = {
    ...pinoLogger,
    error: (message, ...args) => {
        // @ts-ignore
        pinoLogger.error(message, ...args);
    },
    warn: (message, ...args) => {
        // @ts-ignore
        pinoLogger.warn(message, ...args);
    },
    info: (message, ...args) => {
        // @ts-ignore
        pinoLogger.info(message, ...args);
    },
    debug: (message, ...args) => {
        // @ts-ignore
        pinoLogger.debug(message, ...args);
    },
};
exports.logger = logger;
//# sourceMappingURL=logger.js.map