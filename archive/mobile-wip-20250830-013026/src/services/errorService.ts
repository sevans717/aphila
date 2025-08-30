/**
 * Error Handling Service
 * Centralized error handling, logging, and reporting
 */

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum ErrorCategory {
  NETWORK = "network",
  AUTHENTICATION = "authentication",
  VALIDATION = "validation",
  PERMISSION = "permission",
  BUSINESS_LOGIC = "business_logic",
  SYSTEM = "system",
  USER_INPUT = "user_input",
  EXTERNAL_SERVICE = "external_service",
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  screen?: string;
  action?: string;
  additionalData?: Record<string, any>;
  retryAttempts?: number;
  field?: string;
  value?: any;
  resource?: string;
}

export interface AppError {
  id: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: ErrorContext;
  originalError?: Error;
  stack?: string;
  handled: boolean;
}

export interface ErrorReport {
  errors: AppError[];
  summary: {
    totalErrors: number;
    criticalErrors: number;
    highSeverityErrors: number;
    categoryCounts: Record<ErrorCategory, number>;
  };
}

class ErrorHandlingService {
  private errors: AppError[] = [];
  private maxErrors = 1000; // Keep last 1000 errors in memory
  private reportingEnabled = true;
  private retryAttempts: Map<string, number> = new Map();

  /**
   * Handle error with automatic categorization and severity assessment
   */
  public handleError(
    error: Error | string,
    context?: ErrorContext,
    category?: ErrorCategory,
    severity?: ErrorSeverity
  ): AppError {
    const appError: AppError = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: typeof error === "string" ? error : error.message,
      category: category || this.categorizeError(error),
      severity: severity || this.assessSeverity(error, context),
      timestamp: new Date(),
      context,
      originalError: typeof error === "object" ? error : undefined,
      stack: typeof error === "object" ? error.stack : undefined,
      handled: true,
    };

    this.recordError(appError);
    this.reportError(appError);

