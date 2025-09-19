import dotenv from 'dotenv';
import { createLogger } from '@/utils/logger';

dotenv.config();

const logger = createLogger('Environment');

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !process.env[envVar]
);

if (missingEnvVars.length > 0) {
  logger.error(
    `Missing required environment variables: ${missingEnvVars.join(', ')}`
  );
  process.exit(1);
}

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || '3000'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  API_URL: process.env.API_URL || 'http://localhost:3000/api',

  // Database
  DATABASE_URL: process.env.DATABASE_URL!,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  SESSION_SECRET: process.env.SESSION_SECRET || 'default-session-secret',

  // Email
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  IMAP_HOST: process.env.IMAP_HOST || '',
  IMAP_PORT: parseInt(process.env.IMAP_PORT || '993'),

  // WhatsApp
  WHATSAPP_SESSION_PATH: process.env.WHATSAPP_SESSION_PATH || './data/whatsapp_session',
  WHATSAPP_WEBHOOK_SECRET: process.env.WHATSAPP_WEBHOOK_SECRET || 'default-webhook-secret',
  WHATSAPP_MEDIA_PATH: process.env.WHATSAPP_MEDIA_PATH || './data/uploads/whatsapp',

  // AI Configuration
  OLLAMA_ENDPOINT: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3.1',
  OLLAMA_ENABLED: process.env.OLLAMA_ENABLED === 'true',

  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4',
  OPENAI_ENABLED: process.env.OPENAI_ENABLED === 'true',

  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet',
  ANTHROPIC_ENABLED: process.env.ANTHROPIC_ENABLED === 'true',

  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-pro',
  GEMINI_ENABLED: process.env.GEMINI_ENABLED === 'true',

  // AI Processing
  WHISPER_MODEL: process.env.WHISPER_MODEL || 'base',
  ENABLE_AUDIO_TRANSCRIPTION: process.env.ENABLE_AUDIO_TRANSCRIPTION === 'true',
  ENABLE_OCR: process.env.ENABLE_OCR === 'true',
  ENABLE_AI_ANALYSIS: process.env.ENABLE_AI_ANALYSIS === 'true',
  AI_RESPONSE_TIMEOUT: parseInt(process.env.AI_RESPONSE_TIMEOUT || '30000'),

  // Storage
  UPLOAD_PATH: process.env.UPLOAD_PATH || './data/uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB
  ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,jpg,jpeg,png,gif,mp3,wav,m4a,ogg').split(','),

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || './logs/app.log',

  // Monitoring
  ENABLE_METRICS: process.env.ENABLE_METRICS === 'true',
  METRICS_PORT: parseInt(process.env.METRICS_PORT || '9090'),
};

logger.info('Environment configuration loaded', {
  NODE_ENV: config.NODE_ENV,
  PORT: config.PORT,
  OLLAMA_ENABLED: config.OLLAMA_ENABLED,
  OPENAI_ENABLED: config.OPENAI_ENABLED,
});

export default config;
