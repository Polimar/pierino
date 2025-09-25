import winston from 'winston';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const safeStringify = (obj: any) => {
      try {
        return JSON.stringify(obj, (key, value) => {
          if (value && typeof value === 'object' && value.constructor === Object) {
            // Rimuovi proprietà che potrebbero causare riferimenti circolari
            const cleaned = { ...value };
            delete cleaned.socket;
            delete cleaned.req;
            delete cleaned.request;
            delete cleaned._httpMessage;
            return cleaned;
          }
          return value;
        }, 2);
      } catch (error) {
        return '[Circular Reference]';
      }
    };

    return `${timestamp} [${level.toUpperCase()}]: ${message} ${
      Object.keys(meta).length ? safeStringify(meta) : ''
    }`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'geometra-backend' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const safeStringify = (obj: any) => {
            try {
              return JSON.stringify(obj, (key, value) => {
                if (value && typeof value === 'object' && value.constructor === Object) {
                  // Rimuovi proprietà che potrebbero causare riferimenti circolari
                  const cleaned = { ...value };
                  delete cleaned.socket;
                  delete cleaned.req;
                  delete cleaned.request;
                  delete cleaned._httpMessage;
                  return cleaned;
                }
                return value;
              }, 2);
            } catch (error) {
              return '[Circular Reference]';
            }
          };

          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? safeStringify(meta) : ''
          }`;
        })
      ),
    })
  );
}

export const createLogger = (service: string) => {
  return logger.child({ service });
};

export default logger;
