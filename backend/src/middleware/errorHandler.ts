import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('ErrorHandler');

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode = 500, message } = error;

  // Log the error
  logger.error('Error handled:', {
    error: message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Dato duplicato - un record con questi valori esiste già';
        break;
      case 'P2014':
        statusCode = 400;
        message = 'Violazione di relazione - impossibile eliminare record con dipendenze';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Violazione di vincolo di chiave esterna';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record non trovato';
        break;
      default:
        statusCode = 500;
        message = 'Errore del database';
    }
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Dati di input non validi';
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token non valido';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token scaduto';
  }

  // Multer errors (file upload)
  if (error.name === 'MulterError') {
    const multerError = error as any;
    
    switch (multerError.code) {
      case 'LIMIT_FILE_SIZE':
        statusCode = 413;
        message = 'File troppo grande';
        break;
      case 'LIMIT_FILE_COUNT':
        statusCode = 400;
        message = 'Troppi file';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        statusCode = 400;
        message = 'Campo file non previsto';
        break;
      default:
        statusCode = 400;
        message = 'Errore caricamento file';
    }
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Errore interno del server';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      error: error.name,
    }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Endpoint non trovato: ${req.method} ${req.url}`,
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
