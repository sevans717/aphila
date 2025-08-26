import { logger } from "./logger";
import { env } from "../config/env";

/**
 * Centralized helper for service-level errors.
 * - Logs the error
 * - In production re-throws so middleware can handle it
 * - In dev returns a rejected promise to avoid crashing synchronous flows
 */
export function handleServiceError(error: any): Promise<never> {
  try {
    logger.error("Service error:", error);
  } catch (e) {
    // swallow logging errors
    // eslint-disable-next-line no-console
    console.error("Service error failed to log", e);
  }

  if (env.nodeEnv === "production") {
    throw error;
  }

  return Promise.reject(error);
}