    return appError;
  }

  /**
   * Handle unhandled errors/exceptions
   */
  public handleUnhandledError(error: Error, context?: ErrorContext): AppError {
    const appError = this.handleError(
      error,
      context,
      ErrorCategory.SYSTEM,
      ErrorSeverity.CRITICAL
    );
    appError.handled = false;

    // For unhandled errors, always report immediately
    this.reportErrorImmediately(appError);

    return appError;
  }

  /**
   * Create and handle a custom error
   */
  public createError(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: ErrorContext
  ): AppError {
    return this.handleError(message, context, category, severity);
  }

  /**
   * Handle network-related errors with retry logic
   */
  public handleNetworkError(
    error: Error,
    requestId?: string,
    context?: ErrorContext
  ): AppError {
    const retryKey = requestId || `network_${Date.now()}`;
    const attempts = this.retryAttempts.get(retryKey) || 0;

    const appError = this.handleError(
      error,
      { ...context, retryAttempts: attempts },
      ErrorCategory.NETWORK,
      this.getNetworkErrorSeverity(error, attempts)
    );

    // Track retry attempts
    this.retryAttempts.set(retryKey, attempts + 1);

    return appError;
  }

  /**
   * Handle validation errors
   */
  public handleValidationError(
    field: string,
    message: string,
    value?: any,
    context?: ErrorContext
  ): AppError {
    return this.handleError(
      `Validation failed for ${field}: ${message}`,
      { ...context, field, value },
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW
    );
  }

  /**
   * Handle authentication errors
   */
  public handleAuthError(error: Error, context?: ErrorContext): AppError {
    return this.handleError(
      error,
      context,
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.HIGH
    );
  }

  /**
   * Handle permission/authorization errors
   */
  public handlePermissionError(
    resource: string,
    action: string,
    context?: ErrorContext
  ): AppError {
    return this.handleError(
      `Access denied for ${action} on ${resource}`,
      { ...context, resource, action },
      ErrorCategory.PERMISSION,
      ErrorSeverity.MEDIUM
    );
  }

  /**
   * Record error in local storage and memory
   */
  private recordError(error: AppError): void {
    // Add to memory (with size limit)
    this.errors.push(error);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift(); // Remove oldest error
    }

    // Store critical errors locally for persistence
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.storeCriticalError(error);
    }
  }

  /**
   * Store critical errors locally
   */
  private async storeCriticalError(error: AppError): Promise<void> {
    try {
      // Note: In a real implementation, you'd use AsyncStorage here
      // For now, we'll just log it
      console.error("CRITICAL ERROR:", {
        id: error.id,
        message: error.message,
        timestamp: error.timestamp,
        context: error.context,
      });
    } catch (storageError) {
      console.error("Failed to store critical error:", storageError);
    }
  }

  /**
   * Report error to external service (e.g., crash reporting)
   */
  private reportError(error: AppError): void {
    if (!this.reportingEnabled) return;

    // Only report medium+ severity errors
    if (error.severity === ErrorSeverity.LOW) return;

    // In a real implementation, you'd send to crash reporting service
    // For now, we'll just log structured data
    this.logStructuredError(error);
  }

  /**
   * Report error immediately (for critical/unhandled errors)
   */
  private reportErrorImmediately(error: AppError): void {
    if (!this.reportingEnabled) return;

    // Force immediate reporting for critical errors
    this.logStructuredError(error, true);
  }

  /**
   * Log structured error data
   */
  private logStructuredError(
    error: AppError,
    immediate: boolean = false
  ): void {
    const logData = {
      errorId: error.id,
      message: error.message,
      category: error.category,
      severity: error.severity,
      timestamp: error.timestamp.toISOString(),
      handled: error.handled,
      context: error.context,
      stack: error.stack,
      immediate,
    };

    if (error.severity === ErrorSeverity.CRITICAL || immediate) {
      console.error("ERROR REPORT:", JSON.stringify(logData, null, 2));
    } else {
      console.warn("Error logged:", logData.message);
    }
  }

  /**
   * Automatically categorize error based on error type/message
   */
  private categorizeError(error: Error | string): ErrorCategory {
    const message = typeof error === "string" ? error : error.message;
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("network") || lowerMessage.includes("fetch")) {
      return ErrorCategory.NETWORK;
    }
    if (lowerMessage.includes("auth") || lowerMessage.includes("token")) {
      return ErrorCategory.AUTHENTICATION;
    }
    if (
      lowerMessage.includes("validation") ||
      lowerMessage.includes("invalid")
    ) {
      return ErrorCategory.VALIDATION;
    }
    if (
      lowerMessage.includes("permission") ||
      lowerMessage.includes("forbidden")
    ) {
      return ErrorCategory.PERMISSION;
    }
    if (lowerMessage.includes("external") || lowerMessage.includes("service")) {
      return ErrorCategory.EXTERNAL_SERVICE;
    }

    return ErrorCategory.SYSTEM;
  }

  /**
   * Assess error severity based on context and error type
   */
  private assessSeverity(
    error: Error | string,
    context?: ErrorContext
  ): ErrorSeverity {
    const message = typeof error === "string" ? error : error.message;
    const lowerMessage = message.toLowerCase();

    // Critical conditions
    if (
      lowerMessage.includes("crash") ||
      lowerMessage.includes("fatal") ||
      lowerMessage.includes("corrupt")
    ) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity conditions
    if (
      lowerMessage.includes("auth") ||
      lowerMessage.includes("security") ||
      lowerMessage.includes("payment")
    ) {
      return ErrorSeverity.HIGH;
    }

    // Low severity conditions
    if (
      lowerMessage.includes("validation") ||
      lowerMessage.includes("format") ||
      lowerMessage.includes("input")
    ) {
      return ErrorSeverity.LOW;
    }

    return ErrorSeverity.MEDIUM;
  }

  /**
   * Get network error severity based on attempts
   */
  private getNetworkErrorSeverity(
    error: Error,
    attempts: number
  ): ErrorSeverity {
    if (attempts >= 3) return ErrorSeverity.HIGH;
    if (attempts >= 1) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  /**
   * Get error report
   */
  public getErrorReport(limit?: number): ErrorReport {
    const recentErrors = limit ? this.errors.slice(-limit) : this.errors;

    const categoryCounts = Object.values(ErrorCategory).reduce(
      (acc, category) => {
        acc[category] = recentErrors.filter(
          (e) => e.category === category
        ).length;
        return acc;
      },
      {} as Record<ErrorCategory, number>
    );

    return {
      errors: recentErrors,
      summary: {
        totalErrors: recentErrors.length,
        criticalErrors: recentErrors.filter(
          (e) => e.severity === ErrorSeverity.CRITICAL
        ).length,
        highSeverityErrors: recentErrors.filter(
          (e) => e.severity === ErrorSeverity.HIGH
        ).length,
        categoryCounts,
      },
    };
  }

  /**
   * Get errors by category
   */
  public getErrorsByCategory(category: ErrorCategory): AppError[] {
    return this.errors.filter((error) => error.category === category);
  }

  /**
   * Get errors by severity
   */
  public getErrorsBySeverity(severity: ErrorSeverity): AppError[] {
    return this.errors.filter((error) => error.severity === severity);
  }

  /**
   * Clear retry attempts for a request
   */
  public clearRetryAttempts(requestId: string): void {
    this.retryAttempts.delete(requestId);
  }

  /**
   * Get retry count for a request
   */
  public getRetryCount(requestId: string): number {
    return this.retryAttempts.get(requestId) || 0;
  }

  /**
   * Clear all errors
   */
  public clearErrors(): void {
    this.errors = [];
    this.retryAttempts.clear();
  }

  /**
   * Enable/disable error reporting
   */
  public setReportingEnabled(enabled: boolean): void {
    this.reportingEnabled = enabled;
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recentErrors: number; // Last hour
  } {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrors = this.errors.filter((e) => e.timestamp > oneHourAgo);

    const errorsByCategory = Object.values(ErrorCategory).reduce(
      (acc, category) => {
        acc[category] = this.errors.filter(
          (e) => e.category === category
        ).length;
        return acc;
      },
      {} as Record<ErrorCategory, number>
    );

    const errorsBySeverity = Object.values(ErrorSeverity).reduce(
      (acc, severity) => {
        acc[severity] = this.errors.filter(
          (e) => e.severity === severity
        ).length;
        return acc;
      },
      {} as Record<ErrorSeverity, number>
    );

    return {
      totalErrors: this.errors.length,
      errorsByCategory,
      errorsBySeverity,
      recentErrors: recentErrors.length,
    };
  }

  /**
   * Check if error should be retried
   */
  public shouldRetry(error: AppError, maxRetries: number = 3): boolean {
    if (error.category !== ErrorCategory.NETWORK) return false;

    const requestId = error.context?.additionalData?.requestId;
    if (!requestId) return false;

    const attempts = this.getRetryCount(requestId);
    return attempts < maxRetries;
  }

  /**
   * Create error boundary handler
   */
  public createErrorBoundary() {
    return {
      componentDidCatch: (error: Error, errorInfo: any) => {
        this.handleUnhandledError(error, {
          additionalData: errorInfo,
          action: "component_render",
        });
      },
    };
  }
}

// Export singleton instance
export const errorService = new ErrorHandlingService();
export default errorService;
