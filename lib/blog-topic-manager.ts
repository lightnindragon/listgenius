/**
 * Blog Topic Manager
 * Handles category rotation, keyword selection, and topic diversity
 */

import { BLOG_AUTOMATION_CONFIG, BlogCategory, InternalLink } from '@/lib/blog-automation-config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TopicPackage {
  primaryKeyword: string;
  secondaryKeywords: string[];
  category: BlogCategory;
  suggestedListGeniusLink: InternalLink;
}

export class BlogTopicManager {
  private static instance: BlogTopicManager;
  
  private constructor() {}
  
  public static getInstance(): BlogTopicManager {
    if (!BlogTopicManager.instance) {
      BlogTopicManager.instance = new BlogTopicManager();
    }
    return BlogTopicManager.instance;
  }

  /**
   * Get the next category to use based on recent post distribution
   */
  public async getNextCategory(): Promise<BlogCategory> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get category distribution from last 30 days
    const categoryCounts = await prisma.blogPost.groupBy({
      by: ['category'],
      where: {
        publishedAt: {
          gte: thirtyDaysAgo
        },
        autoPublished: true
      },
      _count: {
        category: true
      }
    });

    const totalPosts = categoryCounts.reduce((sum, cat) => sum + cat._count.category, 0);
    const categoryDistribution: Record<string, number> = {};
    
    categoryCounts.forEach(cat => {
      if (cat.category) {
        categoryDistribution[cat.category] = (cat._count.category / totalPosts) * 100;
      }
    });

    // Find categories that are under the 40% threshold
    const availableCategories = BLOG_AUTOMATION_CONFIG.CATEGORIES.filter(category => {
      const percentage = categoryDistribution[category] || 0;
      return percentage < BLOG_AUTOMATION_CONFIG.MAX_CATEGORY_PERCENTAGE;
    });

    // If all categories are over threshold, use the least used one
    if (availableCategories.length === 0) {
      const leastUsedCategory = BLOG_AUTOMATION_CONFIG.CATEGORIES.reduce((least, current) => {
        const currentPercentage = categoryDistribution[current] || 0;
        const leastPercentage = categoryDistribution[least] || 0;
        return currentPercentage < leastPercentage ? current : least;
      });
      return leastUsedCategory as BlogCategory;
    }

