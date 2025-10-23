/**
 * Database connection and utilities
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Connection helper
export async function connectDatabase() {
  try {
    await db.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Disconnect helper
export async function disconnectDatabase() {
  await db.$disconnect();
}

// Health check
export async function checkDatabaseHealth() {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Transaction helper
export async function withTransaction<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return await db.$transaction(callback);
}

// Pagination helper
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// Keyword-specific helpers
export async function findOrCreateKeyword(term: string, language = 'en-US') {
  return await db.keyword.upsert({
    where: { term },
    update: { updatedAt: new Date() },
    create: {
      term,
      language,
    },
  });
}

export async function getKeywordWithMetrics(keywordId: string, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return await db.keyword.findUnique({
    where: { id: keywordId },
    include: {
      metrics: {
        where: {
          date: {
            gte: cutoffDate,
          },
        },
        orderBy: {
          date: 'desc',
        },
      },
      similar: {
        orderBy: {
          relevance: 'desc',
        },
        take: 10,
      },
      serpSamples: {
        orderBy: {
          sampledAt: 'desc',
        },
        take: 50,
      },
    },
  });
}

export async function getKeywordsByUser(userId: string, options: PaginationOptions = {}) {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  const skip = (page - 1) * limit;

  const [keywords, total] = await Promise.all([
    db.keyword.findMany({
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        userEvents: {
          where: {
            userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        metrics: {
          orderBy: {
            date: 'desc',
          },
          take: 1,
        },
      },
    }),
    db.keyword.count(),
  ]);

  return createPaginationResult(keywords, total, page, limit);
}

// Competitor helpers
export async function getCompetitorShops(userId: string) {
  return await db.competitorShop.findMany({
    where: { userId },
    include: {
      snapshots: {
        orderBy: {
          date: 'desc',
        },
        take: 1,
      },
    },
    orderBy: {
      addedAt: 'desc',
    },
  });
}

export async function addCompetitorShop(userId: string, shopId: number, shopName: string) {
  return await db.competitorShop.create({
    data: {
      userId,
      shopId: BigInt(shopId),
      shopName,
    },
  });
}

// Performance tracking helpers
export async function recordListingPerformance(
  userId: string,
  listingId: number,
  performance: {
    impressions?: number;
    visits?: number;
    favorites?: number;
    orders?: number;
    revenue?: number;
  }
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await db.listingPerformance.upsert({
    where: {
      userId_listingId_date: {
        userId,
        listingId: BigInt(listingId),
        date: today,
      },
    },
    update: performance,
    create: {
      userId,
      listingId: BigInt(listingId),
      date: today,
      ...performance,
    },
  });
}

// Rank tracking helpers
export async function recordRankTracking(
  userId: string,
  listingId: number,
  keywordId: string,
  position: number | null,
  page: number | null
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await db.keywordRankTracking.upsert({
    where: {
      userId_listingId_keywordId_date: {
        userId,
        listingId: BigInt(listingId),
        keywordId,
        date: today,
      },
    },
    update: {
      position,
      page,
    },
    create: {
      userId,
      listingId: BigInt(listingId),
      keywordId,
      date: today,
      position,
      page,
    },
  });
}

export async function getRankTrackingHistory(
  userId: string,
  listingId: number,
  keywordId?: string,
  days = 30
) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return await db.keywordRankTracking.findMany({
    where: {
      userId,
      listingId: BigInt(listingId),
      ...(keywordId && { keywordId }),
      date: {
        gte: cutoffDate,
      },
    },
    include: {
      keyword: true,
    },
    orderBy: {
      date: 'desc',
    },
  });
}

// Weights configuration helpers
export async function getActiveWeightsConfig() {
  return await db.weightsConfig.findFirst({
    where: { isActive: true },
  });
}

export async function createWeightsConfig(weights: {
  version: string;
  w1_suggest: number;
  w2_serp: number;
  w3_trends: number;
  c1_listings: number;
  c2_shopConc: number;
  c3_titleExact: number;
  s1_variance: number;
  s2_peak: number;
}) {
  // Deactivate all existing configs
  await db.weightsConfig.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  // Create new active config
  return await db.weightsConfig.create({
    data: {
      ...weights,
      isActive: true,
    },
  });
}

// Cleanup helpers
export async function cleanupOldData(daysToKeep = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const results = await Promise.all([
    // Clean up old keyword metrics (keep only recent data)
    db.keywordMetricsDaily.deleteMany({
      where: {
        date: {
          lt: cutoffDate,
        },
      },
    }),
    
    // Clean up old SERP samples (keep only recent data)
    db.keywordSerpSample.deleteMany({
      where: {
        sampledAt: {
          lt: cutoffDate,
        },
      },
    }),
    
    // Clean up old competitor snapshots (keep only recent data)
    db.competitorSnapshot.deleteMany({
      where: {
        date: {
          lt: cutoffDate,
        },
      },
    }),
    
    // Clean up old rank tracking data (keep only recent data)
    db.keywordRankTracking.deleteMany({
      where: {
        date: {
          lt: cutoffDate,
        },
      },
    }),
  ]);

  return {
    keywordMetricsDeleted: results[0].count,
    serpSamplesDeleted: results[1].count,
    competitorSnapshotsDeleted: results[2].count,
    rankTrackingDeleted: results[3].count,
  };
}

export default db;
