import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export function auth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.substring(7);
  try {
  const payload = jwt.verify(token, env.jwtSecret) as { userId: string; email: string };
  // Attach both id and userId for compatibility with various routes
  (req as any).user = { id: payload.userId, userId: payload.userId, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.substring(7);
  try {
  const payload = jwt.verify(token, env.jwtSecret) as { userId: string; email: string };
  // Attach both id and userId for compatibility
  (req as any).user = { id: payload.userId, userId: payload.userId, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
