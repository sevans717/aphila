import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export function requestId(req: Request, res: Response, next: NextFunction) {
  const rid =
    req.headers["x-request-id"] ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.locals.requestId = String(rid);

  // Attach a child logger for this request
  try {
    // @ts-ignore - pino child exists at runtime
    res.locals.logger = (logger as any).child
      ? (logger as any).child({ requestId: res.locals.requestId })
      : logger;
  } catch (e) {
    console.warn("Failed to create child logger, using default logger:", e);
    res.locals.logger = logger;
  }

  next();
}

export default requestId;
