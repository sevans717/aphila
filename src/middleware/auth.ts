// eslint-disable-next-line @typescript-eslint/no-var-requires
const jwt = require("jsonwebtoken");
import { Request, Response, NextFunction, RequestHandler } from "express";
import { env } from "../config/env";
import { ResponseHelper } from "../utils/response";

export interface AuthRequest extends Request {
  user?:
    | { userId: string; email: string; roles?: string[]; id: string }
    | undefined;
}

// Type-safe wrapper for authenticated route handlers
export function withAuth(
  handler: (req: AuthRequest, res: Response, next: NextFunction) => any
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    return handler(req as AuthRequest, res, next);
  };
}

// Lightweight middleware that attaches `user` if a valid token is present.
export function auth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return next();
  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, env.jwtAccessSecret) as {
      userId: string;
      email: string;
      roles?: string[];
      exp?: number;
    };

    // Basic expiry check (jwt.verify should throw if expired, but validate defensively)
    if (payload.exp && Date.now() / 1000 > payload.exp) return next();

    req.user = {
      id: payload.userId,
      userId: payload.userId,
      email: payload.email,
      roles: payload.roles,
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
    return ResponseHelper.unauthorized(res);
  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, env.jwtAccessSecret) as {
      userId: string;
      email: string;
      roles?: string[];
      exp?: number;
    };

    req.user = {
      id: payload.userId,
      userId: payload.userId,
      email: payload.email,
      roles: payload.roles,
    };
    return next();
  } catch {
    // If expired and refresh token is provided in cookie/header, we could attempt rotation here
    return ResponseHelper.unauthorized(res, "Unauthorized");
  }
}
