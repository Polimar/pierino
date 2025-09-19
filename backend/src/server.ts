import app from './app';
import config from '@/config/env';
import { connectDB, disconnectDB } from '@/config/database';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Server');

async function startServer() {
  try {
    // Connect to database
    await connectDB();

    // Start server
    const server = app.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`Client URL: ${config.CLIENT_URL}`);
      logger.info(`API URL: ${config.API_URL}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      
      server.close(async () => {
        logger.info('HTTP server closed.');
        
        try {
          await disconnectDB();
          logger.info('Database disconnected.');
          process.exit(0);
        } catch (error) {
          logger.error('Error during database disconnection:', error);
          process.exit(1);
        }
      });

      // Force close server after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
