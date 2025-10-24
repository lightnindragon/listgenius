/**
 * Redis client for caching and rate limiting
 */

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache helpers
export class CacheManager {
  private static instance: CacheManager;
  private redis: Redis;

  private constructor() {
    this.redis = redis;
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value as T | null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
      } else {
        await this.redis.set(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const result = await this.redis.incr(key);
      if (ttlSeconds && result === 1) {
        await this.redis.expire(key, ttlSeconds);
      }
      return result;
    } catch (error) {
      console.error('Redis incr error:', error);
      return 0;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.expire(key, ttlSeconds);
    } catch (error) {
      console.error('Redis expire error:', error);
    }
  }
}

// Rate limiting
export class RateLimiter {
  private cache: CacheManager;

  constructor() {
    this.cache = CacheManager.getInstance();
  }

  async isAllowed(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `rate_limit:${identifier}`;
    const current = await this.cache.incr(key, windowSeconds);
    
    const allowed = current <= limit;
    const remaining = Math.max(0, limit - current);
    const resetTime = Date.now() + (windowSeconds * 1000);

    return { allowed, remaining, resetTime };
  }

  async reset(identifier: string): Promise<void> {
    const key = `rate_limit:${identifier}`;
    await this.cache.del(key);
  }
}

// Keyword-specific caching
export class KeywordCache {
  private cache: CacheManager;

  constructor() {
    this.cache = CacheManager.getInstance();
  }

  // Generic get method
  async get(key: string) {
    return await this.cache.get(key);
  }

  // Generic set method
  async set(key: string, value: any, ttl?: number) {
    await this.cache.set(key, value, ttl);
  }

  // Cache keyword metrics for 1 hour
  async getKeywordMetrics(keyword: string) {
    const key = `keyword_metrics:${keyword}`;
    return await this.cache.get(key);
  }

  async setKeywordMetrics(keyword: string, metrics: any) {
    const key = `keyword_metrics:${keyword}`;
    await this.cache.set(key, metrics, 3600); // 1 hour
  }

  // Cache SERP data for 30 minutes
  async getSerpData(keyword: string) {
    const key = `serp_data:${keyword}`;
    return await this.cache.get(key);
  }

  async setSerpData(keyword: string, serpData: any) {
    const key = `serp_data:${keyword}`;
    await this.cache.set(key, serpData, 1800); // 30 minutes
  }

  // Cache trend data for 2 hours
  async getTrendData(keyword: string) {
    const key = `trend_data:${keyword}`;
    return await this.cache.get(key);
  }

  async setTrendData(keyword: string, trendData: any) {
    const key = `trend_data:${keyword}`;
    await this.cache.set(key, trendData, 7200); // 2 hours
  }

  // Cache competitor data for 1 hour
  async getCompetitorData(shopId: string) {
    const key = `competitor:${shopId}`;
    return await this.cache.get(key);
  }

  async setCompetitorData(shopId: string, data: any) {
    const key = `competitor:${shopId}`;
    await this.cache.set(key, data, 3600); // 1 hour
  }

  // Cache user search results for 15 minutes
  async getUserSearchResults(userId: string, query: string) {
    const key = `user_search:${userId}:${query}`;
    return await this.cache.get(key);
  }

  async setUserSearchResults(userId: string, query: string, results: any) {
    const key = `user_search:${userId}:${query}`;
    await this.cache.set(key, results, 900); // 15 minutes
  }

  // Invalidate caches
  async invalidateKeyword(keyword: string) {
    const keys = [
      `keyword_metrics:${keyword}`,
      `serp_data:${keyword}`,
      `trend_data:${keyword}`,
    ];
    
    await Promise.all(keys.map(key => this.cache.del(key)));
  }

  async invalidateCompetitor(shopId: string) {
    await this.cache.del(`competitor:${shopId}`);
  }

  async invalidateUserSearch(userId: string) {
    // This would require a more sophisticated pattern matching
    // For now, we'll let user search results expire naturally
  }
}

// Background job queue
export class JobQueue {
  private cache: CacheManager;

  constructor() {
    this.cache = CacheManager.getInstance();
  }

  async enqueue(jobType: string, data: any, priority = 0) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job = {
      id: jobId,
      type: jobType,
      data,
      priority,
      createdAt: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 3,
    };

    const key = `queue:${jobType}`;
    await this.cache.set(`${key}:${jobId}`, job);
    
    // Add to priority queue (simplified for cache-based implementation)
    await this.cache.set(`queue_priority:${jobType}:${jobId}`, priority);
    
    return jobId;
  }

  async dequeue(jobType: string) {
    // Simplified dequeue for cache-based implementation
    // In a real Redis implementation, this would use priority queues
    // For now, we'll just return null since we don't have a keys method
    return null;
  }

  async getJobStatus(jobType: string, jobId: string) {
    const key = `queue:${jobType}:${jobId}`;
    return await this.cache.get(key);
  }

  async markJobComplete(jobType: string, jobId: string) {
    const key = `queue:${jobType}:${jobId}`;
    await this.cache.del(key);
  }

  async markJobFailed(jobType: string, jobId: string, error: string) {
    const key = `queue:${jobType}:${jobId}`;
    const job = await this.cache.get(key);
    
    if (job) {
      const jobData = job as any;
      jobData.attempts = (jobData.attempts || 0) + 1;
      jobData.lastError = error;
      
      if (jobData.attempts >= jobData.maxAttempts) {
        await this.cache.del(key);
        // Move to failed jobs
        await this.cache.set(`failed_job:${jobType}:${jobId}`, jobData);
      } else {
        await this.cache.set(key, jobData);
        // Re-queue with lower priority (simplified for cache implementation)
        await this.cache.set(`queue_priority:${jobType}:${jobId}`, -1);
      }
    }
  }
}

// Session management
export class SessionManager {
  private cache: CacheManager;

  constructor() {
    this.cache = CacheManager.getInstance();
  }

  async createSession(userId: string, data: any, ttlSeconds = 86400) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = {
      id: sessionId,
      userId,
      data,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
    };

    await this.cache.set(`session:${sessionId}`, session, ttlSeconds);
    await this.cache.set(`user_session:${userId}`, sessionId, ttlSeconds);
    
    return sessionId;
  }

  async getSession(sessionId: string) {
    const session = await this.cache.get(`session:${sessionId}`);
    
    if (session) {
      // Update last accessed time
      const sessionData = session as any;
      sessionData.lastAccessed = new Date().toISOString();
      await this.cache.set(`session:${sessionId}`, sessionData);
    }
    
    return session;
  }

  async updateSession(sessionId: string, data: any) {
    const session = await this.getSession(sessionId);
    
    if (session) {
      const sessionData = session as any;
      sessionData.data = { ...sessionData.data, ...data };
      await this.cache.set(`session:${sessionId}`, sessionData);
    }
  }

  async deleteSession(sessionId: string) {
    const session = await this.getSession(sessionId);
    
    if (session) {
      await this.cache.del(`session:${sessionId}`);
      const sessionData = session as any;
      await this.cache.del(`user_session:${sessionData.userId}`);
    }
  }

  async getUserSession(userId: string) {
    const sessionId = await this.cache.get(`user_session:${userId}`);
    
    if (sessionId) {
      return await this.getSession(sessionId as string);
    }
    
    return null;
  }
}

// Export instances
export const cache = CacheManager.getInstance();
export const rateLimiter = new RateLimiter();
export const keywordCache = new KeywordCache();
export const jobQueue = new JobQueue();
export const sessionManager = new SessionManager();

// Export the redis instance for use in other modules
export { redis };
