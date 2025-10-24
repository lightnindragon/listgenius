/**
 * CSV Export/Import Handler
 * Handle CSV operations for keywords and listings
 */

import { logger } from './logger';
import { db } from './db';
import Papa from 'papaparse';

export interface KeywordExportData {
  keyword: string;
  demand: number;
  competition: number;
  seasonality: number;
  opportunity: number;
  difficulty: number;
  overallScore: number;
  activeListings: number;
  page1ShopConc: number;
  titleExactRate: number;
  trackedAt: string;
}

export interface ListingExportData {
  listingId: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  tags: string;
  materials: string;
  category: string;
  views: number;
  favorites: number;
  state: string;
  createdAt: string;
  lastModified: string;
  images: number;
}

export interface KeywordImportData {
  keyword: string;
  demand?: number;
  competition?: number;
  seasonality?: number;
  opportunity?: number;
  difficulty?: number;
}

export interface ListingImportData {
  title: string;
  description: string;
  price?: number;
  currency?: string;
  tags?: string;
  materials?: string;
  category?: string;
  state?: string;
}

export class CSVHandler {
  /**
   * Export keywords to CSV
   */
  async exportKeywords(
    userId: string,
    keywords: string[],
    includeMetrics: boolean = true
  ): Promise<string> {
    try {
      const exportData: KeywordExportData[] = [];

      for (const keyword of keywords) {
        try {
          // Get keyword record
          const keywordRecord = await db.keyword.findUnique({
            where: { term: keyword },
            include: {
              metrics: {
                orderBy: { date: 'desc' },
                take: 1,
              },
            },
          });

          if (keywordRecord && keywordRecord.metrics.length > 0) {
            const metrics = keywordRecord.metrics[0];
            
            exportData.push({
              keyword: keywordRecord.term,
              demand: metrics.demand || 0,
              competition: metrics.competition || 0,
              seasonality: metrics.seasonality || 0,
              opportunity: metrics.opportunity || 0,
              difficulty: metrics.difficulty || 0,
              overallScore: this.calculateOverallScore(metrics),
              activeListings: metrics.activeListings || 0,
              page1ShopConc: metrics.page1ShopConc || 0,
              titleExactRate: metrics.titleExactRate || 0,
              trackedAt: metrics.date.toISOString(),
            });
          } else {
            // Add basic data even without metrics
            exportData.push({
              keyword,
              demand: 0,
              competition: 0,
              seasonality: 0,
              opportunity: 0,
              difficulty: 0,
              overallScore: 0,
              activeListings: 0,
              page1ShopConc: 0,
              titleExactRate: 0,
              trackedAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          logger.warn('Failed to export keyword data', { keyword, error });
        }
      }

      // Convert to CSV
      const csv = Papa.unparse(exportData, {
        header: true,
        delimiter: ',',
      });

      logger.info('Keywords exported to CSV', {
        userId,
        keywordCount: keywords.length,
        exportedCount: exportData.length,
      });

      return csv;
    } catch (error) {
      logger.error('Failed to export keywords', { error });
      throw error;
    }
  }

  /**
   * Export listings to CSV
   */
  async exportListings(userId: string, listingIds: number[]): Promise<string> {
    try {
      const exportData: ListingExportData[] = [];

      // This would typically fetch from Etsy API or local cache
      // For now, we'll create mock data structure
      for (const listingId of listingIds) {
        try {
          // Mock listing data - in real implementation, fetch from Etsy
          const mockListing = {
            listingId,
            title: `Listing ${listingId}`,
            description: `Description for listing ${listingId}`,
            price: Math.floor(Math.random() * 5000) + 1000,
            currency: 'USD',
            tags: 'handmade,unique,gift,artisan',
            materials: 'ceramic,clay,glaze',
            category: 'Home & Living',
            views: Math.floor(Math.random() * 1000) + 100,
            favorites: Math.floor(Math.random() * 50) + 5,
            state: 'active',
            createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            lastModified: new Date().toISOString(),
            images: Math.floor(Math.random() * 10) + 1,
          };

          exportData.push(mockListing);
        } catch (error) {
          logger.warn('Failed to export listing data', { listingId, error });
        }
      }

      // Convert to CSV
      const csv = Papa.unparse(exportData, {
        header: true,
        delimiter: ',',
      });

      logger.info('Listings exported to CSV', {
        userId,
        listingCount: listingIds.length,
        exportedCount: exportData.length,
      });

      return csv;
    } catch (error) {
      logger.error('Failed to export listings', { error });
      throw error;
    }
  }

  /**
   * Import keywords from CSV
   */
  async importKeywords(
    userId: string,
    csvContent: string
  ): Promise<{
    imported: number;
    errors: Array<{ row: number; error: string }>;
    keywords: string[];
  }> {
    try {
      const results = Papa.parse<KeywordImportData>(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      });

      const imported: string[] = [];
      const errors: Array<{ row: number; error: string }> = [];

      for (let i = 0; i < results.data.length; i++) {
        const row = results.data[i];
        
        try {
          if (!row.keyword || typeof row.keyword !== 'string') {
            errors.push({
              row: i + 2, // +2 because of header and 0-based index
              error: 'Missing or invalid keyword',
            });
            continue;
          }

          const keyword = row.keyword.trim();
          
          if (keyword.length === 0 || keyword.length > 100) {
            errors.push({
              row: i + 2,
              error: 'Invalid keyword length',
            });
            continue;
          }

          // Create or update keyword record
          await db.keyword.upsert({
            where: { term: keyword },
            update: {
              updatedAt: new Date(),
            },
            create: {
              term: keyword,
              language: 'en-US',
            },
          });

          // If metrics are provided, store them
          if (row.demand || row.competition || row.seasonality || row.opportunity || row.difficulty) {
            const keywordRecord = await db.keyword.findUnique({
              where: { term: keyword },
            });

            if (keywordRecord) {
              await db.keywordMetricsDaily.upsert({
                where: {
                  keywordId_date: {
                    keywordId: keywordRecord.id,
                    date: new Date(),
                  },
                },
                update: {
                  demand: row.demand,
                  competition: row.competition,
                  seasonality: row.seasonality,
                  opportunity: row.opportunity,
                  difficulty: row.difficulty,
                },
                create: {
                  keywordId: keywordRecord.id,
                  date: new Date(),
                  demand: row.demand,
                  competition: row.competition,
                  seasonality: row.seasonality,
                  opportunity: row.opportunity,
                  difficulty: row.difficulty,
                },
              });
            }
          }

          imported.push(keyword);
        } catch (error) {
          errors.push({
            row: i + 2,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      logger.info('Keywords imported from CSV', {
        userId,
        totalRows: results.data.length,
        imported: imported.length,
        errors: errors.length,
      });

      return {
        imported: imported.length,
        errors,
        keywords: imported,
      };
    } catch (error) {
      logger.error('Failed to import keywords', { error });
      throw error;
    }
  }

  /**
   * Import listings from CSV
   */
  async importListings(
    userId: string,
    csvContent: string
  ): Promise<{
    imported: number;
    errors: Array<{ row: number; error: string }>;
    listings: ListingImportData[];
  }> {
    try {
      const results = Papa.parse<ListingImportData>(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      });

      const imported: ListingImportData[] = [];
      const errors: Array<{ row: number; error: string }> = [];

      for (let i = 0; i < results.data.length; i++) {
        const row = results.data[i];
        
        try {
          if (!row.title || typeof row.title !== 'string') {
            errors.push({
              row: i + 2,
              error: 'Missing or invalid title',
            });
            continue;
          }

          if (!row.description || typeof row.description !== 'string') {
            errors.push({
              row: i + 2,
              error: 'Missing or invalid description',
            });
            continue;
          }

          // Validate price if provided
          if (row.price && (isNaN(Number(row.price)) || Number(row.price) < 0)) {
            errors.push({
              row: i + 2,
              error: 'Invalid price',
            });
            continue;
          }

          // Validate tags if provided
          if (row.tags && typeof row.tags !== 'string') {
            errors.push({
              row: i + 2,
              error: 'Invalid tags format',
            });
            continue;
          }

          imported.push({
            title: row.title.trim(),
            description: row.description.trim(),
            price: row.price ? Number(row.price) : undefined,
            currency: row.currency || 'USD',
            tags: row.tags,
            materials: row.materials,
            category: row.category,
            state: row.state || 'draft',
          });
        } catch (error) {
          errors.push({
            row: i + 2,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      logger.info('Listings imported from CSV', {
        userId,
        totalRows: results.data.length,
        imported: imported.length,
        errors: errors.length,
      });

      return {
        imported: imported.length,
        errors,
        listings: imported,
      };
    } catch (error) {
      logger.error('Failed to import listings', { error });
      throw error;
    }
  }

  /**
   * Get CSV template for keywords
   */
  getKeywordTemplate(): string {
    const template: KeywordImportData[] = [
      {
        keyword: 'handmade jewelry',
        demand: 75,
        competition: 60,
        seasonality: 45,
        opportunity: 70,
        difficulty: 65,
      },
      {
        keyword: 'vintage clothing',
        demand: 80,
        competition: 70,
        seasonality: 50,
        opportunity: 65,
        difficulty: 75,
      },
    ];

    return Papa.unparse(template, {
      header: true,
      delimiter: ',',
    });
  }

  /**
   * Get CSV template for listings
   */
  getListingTemplate(): string {
    const template: ListingImportData[] = [
      {
        title: 'Handmade Ceramic Coffee Mug',
        description: 'Beautiful handmade ceramic coffee mug with a stunning blue glaze. Perfect for your morning coffee or tea.',
        price: 24.99,
        currency: 'USD',
        tags: 'handmade,ceramic,coffee mug,blue glaze,unique',
        materials: 'ceramic clay,blue glaze,kiln fired',
        category: 'Home & Living',
        state: 'draft',
      },
      {
        title: 'Vintage Style Wooden Cutting Board',
        description: 'Handcrafted wooden cutting board made from reclaimed oak. Perfect for your kitchen or as a gift.',
        price: 35.00,
        currency: 'USD',
        tags: 'wooden,cutting board,vintage,oak,handcrafted',
        materials: 'reclaimed oak,mineral oil',
        category: 'Home & Living',
        state: 'draft',
      },
    ];

    return Papa.unparse(template, {
      header: true,
      delimiter: ',',
    });
  }

  /**
   * Calculate overall score from metrics
   */
  private calculateOverallScore(metrics: any): number {
    const weights = {
      demand: 0.25,
      competition: 0.20,
      seasonality: 0.15,
      opportunity: 0.30,
      difficulty: 0.10,
    };

    return Math.round(
      (metrics.demand || 0) * weights.demand +
      (metrics.competition || 0) * weights.competition +
      (metrics.seasonality || 0) * weights.seasonality +
      (metrics.opportunity || 0) * weights.opportunity +
      (metrics.difficulty || 0) * weights.difficulty
    );
  }
}
