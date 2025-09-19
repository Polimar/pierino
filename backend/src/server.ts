import { createServer } from 'http';
import app from './app';
import config from '@/config/env';
import { connectDB, disconnectDB } from '@/config/database';
import { createLogger } from '@/utils/logger';
import socketService from '@/services/socketService';
import whatsappService from '@/services/whatsappService';
import emailService from '@/services/emailService';
import { seedDatabase } from '@/utils/seeder';

const logger = createLogger('Server');

async function startServer() {
  try {
    // Connect to database
    await connectDB();

    // Create HTTP server
    const server = createServer(app);

    // Initialize Socket.IO
    socketService.initialize(server);

    // Start server
    server.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`Client URL: ${config.CLIENT_URL}`);
      logger.info(`API URL: ${config.API_URL}`);
    });

    // Initialize services
    try {
      // Initialize WhatsApp service
      if (config.NODE_ENV === 'production') {
        whatsappService.connect().catch(err => {
          logger.warn('WhatsApp service initialization failed:', err.message);
        });
      }

      // Initialize Email service
      if (config.SMTP_HOST) {
        emailService.connectIMAP().catch(err => {
          logger.warn('Email IMAP initialization failed:', err.message);
        });
      }

      // Seed database in development
      if (config.NODE_ENV === 'development') {
        seedDatabase().catch(err => {
          logger.warn('Database seeding failed:', err.message);
        });
      }
    } catch (error) {
      logger.warn('Service initialization warnings:', error);
    }

    // Setup event listeners for real-time updates
    setupEventListeners();

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      
      server.close(async () => {
        logger.info('HTTP server closed.');
        
        try {
          // Disconnect services
          await whatsappService.disconnect();
          await disconnectDB();
          logger.info('Services disconnected.');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
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

function setupEventListeners() {
  // WhatsApp events
  whatsappService.on('message_received', (data) => {
    socketService.notifyWhatsAppMessage(data.message);
  });

  whatsappService.on('qr', (qrData) => {
    socketService.notifyWhatsAppStatus({ 
      status: 'qr_code', 
      qrData 
    });
  });

  whatsappService.on('ready', () => {
    socketService.notifyWhatsAppStatus({ 
      status: 'connected' 
    });
  });

  whatsappService.on('disconnected', (reason) => {
    socketService.notifyWhatsAppStatus({ 
      status: 'disconnected', 
      reason 
    });
  });

  // Email events
  emailService.on('email_received', (data) => {
    socketService.notifyEmailReceived(data.email);
  });

  logger.info('Event listeners setup completed');
}

startServer();
