/**
 * Database configuration and connection management
 */

import { connectDatabase, checkDatabaseHealth } from './db';

// Database configuration
export const DATABASE_CONFIG = {
  // Connection pool settings
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  
  // Retry settings
  maxRetries: 3,
  retryDelay: 1000,
  
  // Health check settings
  healthCheckInterval: 30000, // 30 seconds
};

// Environment validation
export function validateDatabaseConfig() {
  const requiredEnvVars = [
    'DATABASE_URL',
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return true;
}

// Redis configuration validation
export function validateRedisConfig() {
  const requiredEnvVars = [
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.warn(`Redis configuration missing: ${missing.join(', ')}. Caching will be disabled.`);
    return false;
  }

  return true;
}

// Initialize database connection
export async function initializeDatabase() {
  try {
    // Validate configuration
    validateDatabaseConfig();
    
    // Connect to database
    await connectDatabase();
    
    // Verify connection
    const isHealthy = await checkDatabaseHealth();
    if (!isHealthy) {
      throw new Error('Database health check failed');
    }
    
    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Database health monitoring
export class DatabaseHealthMonitor {
  private static instance: DatabaseHealthMonitor;
  private isHealthy = true;
  private lastCheck = 0;
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): DatabaseHealthMonitor {
    if (!DatabaseHealthMonitor.instance) {
      DatabaseHealthMonitor.instance = new DatabaseHealthMonitor();
    }
    return DatabaseHealthMonitor.instance;
  }

  start() {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(async () => {
      try {
        const isHealthy = await checkDatabaseHealth();
        if (isHealthy !== this.isHealthy) {
          this.isHealthy = isHealthy;
          console.log(`Database health status changed: ${isHealthy ? 'healthy' : 'unhealthy'}`);
        }
        this.lastCheck = Date.now();
      } catch (error) {
        console.error('Database health check failed:', error);
        this.isHealthy = false;
      }
    }, DATABASE_CONFIG.healthCheckInterval);
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  getStatus() {
    return {
      isHealthy: this.isHealthy,
      lastCheck: this.lastCheck,
      timeSinceLastCheck: Date.now() - this.lastCheck,
    };
  }
}

// Export health monitor instance
export const healthMonitor = DatabaseHealthMonitor.getInstance();
