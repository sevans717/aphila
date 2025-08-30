import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { MediaProxyError } from "./errorHandler";
import { logger } from "../utils/logger";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    [key: string]: any;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new MediaProxyError("Authorization header missing or invalid", 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new MediaProxyError("Access token missing", 401);
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;

      if (!decoded.userId) {
        throw new MediaProxyError("Invalid token payload", 401);
      }

      // Attach user info to request
      req.user = {
        userId: decoded.userId,
        ...decoded,
      };

      logger.debug(`Authenticated user: ${req.user?.userId}`);
      next();
    } catch (jwtError: any) {
      if (jwtError.name === "TokenExpiredError") {
        throw new MediaProxyError("Access token expired", 401);
      } else if (jwtError.name === "JsonWebTokenError") {
        throw new MediaProxyError("Invalid access token", 401);
      } else {
        throw new MediaProxyError("Token verification failed", 401);
      }
    }
  } catch (error) {
    next(error);
  }
};
