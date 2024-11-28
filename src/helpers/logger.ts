import path from 'path';
import fs from 'fs';
import morgan from 'morgan';
import dayjs from 'dayjs';
import { createStream } from 'rotating-file-stream';
import type { Generator } from 'rotating-file-stream';
import type { Express } from 'express';

const filenameGenerator: Generator = (time, index) => {
  // if (!time) return `log-init.log`;
  if (!time || !(time instanceof Date)) time = new Date();
  if (!index) index = 0;
  return `${dayjs(time).format('YYYY-MM-DD')}_${index}.log`;
};

export const setupLogger = (app: Express) => {
  const logDir = path.resolve(process.cwd(), process.env.LOG_PATH || 'logs');

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const rfsStream = createStream(filenameGenerator, {
    path: logDir,
    initialRotation: true,
    size: process.env.LOG_SIZE || '10M',
    interval: process.env.LOG_INTERVAL || '1d',
    compress: 'gzip',
  });

  app.use(
    morgan(process.env.LOG_FORMAT || 'combined', {
      stream: process.env.LOG_FILE ? rfsStream : process.stdout,
    }),
  );

  if (process.env.LOG_FILE) {
    app.use(morgan(process.env.LOG_FORMAT || 'combined'));
  }
};
