/**
 * Simple logger with timestamps and log levels
 */

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatLog(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      message,
      ...(data && { data })
    };
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const logEntry = this.formatLog(level, message, data);
    
    if (this.isDevelopment) {
      // Pretty print in development
      console.log(`[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}`, data ? data : '');
    } else {
      // JSON format for production
      console.log(JSON.stringify(logEntry));
    }
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, data);
    }
  }
}

export const logger = new Logger();

/**
 * Log API request/response
 */
export function logApiCall(method: string, url: string, statusCode: number, duration?: number) {
  logger.info(`API ${method} ${url}`, {
    statusCode,
    duration: duration ? `${duration}ms` : undefined
  });
}

/**
 * Log OpenAI usage
 */
export function logOpenAIUsage(model: string, tokensUsed: number, cost?: number) {
  logger.info('OpenAI API usage', {
    model,
    tokensUsed,
    cost: cost ? `$${cost.toFixed(4)}` : undefined
  });
}

/**
 * Log user action
 */
export function logUserAction(userId: string, action: string, metadata?: any) {
  logger.info(`User action: ${action}`, {
    userId,
    ...metadata
  });
}
