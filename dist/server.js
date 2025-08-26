"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const prisma_1 = require("./lib/prisma");
const websocket_service_1 = require("./services/websocket.service");
const logger_1 = require("./utils/logger");
// Start server with startup error handling
let appServer;
let webSocketService;
async function startServer() {
    try {
        console.log(`🚀 Starting server on port ${env_1.env.port}...`);
        console.log(`📁 Current working directory: ${process.cwd()}`);
        console.log(`🌐 Environment: ${env_1.env.nodeEnv}`);
        appServer = app_1.server.listen(env_1.env.port, '0.0.0.0', () => {
            console.log(`✅ Server successfully listening on http://0.0.0.0:${env_1.env.port}`);
            console.log(`🔗 Health check: http://localhost:${env_1.env.port}/health`);
            console.log(`🔗 API base: http://localhost:${env_1.env.port}/api/v1`);
            // Initialize WebSocket service (don't crash server if it fails)
            try {
                webSocketService = new websocket_service_1.WebSocketService(app_1.server);
                global.webSocketService = webSocketService;
                logger_1.logger.info('Server listening with WebSocket support', {
                    port: env_1.env.port,
                    nodeEnv: env_1.env.nodeEnv,
                    onlineUsers: webSocketService.getOnlineUsersCount()
                });
            }
            catch (wsErr) {
                logger_1.logger.error('Failed to initialize WebSocket service; continuing without WS', { err: wsErr });
            }
        });
        appServer.on('error', (err) => {
            console.error('❌ Server error:', err);
            if (err.code === 'EADDRINUSE') {
                console.error(`💥 Port ${env_1.env.port} is already in use!`);
                process.exit(1);
            }
            if (err.code === 'EACCES') {
                console.error(`💥 Permission denied for port ${env_1.env.port}!`);
                process.exit(1);
            }
        });
        // Graceful shutdown
        process.on('SIGTERM', async () => {
            logger_1.logger.info('SIGTERM received');
            if (webSocketService) {
                webSocketService.close();
            }
            if (appServer) {
                appServer.close(async () => {
                    await prisma_1.prisma.$disconnect();
                    // Add other resource cleanup here if needed
                    process.exit(0);
                });
            }
        });
        process.on('unhandledRejection', (reason) => {
            logger_1.logger.error('Unhandled Rejection', { reason });
        });
        process.on('uncaughtException', (err) => {
            logger_1.logger.error('Uncaught Exception', { err });
            process.exit(1);
        });
    }
    catch (err) {
        logger_1.logger.error('Failed to start server', { err });
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=server.js.map