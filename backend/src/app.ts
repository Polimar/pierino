import express from 'express';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';

import config from '@/config/env';
import { createLogger } from '@/utils/logger';
import { 
  securityHeaders, 
  generalLimiter, 
  authLimiter,
  sanitizeInput,
  requestLogger 
} from '@/middleware/security';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import routes from '@/routes';

const logger = createLogger('App');

const app = express();

// Trust proxy (importante per deployment dietro reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(securityHeaders);
app.use(requestLogger);

// CORS configuration
app.use(cors({
  origin: config.CORS_ORIGIN.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Input sanitization
app.use(sanitizeInput);

// Rate limiting
app.use(generalLimiter);
app.use('/api/auth', authLimiter);

// Static files - serve frontend build
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// API routes
app.use('/api', routes);

// Serve frontend for all non-API routes (SPA routing)
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return notFoundHandler(req, res);
  }
  
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
