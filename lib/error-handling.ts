/**
 * Comprehensive Error Handling Utilities
 */

import { logger } from './logger';

export interface ErrorDetails {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  userId?: string;
  requestId?: string;
  stack?: string;
}

export interface UserFriendlyError {
  title: string;
  message: string;
  action?: string;
  retryable: boolean;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND_ERROR', 404, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 'CONFLICT_ERROR', 409, true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_ERROR', 429, true);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, true, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', 500, true, details);
  }
}

export class CacheError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'CACHE_ERROR', 500, true, details);
  }
}

export class OpenAIError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'OPENAI_ERROR', 500, true, details);
  }
}

export class EtsyAPIError extends AppError {
  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message, 'ETSY_API_ERROR', statusCode, true, details);
  }
}

export class StripeError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'STRIPE_ERROR', 500, true, details);
  }
}

export class ClerkError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'CLERK_ERROR', 500, true, details);
  }
}

/**
 * Error handler for API routes
 */
export function handleAPIError(error: Error, userId?: string, requestId?: string): {
  statusCode: number;
  error: ErrorDetails;
  userFriendly: UserFriendlyError;
} {
  let appError: AppError;
  let userFriendly: UserFriendlyError;

  if (error instanceof AppError) {
    appError = error;
  } else {
    // Convert unknown errors to AppError
    appError = new AppError(
      error.message || 'An unexpected error occurred',
      'UNKNOWN_ERROR',
      500,
      false
    );
  }

  // Log the error
  logger.error('API Error occurred', {
    error: appError.message,
    code: appError.code,
    statusCode: appError.statusCode,
    stack: appError.stack,
    userId,
    requestId,
    details: appError.details,
  });

  // Create error details
  const errorDetails: ErrorDetails = {
    code: appError.code,
    message: appError.message,
    details: appError.details,
    timestamp: new Date().toISOString(),
    userId,
    requestId,
    stack: appError.isOperational ? undefined : appError.stack,
  };

  // Create user-friendly error message
  userFriendly = createUserFriendlyError(appError);

  return {
    statusCode: appError.statusCode,
    error: errorDetails,
    userFriendly,
  };
}

/**
 * Create user-friendly error message
 */
function createUserFriendlyError(error: AppError): UserFriendlyError {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      return {
        title: 'Invalid Input',
        message: error.message,
        retryable: false,
      };

    case 'AUTHENTICATION_ERROR':
      return {
        title: 'Authentication Required',
        message: 'Please log in to continue',
        action: 'Sign In',
        retryable: false,
      };

    case 'AUTHORIZATION_ERROR':
      return {
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action',
        retryable: false,
      };

    case 'NOT_FOUND_ERROR':
      return {
        title: 'Not Found',
        message: 'The requested resource was not found',
        retryable: false,
      };

    case 'CONFLICT_ERROR':
      return {
        title: 'Conflict',
        message: error.message,
        retryable: false,
      };

    case 'RATE_LIMIT_ERROR':
      return {
        title: 'Too Many Requests',
        message: 'Please wait a moment before trying again',
        action: 'Retry',
        retryable: true,
      };

    case 'EXTERNAL_SERVICE_ERROR':
      return {
        title: 'Service Unavailable',
        message: 'An external service is temporarily unavailable',
        action: 'Retry',
        retryable: true,
      };

    case 'DATABASE_ERROR':
      return {
        title: 'Database Error',
        message: 'There was a problem accessing the database',
        action: 'Retry',
        retryable: true,
      };

    case 'CACHE_ERROR':
      return {
        title: 'Cache Error',
        message: 'There was a problem accessing cached data',
        action: 'Retry',
        retryable: true,
      };

    case 'OPENAI_ERROR':
      return {
        title: 'AI Service Error',
        message: 'There was a problem with the AI service',
        action: 'Retry',
        retryable: true,
      };

    case 'ETSY_API_ERROR':
      return {
        title: 'Etsy API Error',
        message: 'There was a problem connecting to Etsy',
        action: 'Retry',
        retryable: true,
      };

    case 'STRIPE_ERROR':
      return {
        title: 'Payment Error',
        message: 'There was a problem processing your payment',
        action: 'Retry',
        retryable: true,
      };

    case 'CLERK_ERROR':
      return {
        title: 'Authentication Error',
        message: 'There was a problem with authentication',
        action: 'Retry',
        retryable: true,
      };

    default:
      return {
        title: 'Unexpected Error',
        message: 'Something went wrong. Please try again',
        action: 'Retry',
        retryable: true,
      };
  }
}

