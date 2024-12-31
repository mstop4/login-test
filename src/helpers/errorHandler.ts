import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error(err.message);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({ error: err.message });
};
