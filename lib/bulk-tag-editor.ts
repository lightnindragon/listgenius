/**
 * Bulk Tag Editor
 * Efficiently manage tags across multiple listings
 */

import { logger } from './logger';
import { db } from './db';
import { keywordCache } from './redis';

export interface BulkTagOperation {
  operationId: string;
  type: 'replace' | 'add' | 'remove' | 'reorder';
  listings: number[];
  tags: string[];
  searchTerm?: string;
  replaceWith?: string;
  newOrder?: string[];
  preview: BulkTagPreview;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  results?: BulkTagResult[];
}

export interface BulkTagPreview {
  totalListings: number;
  affectedListings: number;
  changes: Array<{
    listingId: number;
    listingTitle: string;
    currentTags: string[];
    newTags: string[];
    changes: Array<{
      action: 'add' | 'remove' | 'replace';
      tag: string;
      newTag?: string;
    }>;
  }>;
  summary: {
    tagsToAdd: number;
    tagsToRemove: number;
    tagsToReplace: number;
    totalChanges: number;
  };
}

export interface BulkTagResult {
  listingId: number;
  success: boolean;
  error?: string;
  changes: Array<{
    action: string;
    tag: string;
    newTag?: string;
  }>;
}

export interface TagAnalysis {
  totalTags: number;
  uniqueTags: number;
  mostUsedTags: Array<{ tag: string; count: number; listings: number[] }>;
  unusedTags: string[];
  duplicateTags: Array<{ tag: string; listings: number[] }>;
  tagPerformance: Array<{ tag: string; avgViews: number; avgSales: number }>;
  recommendations: string[];
}

