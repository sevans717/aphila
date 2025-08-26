import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export interface AuthRequest extends Request {
  user?: ({ userId: string; email: string } & { id?: string }) | undefined;
}

// Lightweight middleware that attaches `user` if a valid token is present.
export function auth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return next();
  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as {
      userId: string;
      email: string;
    };
    req.user = {
      id: payload.userId,
      userId: payload.userId,
      email: payload.email,
    };
  } catch {
    // ignore invalid token for optional auth
  }
  return next();
}

// Strict middleware that requires a valid Bearer token.
export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as {
      userId: string;
      email: string;
    };
    req.user = {
      id: payload.userId,
      userId: payload.userId,
      email: payload.email,
    };
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