    // Return a random category from available ones
    const randomIndex = Math.floor(Math.random() * availableCategories.length);
    return availableCategories[randomIndex] as BlogCategory;
  }

  /**
   * Check if a keyword has been used recently
   */
  public async isKeywordRecentlyUsed(keyword: string): Promise<boolean> {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - BLOG_AUTOMATION_CONFIG.MIN_DAYS_BETWEEN_DUPLICATE_KEYWORDS);

    const existingPost = await prisma.blogPost.findFirst({
      where: {
        OR: [
          { aiGeneratedTopicKeyword: { contains: keyword, mode: 'insensitive' } },
          { title: { contains: keyword, mode: 'insensitive' } },
          { seoKeywords: { has: keyword } }
        ],
        publishedAt: {
          gte: sixtyDaysAgo
        }
      }
    });

    return !!existingPost;
  }

  /**
   * Filter keywords to remove blacklisted terms and recently used ones
   */
  public async filterKeywords(keywords: string[]): Promise<string[]> {
    const filteredKeywords: string[] = [];

    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase();
      
      // Check if keyword contains blacklisted terms
      const isBlacklisted = BLOG_AUTOMATION_CONFIG.TOPIC_BLACKLIST.some(blacklisted => 
        lowerKeyword.includes(blacklisted.toLowerCase())
      );

      if (isBlacklisted) {
        continue;
      }

      // Check if keyword was recently used
      const recentlyUsed = await this.isKeywordRecentlyUsed(keyword);
      if (recentlyUsed) {
        continue;
      }

      filteredKeywords.push(keyword);
    }

    return filteredKeywords;
  }

  /**
   * Generate secondary keywords based on primary keyword and category
   */
  public generateSecondaryKeywords(primaryKeyword: string, category: BlogCategory): string[] {
    const baseKeywords = [
      'etsy seller',
      'etsy shop',
      'etsy business',
      'etsy optimization',
      'etsy marketing',
      'etsy seo',
      'etsy listing',
      'etsy sales'
    ];

    const categoryKeywords: Record<BlogCategory, string[]> = {
      'Etsy SEO for sellers': [
        'etsy keyword research',
        'etsy search optimization',
        'etsy algorithm',
        'etsy ranking',
        'etsy search visibility'
      ],
      'Listing optimization': [
        'etsy listing optimization',
        'etsy title optimization',
        'etsy description writing',
        'etsy tags optimization',
        'etsy photos'
      ],
      'Etsy shop management': [
        'etsy shop setup',
        'etsy policies',
        'etsy customer service',
        'etsy analytics',
        'etsy shop optimization'
      ],
      'Etsy marketing strategies': [
        'etsy social media',
        'etsy promotions',
        'etsy ads',
        'etsy email marketing',
        'etsy marketing'
      ],
      'Etsy trends & seasonal prep': [
        'etsy seasonal trends',
        'etsy holiday prep',
        'etsy trending products',
        'etsy seasonal marketing',
        'etsy holiday sales'
      ],
      'Etsy tools & automation': [
        'etsy automation',
        'etsy tools',
        'etsy listing tools',
        'etsy productivity',
        'etsy software'
      ],
      'Etsy business growth': [
        'etsy business growth',
        'etsy scaling',
        'etsy pricing strategy',
        'etsy profits',
        'etsy success'
      ]
    };

    const relevantKeywords = categoryKeywords[category] || [];
    const allKeywords = [...baseKeywords, ...relevantKeywords];
    
    // Remove duplicates and the primary keyword
    const uniqueKeywords = [...new Set(allKeywords)].filter(k => 
      k.toLowerCase() !== primaryKeyword.toLowerCase()
    );

    // Return 5-8 secondary keywords
    return uniqueKeywords.slice(0, 8);
  }

  /**
   * Get suggested ListGenius link based on category
   */
  public getSuggestedListGeniusLink(category: BlogCategory): InternalLink {
    const linkMap: Record<BlogCategory, InternalLink> = {
      'Etsy SEO for sellers': {
        url: '/app/keyword-research',
        anchor: 'keyword research tool',
        context: 'Use our keyword research tool to find high-performing terms'
      },
      'Listing optimization': {
        url: '/app/generator',
        anchor: 'listing generator',
        context: 'Try our automated listing generator for optimized content'
      },
      'Etsy shop management': {
        url: '/app/tools',
        anchor: 'SEO tools dashboard',
        context: 'Access our comprehensive SEO tools dashboard'
      },
      'Etsy marketing strategies': {
        url: '/app/tools',
        anchor: 'marketing tools',
        context: 'Explore our marketing optimization tools'
      },
      'Etsy trends & seasonal prep': {
        url: '/app/keyword-research',
        anchor: 'trending keywords tool',
        context: 'Discover trending keywords with our research tool'
      },
      'Etsy tools & automation': {
        url: '/app/generator',
        anchor: 'automation platform',
        context: 'Streamline your workflow with our automation platform'
      },
      'Etsy business growth': {
        url: '/pricing',
        anchor: 'business plans',
        context: 'Scale your business with our advanced features'
      }
    };

    return linkMap[category];
  }

  /**
   * Generate a complete topic package
   */
  public async generateTopicPackage(trendingKeywords: string[]): Promise<TopicPackage | null> {
    try {
      // Filter keywords
      const filteredKeywords = await this.filterKeywords(trendingKeywords);
      
      if (filteredKeywords.length === 0) {
        return null;
      }

      // Get next category
      const category = await this.getNextCategory();

      // Select primary keyword (first available)
      const primaryKeyword = filteredKeywords[0];

      // Generate secondary keywords
      const secondaryKeywords = this.generateSecondaryKeywords(primaryKeyword, category);

      // Get suggested ListGenius link
      const suggestedListGeniusLink = this.getSuggestedListGeniusLink(category);

      return {
        primaryKeyword,
        secondaryKeywords,
        category,
        suggestedListGeniusLink
      };
    } catch (error) {
      console.error('Error generating topic package:', error);
      return null;
    }
  }
}

export const blogTopicManager = BlogTopicManager.getInstance();
