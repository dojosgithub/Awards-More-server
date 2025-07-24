// middleware/logger.ts
import { Request, Response, NextFunction } from 'express';

export const logRequests = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor =
      res.statusCode >= 500
        ? '\x1b[31m'
        : res.statusCode >= 400
        ? '\x1b[33m'
        : '\x1b[32m';

    console.log(
      `${req.method} ${req.originalUrl} - ${statusColor}${res.statusCode}\x1b[0m (${duration}ms)`
    );
  });

  next();
};
