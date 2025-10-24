/**
 * Performance Optimization Utilities
 */

import { logger } from './logger';

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  memoryUsage?: NodeJS.MemoryUsage;
  timestamp: string;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static maxMetrics = 1000;

  /**
   * Measure execution time of an async function
   */
  static async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    try {
      const result = await fn();
      const endTime = performance.now();
      const endMemory = process.memoryUsage();

      const duration = endTime - startTime;
      const memoryDelta = {
        rss: endMemory.rss - startMemory.rss,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
      };

      this.recordMetric({
        operation,
        duration,
        memoryUsage: memoryDelta,
        timestamp: new Date().toISOString(),
      });

      logger.info('Performance metric recorded', {
        operation,
        duration: `${duration.toFixed(2)}ms`,
        memoryDelta: `${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      });

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetric({
        operation,
        duration,
        timestamp: new Date().toISOString(),
      });

      logger.error('Performance metric recorded with error', {
        operation,
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Measure execution time of a sync function
   */
  static measure<T>(operation: string, fn: () => T): T {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    try {
      const result = fn();
      const endTime = performance.now();
      const endMemory = process.memoryUsage();

      const duration = endTime - startTime;
      const memoryDelta = {
        rss: endMemory.rss - startMemory.rss,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
      };

      this.recordMetric({
        operation,
        duration,
        memoryUsage: memoryDelta,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetric({
        operation,
        duration,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  private static recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get performance metrics for an operation
   */
  static getMetrics(operation?: string): PerformanceMetrics[] {
    if (operation) {
      return this.metrics.filter(m => m.operation === operation);
    }
    return [...this.metrics];
  }

  /**
   * Get average performance for an operation
   */
  static getAverageMetrics(operation: string): {
    operation: string;
    averageDuration: number;
    count: number;
    minDuration: number;
    maxDuration: number;
  } {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    
    if (operationMetrics.length === 0) {
      return {
        operation,
        averageDuration: 0,
        count: 0,
        minDuration: 0,
        maxDuration: 0,
      };
    }

    const durations = operationMetrics.map(m => m.duration);
    const averageDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    return {
      operation,
      averageDuration,
      count: operationMetrics.length,
      minDuration,
      maxDuration,
    };
  }

  /**
   * Clear all metrics
   */
  static clearMetrics(): void {
    this.metrics = [];
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoization function for expensive calculations
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    
    return result;
  }) as T;
}

/**
 * Lazy loading utility
 */
export class LazyLoader<T> {
  private loader: () => Promise<T>;
  private promise: Promise<T> | null = null;
  private value: T | null = null;

  constructor(loader: () => Promise<T>) {
    this.loader = loader;
  }

  async load(): Promise<T> {
    if (this.value !== null) {
      return this.value;
    }

    if (this.promise === null) {
      this.promise = this.loader();
    }

    this.value = await this.promise;
    return this.value;
  }

  isLoaded(): boolean {
    return this.value !== null;
  }

  reset(): void {
    this.promise = null;
    this.value = null;
  }
}

/**
 * Batch processing utility
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  batchSize = 10
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Retry utility with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
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

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Cache utility with TTL
 */
export class TTLCache<K, V> {
  private cache = new Map<K, { value: V; expires: number }>();
  private defaultTTL: number;

  constructor(defaultTTL = 60000) { // 1 minute default
    this.defaultTTL = defaultTTL;
  }

  set(key: K, value: V, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expires });
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Performance monitoring middleware for API routes
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  operationName: string
): T {
  return ((...args: any[]) => {
    return PerformanceMonitor.measureAsync(operationName, () => fn(...args));
  }) as T;
}
