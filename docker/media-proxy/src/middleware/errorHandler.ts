import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class MediaProxyError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  void _next;
  const { statusCode = 500, message, stack } = err;

  // Log error
  logger.error("Error in media proxy:", {
    message,
    statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    stack: statusCode === 500 ? stack : undefined,
  });

  // Don't leak error details in production
  const isProduction = process.env.NODE_ENV === "production";

  const response = {
    error: {
      message:
        isProduction && statusCode === 500 ? "Internal Server Error" : message,
      statusCode,
      ...((!isProduction || statusCode !== 500) && {
        details: message,
      }),
    },
  };

  res.status(statusCode).json(response);
};
