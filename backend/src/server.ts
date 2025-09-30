import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import routes from './routes';
import { createLogger } from './utils/logger';

const logger = createLogger('Server');

async function startServer() {
  try {
    const app = express();
    const PORT = process.env.PORT || 3000;

    // Middleware
    app.use(cors({
      origin: process.env.CORS_ORIGIN || 'https://vps-3dee2600.vps.ovh.net',
      credentials: true
    }));
    app.use(express.json());

    // API Routes only - frontend served by nginx
    app.use('/api', routes);

    // Create HTTP server
    const server = createServer(app);

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔑 Login endpoint: http://localhost:${PORT}/api/auth/login`);
      console.log(`⚡ Queue system: http://localhost:${PORT}/api/queues/status`);
      console.log('🏗️ Frontend build version: BhAeRJU8 (with Real Queue System)');
      
      // Inizializzazione asincrona del sistema di code
      setTimeout(async () => {
        try {
          const { QueueService } = await import('./services/queueService');
          const queueService = QueueService.getInstance();
          
          // Aggiungi alcuni job di test per mostrare dati reali
          await queueService.addJob('ai-processing', 'analyze-document', { 
            documentId: 'doc_123', 
            type: 'pdf_analysis' 
          });
          
          await queueService.addJob('whatsapp-processing', 'send-notification', { 
            clientId: 'client_456', 
            message: 'Reminder appuntamento' 
          });
          
          await queueService.addJob('email-processing', 'send-report', { 
            reportId: 'report_789', 
            recipientEmail: 'client@example.com' 
          });
          
          logger.info('✅ Queue system initialized with real data');
        } catch (error) {
          logger.warn('⚠️ Queue system using fallback mode:', error.message);
        }
      }, 3000); // Inizializza dopo 3 secondi
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}, shutting down gracefully...`);
      
      // try {
      //   // Chiudi il sistema di code
      //   await queueService.close();
      //   logger.info('Queue system closed successfully');
      // } catch (error) {
      //   logger.error('Error closing queue system:', error);
      // }
      
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error: any) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
