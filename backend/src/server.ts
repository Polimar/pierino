import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';

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

    // API Routes
    app.use('/api', routes);

    // Serve static frontend files
    app.use(express.static(path.join(__dirname, '../../frontend/dist')));

    // Handle client-side routing - serve index.html for all non-API routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
    });

    // Create HTTP server
    const server = createServer(app);

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔑 Login endpoint: http://localhost:${PORT}/api/auth/login`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}, shutting down gracefully...`);
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
