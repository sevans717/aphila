import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    retryable?: boolean;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    version: string;
    responseTime?: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  total: number;
}

export class ResponseHelper {
  /**
   * Send successful response with data
   */
  static success<T>(
    res: Response,
    data: T,
    statusCode: number = 200,
    pagination?: PaginationParams
  ): Response {
    const startTime = res.locals.startTime || Date.now();
    const responseTime = Date.now() - startTime;

    const response: ApiResponse<T> = {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId,
        version: "1.0.0",
        responseTime,
      },
    };

    // Add pagination if provided
    if (pagination) {
      const { page = 1, limit = 10, total } = pagination;
      const pages = Math.ceil(total / limit);

      response.pagination = {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      };

      // Add pagination headers for Axios interceptors
      res.set({
        "X-Total-Count": total.toString(),
        "X-Page-Count": pages.toString(),
        "X-Current-Page": page.toString(),
        "X-Per-Page": limit.toString(),
      });
    }

    // Add performance headers
    res.set({
      "X-Response-Time": `${responseTime}ms`,
      "X-Request-ID": res.locals.requestId || "unknown",
    });

    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   */
  static error(
    res: Response,
    code: string,
    message: string,
    statusCode: number = 400,
    details?: any,
    retryable: boolean = false
  ): Response {
    const startTime = res.locals.startTime || Date.now();
    const responseTime = Date.now() - startTime;

    const response: ApiResponse = {
      success: false,
      error: {
        code,
        message,
        details,
        retryable,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId,
        version: "1.0.0",
        responseTime,
      },
    };

    // Add error headers for client handling
    res.set({
      "X-Error-Code": code,
      "X-Error-Retryable": retryable.toString(),
      "X-Response-Time": `${responseTime}ms`,
      "X-Request-ID": res.locals.requestId || "unknown",
    });

    return res.status(statusCode).json(response);
  }

  /**
   * Handle validation errors from Zod
   */
  static validationError(res: Response, errors: any): Response {
    return this.error(
      res,
      "VALIDATION_ERROR",
      "Request validation failed",
      400,
      errors,
      false
    );
  }

  /**
   * Handle not found errors
   */
  static notFound(res: Response, resource: string = "Resource"): Response {
    return this.error(
      res,
      "NOT_FOUND",
      `${resource} not found`,
      404,
      null,
      false
    );
  }

  /**
   * Handle unauthorized errors
   */
  static unauthorized(
    res: Response,
    message: string = "Unauthorized"
  ): Response {
    return this.error(res, "UNAUTHORIZED", message, 401, null, false);
  }

  /**
   * Handle forbidden errors
   */
  static forbidden(res: Response, message: string = "Forbidden"): Response {
    return this.error(res, "FORBIDDEN", message, 403, null, false);
  }

  /**
   * Handle bad request errors
   */
  static badRequest(res: Response, message: string = "Bad request"): Response {
    return this.error(res, "BAD_REQUEST", message, 400, null, false);
  }

  /**
   * Handle rate limit errors
   */
  static rateLimited(res: Response, retryAfter?: number): Response {
    if (retryAfter) {
      res.set("Retry-After", retryAfter.toString());
    }

    return this.error(
      res,
      "RATE_LIMITED",
      "Too many requests",
      429,
      { retryAfter },
      true
    );
  }

  /**
   * Handle server errors
   */
  static serverError(
    res: Response,
    message: string = "Internal server error"
  ): Response {
    return this.error(res, "INTERNAL_ERROR", message, 500, null, true);
  }
}

/**
 * Middleware to add request tracking
 */
export function addRequestTracking(req: any, res: any, next: any) {
  res.locals.startTime = Date.now();
  res.locals.requestId =
    req.headers["x-request-id"] ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add CORS headers optimized for Axios
  res.set({
    "Access-Control-Expose-Headers": [
      "X-Total-Count",
      "X-Page-Count",
      "X-Current-Page",
      "X-Per-Page",
      "X-Response-Time",
      "X-Request-ID",
      "X-Error-Code",
      "X-Error-Retryable",
    ].join(", "),
  });

  next();
}
