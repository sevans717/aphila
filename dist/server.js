"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const logger_1 = require("./utils/logger");
const env_1 = require("./config/env");
const websocket_service_1 = require("./services/websocket.service");
console.log("Starting server...");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("DATABASE_URL:", process.env.DATABASE_URL);
const PORT = env_1.env.port;
const HOST = "0.0.0.0";
console.log(`Attempting to start server on ${HOST}:${PORT}`);
const server = app_1.default.listen(PORT, HOST, () => {
    console.log(`🚀 Server listening on http://${HOST}:${PORT}`);
    logger_1.logger.info(`🚀 Server listening on http://${HOST}:${PORT}`);
    logger_1.logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    logger_1.logger.info(`🌍 Environment: ${env_1.env.nodeEnv}`);
});
// Initialize WebSocket service
new websocket_service_1.WebSocketService(server);
// Handle server errors
server.on("error", (error) => {
    logger_1.logger.error("Server error:", error);
    process.exit(1);
});
// Graceful shutdown
process.on("SIGINT", () => {
    console.log("SIGINT received - shutting down gracefully");
    logger_1.logger.info("Shutting down server...");
    server.close(() => {
        logger_1.logger.info("Server closed");
        process.exit(0);
    });
});
process.on("SIGTERM", () => {
    console.log("SIGTERM received - shutting down gracefully");
    logger_1.logger.info("Shutting down server...");
    server.close(() => {
        logger_1.logger.info("Server closed");
        process.exit(0);
    });
});
// Add debugging for unhandled errors
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    logger_1.logger.error("Uncaught Exception:", error);
    process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    logger_1.logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
});
// Add a timer to check if server is still running
setTimeout(() => {
    console.log("Server has been running for 10 seconds");
    logger_1.logger.info("Server has been running for 10 seconds");
}, 10000);
//# sourceMappingURL=server.js.map