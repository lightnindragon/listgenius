/**
 * Custom error classes for better error handling
 */

export class RateLimitError extends Error {
  public readonly statusCode = 429;
  public readonly type = 'RATE_LIMIT_ERROR';
  
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends Error {
  public readonly statusCode = 400;
  public readonly type = 'VALIDATION_ERROR';
  
  constructor(message: string = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
  }
}

export class EtsyAPIError extends Error {
  public readonly statusCode = 500;
  public readonly type = 'ETSY_API_ERROR';
  
  constructor(message: string = 'Etsy API error') {
    super(message);
    this.name = 'EtsyAPIError';
  }
}

export class OpenAIError extends Error {
  public readonly statusCode = 500;
  public readonly type = 'OPENAI_ERROR';
  
  constructor(message: string = 'OpenAI API error') {
    super(message);
    this.name = 'OpenAIError';
  }
}

export class StripeError extends Error {
  public readonly statusCode = 500;
  public readonly type = 'STRIPE_ERROR';
  
  constructor(message: string = 'Stripe API error') {
    super(message);
    this.name = 'StripeError';
  }
}

export class AuthError extends Error {
  public readonly statusCode = 401;
  public readonly type = 'AUTH_ERROR';
  
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthError';
  }
}

export class PlanLimitError extends Error {
  public readonly statusCode = 403;
  public readonly type = 'PLAN_LIMIT_ERROR';
  
  constructor(message: string = 'Plan limit exceeded') {
    super(message);
    this.name = 'PlanLimitError';
  }
}

/**
 * Check if error is one of our custom errors
 */
export function isCustomError(error: any): error is RateLimitError | ValidationError | EtsyAPIError | OpenAIError | StripeError | AuthError | PlanLimitError {
  return error instanceof RateLimitError ||
         error instanceof ValidationError ||
         error instanceof EtsyAPIError ||
         error instanceof OpenAIError ||
         error instanceof StripeError ||
         error instanceof AuthError ||
         error instanceof PlanLimitError;
}

/**
 * Get error response for API routes
 */
export function getErrorResponse(error: unknown) {
  if (isCustomError(error)) {
    return {
      success: false,
      error: error.message,
      type: error.type,
      statusCode: error.statusCode
    };
  }
  
  // Handle unknown errors
  return {
    success: false,
    error: 'An unexpected error occurred',
    type: 'UNKNOWN_ERROR',
    statusCode: 500
  };
}
