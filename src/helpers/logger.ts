import path from 'path';
import fs from 'fs';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import morgan from 'morgan';
import type { Express } from 'express';

export let logger: winston.Logger;

export const setupLogger = (app: Express) => {
  const logDir = path.resolve(process.cwd(), process.env.LOG_PATH || 'logs');

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Winston
  const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  };

  const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'warn';
  };

  const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf(
      info => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
  );

  const transports = [
    new winston.transports.Console(),
    new DailyRotateFile({
      filename: '%DATE%',
      dirname: logDir,
      frequency: process.env.LOG_FREQUENCY || 'daily',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: process.env.LOG_SIZE || '100M',
      maxFiles: '10',
      auditFile: `${logDir}/audit.json`,
      extension: '.log',
    }),
  ];

  logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
  });

  // Morgan
  app.use(
    morgan(process.env.LOG_FORMAT || 'combined', {
      stream: process.env.LOG_FILE_ON
        ? {
            write: message => logger.http(message.trim()),
          }
        : process.stdout,
    }),
  );
};