export class BulkTagEditor {
  /**
   * Preview bulk tag operation
   */
  async previewOperation(
    type: 'replace' | 'add' | 'remove' | 'reorder',
    listings: number[],
    tags: string[],
    searchTerm?: string,
    replaceWith?: string,
    newOrder?: string[]
  ): Promise<BulkTagPreview> {
    try {
      // Get listings data
      const listingsData = await this.getListingsData(listings);
      
      const changes = [];
      let tagsToAdd = 0;
      let tagsToRemove = 0;
      let tagsToReplace = 0;

      for (const listing of listingsData) {
        const currentTags = listing.tags || [];
        let newTags = [...currentTags];
        const listingChanges: any[] = [];

        switch (type) {
          case 'replace':
            if (searchTerm && replaceWith) {
              const oldTags = newTags.filter(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
              newTags = newTags.map(tag => 
                tag.toLowerCase().includes(searchTerm.toLowerCase()) ? replaceWith : tag
              );
              
              oldTags.forEach(oldTag => {
                listingChanges.push({ action: 'replace' as const, tag: oldTag, newTag: replaceWith });
                tagsToReplace++;
              });
            }
            break;

          case 'add':
            tags.forEach(tag => {
              if (!newTags.includes(tag)) {
                newTags.push(tag);
                listingChanges.push({ action: 'add' as const, tag });
                tagsToAdd++;
              }
            });
            break;

          case 'remove':
            tags.forEach(tag => {
              const index = newTags.indexOf(tag);
              if (index > -1) {
                newTags.splice(index, 1);
                listingChanges.push({ action: 'remove' as const, tag });
                tagsToRemove++;
              }
            });
            break;

          case 'reorder':
            if (newOrder) {
              newTags = newOrder.filter(tag => currentTags.includes(tag));
              // Add any missing tags from current tags
              currentTags.forEach((tag: string) => {
                if (!newTags.includes(tag)) {
                  newTags.push(tag);
                }
              });
            }
            break;
        }

        if (listingChanges.length > 0) {
          changes.push({
            listingId: listing.listingId,
            listingTitle: listing.title,
            currentTags,
            newTags,
            changes: listingChanges,
          });
        }
      }

      const preview: BulkTagPreview = {
        totalListings: listings.length,
        affectedListings: changes.length,
        changes,
        summary: {
          tagsToAdd,
          tagsToRemove,
          tagsToReplace,
          totalChanges: tagsToAdd + tagsToRemove + tagsToReplace,
        },
      };

      logger.info('Bulk tag operation preview generated', { type, preview });

      return preview;
    } catch (error) {
      logger.error('Failed to preview bulk tag operation', { type, error });
      throw error;
    }
  }

  /**
   * Execute bulk tag operation
   */
  async executeOperation(
    type: 'replace' | 'add' | 'remove' | 'reorder',
    listings: number[],
    tags: string[],
    searchTerm?: string,
    replaceWith?: string,
    newOrder?: string[]
  ): Promise<BulkTagOperation> {
    try {
      const operationId = `bulk-tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create operation record
      const operation: BulkTagOperation = {
        operationId,
        type,
        listings,
        tags,
        searchTerm,
        replaceWith,
        newOrder,
        preview: await this.previewOperation(type, listings, tags, searchTerm, replaceWith, newOrder),
        status: 'processing',
        createdAt: new Date().toISOString(),
      };

      // Execute the operation
      const results: BulkTagResult[] = [];
      const listingsData = await this.getListingsData(listings);

      for (const listing of listingsData) {
        try {
          const result = await this.updateListingTags(listing, type, tags, searchTerm, replaceWith, newOrder);
          results.push(result);
        } catch (error) {
          results.push({
            listingId: listing.listingId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            changes: [],
          });
        }
      }

      // Update operation status
      operation.status = 'completed';
      operation.completedAt = new Date().toISOString();
      operation.results = results;

      logger.info('Bulk tag operation completed', { operationId, results });

      return operation;
    } catch (error) {
      logger.error('Failed to execute bulk tag operation', { type, error });
      throw error;
    }
  }

  /**
   * Analyze tags across listings
   */
  async analyzeTags(listings: number[]): Promise<TagAnalysis> {
    try {
      const listingsData = await this.getListingsData(listings);
      
      // Collect all tags
      const allTags: string[] = [];
      const tagUsage: { [key: string]: number[] } = {};
      const tagPerformance: { [key: string]: { views: number[]; sales: number[] } } = {};

      listingsData.forEach(listing => {
        const tags = listing.tags || [];
        allTags.push(...tags);
        
        tags.forEach((tag: string) => {
          if (!tagUsage[tag]) {
            tagUsage[tag] = [];
          }
          tagUsage[tag].push(listing.listingId);
          
          if (!tagPerformance[tag]) {
            tagPerformance[tag] = { views: [], sales: [] };
          }
          tagPerformance[tag].views.push(listing.views || 0);
          tagPerformance[tag].sales.push(listing.sales || 0);
        });
      });

      // Calculate statistics
      const totalTags = allTags.length;
      const uniqueTags = Object.keys(tagUsage).length;
      
      // Most used tags
      const mostUsedTags = Object.entries(tagUsage)
        .map(([tag, listings]) => ({
          tag,
          count: allTags.filter(t => t === tag).length,
          listings,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      // Unused tags (tags that appear only once)
      const unusedTags = Object.entries(tagUsage)
        .filter(([_, listings]) => listings.length === 1)
        .map(([tag]) => tag);

      // Duplicate tags (tags that appear multiple times)
      const duplicateTags = Object.entries(tagUsage)
        .filter(([_, listings]) => listings.length > 1)
        .map(([tag, listings]) => ({ tag, listings }));

      // Tag performance
      const tagPerformanceData = Object.entries(tagPerformance).map(([tag, data]) => ({
        tag,
        avgViews: data.views.reduce((sum, views) => sum + views, 0) / data.views.length,
        avgSales: data.sales.reduce((sum, sales) => sum + sales, 0) / data.sales.length,
      }));

      // Generate recommendations
      const recommendations = this.generateTagRecommendations(mostUsedTags, unusedTags, duplicateTags, tagPerformanceData);

      const analysis: TagAnalysis = {
        totalTags,
        uniqueTags,
        mostUsedTags,
        unusedTags,
        duplicateTags,
        tagPerformance: tagPerformanceData,
        recommendations,
      };

      logger.info('Tag analysis completed', { analysis });

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze tags', { error });
      throw error;
    }
  }

  /**
   * Get suggested tags for a listing
   */
  async getSuggestedTags(listingId: number, listingData: any): Promise<string[]> {
    try {
      const suggestions: string[] = [];
      
      // Extract keywords from title and description
      const text = `${listingData.title} ${listingData.description}`.toLowerCase();
      const words = text.split(/\W+/).filter(word => word.length > 3);
      
      // Get common Etsy tags
      const commonTags = [
        'handmade', 'unique', 'custom', 'vintage', 'artisan', 'gift', 'personalized',
        'handcrafted', 'original', 'one of a kind', 'eco friendly', 'sustainable',
        'bohemian', 'minimalist', 'modern', 'rustic', 'elegant', 'chic', 'trendy'
      ];
      
      // Add relevant common tags
      commonTags.forEach(tag => {
        if (text.includes(tag) && !listingData.tags.includes(tag)) {
          suggestions.push(tag);
        }
      });
      
      // Add category-specific tags
      const categoryTags = this.getCategoryTags(listingData.category);
      categoryTags.forEach(tag => {
        if (!listingData.tags.includes(tag)) {
          suggestions.push(tag);
        }
      });
      
      // Add long-tail keyword suggestions
      const longTailSuggestions = this.generateLongTailKeywords(listingData.title, listingData.tags);
      suggestions.push(...longTailSuggestions);
      
      // Remove duplicates and limit to 10 suggestions
      return [...new Set(suggestions)].slice(0, 10);
    } catch (error) {
      logger.error('Failed to get suggested tags', { listingId, error });
      return [];
    }
  }

  /**
   * Helper methods
   */
  private async getListingsData(listings: number[]): Promise<any[]> {
    // Mock listings data - in real implementation, would query database
    return listings.map(id => ({
      listingId: id,
      title: `Sample Listing ${id}`,
      description: `Description for listing ${id}`,
      tags: ['handmade', 'unique', 'gift', 'artisan', 'custom'],
      views: Math.floor(Math.random() * 1000),
      sales: Math.floor(Math.random() * 100),
      category: 'Home & Living',
    }));
  }

  private async updateListingTags(
    listing: any,
    type: string,
    tags: string[],
    searchTerm?: string,
    replaceWith?: string,
    newOrder?: string[]
  ): Promise<BulkTagResult> {
    // Mock tag update - in real implementation, would update database
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      listingId: listing.listingId,
      success: true,
      changes: tags.map(tag => ({ action: type, tag })),
    };
  }

  private generateTagRecommendations(
    mostUsedTags: any[],
    unusedTags: string[],
    duplicateTags: any[],
    tagPerformance: any[]
  ): string[] {
    const recommendations = [];
    
    if (unusedTags.length > 5) {
      recommendations.push(`Consider removing ${unusedTags.length} unused tags to improve focus`);
    }
    
    if (duplicateTags.length > 0) {
      recommendations.push(`Consolidate ${duplicateTags.length} duplicate tags across listings`);
    }
    
    const lowPerformingTags = tagPerformance.filter(t => t.avgViews < 10);
    if (lowPerformingTags.length > 0) {
      recommendations.push(`Replace ${lowPerformingTags.length} low-performing tags with better alternatives`);
    }
    
    if (mostUsedTags.length < 10) {
      recommendations.push('Consider adding more consistent tags across your listings');
    }
    
    return recommendations;
  }

  private getCategoryTags(category: string): string[] {
    const categoryTagMap: { [key: string]: string[] } = {
      'Home & Living': ['home decor', 'interior design', 'home improvement', 'furniture'],
      'Jewelry': ['accessories', 'fashion', 'style', 'trendy'],
      'Art & Collectibles': ['art', 'creative', 'artistic', 'collectible'],
      'Clothing': ['fashion', 'style', 'apparel', 'wearable'],
      'Accessories': ['fashion', 'style', 'accessory', 'wearable'],
    };
    
    return categoryTagMap[category] || [];
  }

  private generateLongTailKeywords(title: string, existingTags: string[]): string[] {
    const suggestions = [];
    const words = title.toLowerCase().split(/\W+/).filter(word => word.length > 3);
    
    // Generate 2-word combinations
    for (let i = 0; i < words.length - 1; i++) {
      const combination = `${words[i]} ${words[i + 1]}`;
      if (!existingTags.includes(combination)) {
        suggestions.push(combination);
      }
    }
    
    // Generate 3-word combinations
    for (let i = 0; i < words.length - 2; i++) {
      const combination = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      if (!existingTags.includes(combination)) {
        suggestions.push(combination);
      }
    }
    
    return suggestions.slice(0, 5);
  }
}
