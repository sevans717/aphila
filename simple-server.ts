import { server } from './src/app';
import { env } from './src/config/env';
import { logger } from './src/utils/logger';

// Simple server start without WebSocket for testing
async function startSimpleServer() {
  try {
    console.log(`🚀 Starting simple server on port ${env.port}...`);
    console.log(`📁 Current working directory: ${process.cwd()}`);
    console.log(`🌐 Environment: ${env.nodeEnv}`);
    
    const appServer = server.listen(env.port, '0.0.0.0', () => {
      console.log(`✅ Server successfully listening on http://0.0.0.0:${env.port}`);
      console.log(`🔗 Health check: http://localhost:${env.port}/health`);
      console.log(`🔗 API base: http://localhost:${env.port}/api/v1`);
      
      logger.info('Simple server started successfully', {
        port: env.port,
        nodeEnv: env.nodeEnv,
      });
    });

    appServer.on('error', (err: any) => {
      console.error('❌ Server error:', err);
      if (err.code === 'EADDRINUSE') {
        console.error(`💥 Port ${env.port} is already in use!`);
        process.exit(1);
      }
    });

    return appServer;
  } catch (err) {
    logger.error('Failed to start simple server', { err });
    process.exit(1);
  }
}

startSimpleServer();
