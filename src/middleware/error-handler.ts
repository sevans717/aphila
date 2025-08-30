import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ResponseHelper } from "../utils/response";
import { logger } from "../utils/logger";
import { env } from "../config/env";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Zod validation errors -> formatted validation response
  if (err instanceof ZodError) {
    logger.warn("Validation error in request", {
      path: req.path,
      issues: err.issues,
      requestId: res.locals.requestId,
    });
    return ResponseHelper.validationError(res, {
      errors: err.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  }

  // Known shaped errors
  if (err && err.status && err.code) {
    // allow services/controllers to throw { status, code, message, details }
    return ResponseHelper.error(
      res,
      err.code,
      err.message || "Error",
      err.status,
      err.details,
      !!err.retryable
    );
  }

  // Fallback - log and return internal server error
  try {
    logger.error("Unhandled error", {
      msg: err?.message,
      stack: err?.stack,
      path: req.path,
      requestId: res.locals.requestId,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Failed to log error", e);
  }

  return ResponseHelper.serverError(
    res,
    env.nodeEnv === "production"
      ? "Internal server error"
      : err?.message || "Internal server error"
  );
}

export default errorHandler;
