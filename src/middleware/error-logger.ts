import { Request, Response, NextFunction } from 'express';

export const logErrors = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`❌ Error on ${req.method} ${req.originalUrl}`);
  console.error(err.stack || err.message || err);
  res.status(500).json({ error: 'Internal Server Error' });
};