/**
 * Error boundary for React components
 */
export class ErrorBoundary extends Error {
  public readonly component: string;
  public readonly props?: any;
  public readonly state?: any;

  constructor(
    message: string,
    component: string,
    props?: any,
    state?: any
  ) {
    super(message);
    this.component = component;
    this.props = props;
    this.state = state;
    this.name = 'ErrorBoundary';

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async error handler wrapper
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return ((...args: any[]) => {
    return fn(...args).catch((error) => {
      logger.error('Async handler error', {
        error: error.message,
        stack: error.stack,
        args: args.map(arg => typeof arg),
      });
      throw error;
    });
  }) as T;
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Don't retry on certain error types
      if (error instanceof AppError && !error.isOperational) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Error recovery strategies
 */
export class ErrorRecovery {
  /**
   * Try alternative data source
   */
  static async tryAlternative<T>(
    primary: () => Promise<T>,
    alternative: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    try {
      return await primary();
    } catch (error) {
      logger.warn('Primary source failed, trying alternative', { error });
      
      try {
        return await alternative();
      } catch (alternativeError) {
        logger.error('Alternative source also failed', { alternativeError });
        return fallback;
      }
    }
  }

  /**
   * Use cached data as fallback
   */
  static async withCacheFallback<T>(
    fn: () => Promise<T>,
    cacheKey: string,
    cache: Map<string, { data: T; expires: number }>,
    ttl: number = 300000 // 5 minutes
  ): Promise<T> {
    try {
      const result = await fn();
      
      // Cache the result
      cache.set(cacheKey, {
        data: result,
        expires: Date.now() + ttl,
      });
      
      return result;
    } catch (error) {
      logger.warn('Function failed, checking cache', { error, cacheKey });
      
      const cached = cache.get(cacheKey);
      if (cached && Date.now() < cached.expires) {
        logger.info('Using cached data as fallback', { cacheKey });
        return cached.data;
      }
      
      throw error;
    }
  }

  /**
   * Graceful degradation
   */
  static async withGracefulDegradation<T>(
    fn: () => Promise<T>,
    degradedFn: () => Promise<T>
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      logger.warn('Primary function failed, using degraded version', { error });
      return await degradedFn();
    }
  }
}

/**
 * Error monitoring and alerting
 */
export class ErrorMonitor {
  private static errorCounts: Map<string, number> = new Map();
  private static lastAlert: Map<string, number> = new Map();
  private static alertThreshold = 5;
  private static alertCooldown = 300000; // 5 minutes

  static recordError(error: AppError): void {
    const key = error.code;
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count + 1);

    // Check if we should send an alert
    if (count + 1 >= this.alertThreshold) {
      const lastAlertTime = this.lastAlert.get(key) || 0;
      const now = Date.now();

      if (now - lastAlertTime > this.alertCooldown) {
        this.sendAlert(error, count + 1);
        this.lastAlert.set(key, now);
      }
    }
  }

  private static sendAlert(error: AppError, count: number): void {
    logger.error('Error threshold exceeded', {
      code: error.code,
      message: error.message,
      count,
      threshold: this.alertThreshold,
    });

    // In a real application, you would send this to your monitoring service
    // e.g., Sentry, DataDog, New Relic, etc.
  }

  static getErrorStats(): { [key: string]: number } {
    return Object.fromEntries(this.errorCounts);
  }

  static resetErrorCounts(): void {
    this.errorCounts.clear();
    this.lastAlert.clear();
  }
}
