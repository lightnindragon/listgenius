/**
 * Blog Automation Configuration
 * Defines safety limits, SEO requirements, and automation settings
 */

export const BLOG_AUTOMATION_CONFIG = {
  // Quality thresholds
  MIN_QUALITY_SCORE: 75, // Minimum score to auto-publish
  MAX_REVISION_ATTEMPTS: 3, // Max times to revise content
  MIN_WORD_COUNT: 1000, // Minimum content length
  MAX_WORD_COUNT: 1800, // Maximum content length
  
  // SEO requirements
  MIN_KEYWORD_DENSITY: 1.0, // Minimum primary keyword density %
  MAX_KEYWORD_DENSITY: 2.5, // Maximum primary keyword density %
  REQUIRED_FIELDS: [
    'title',
    'slug', 
    'excerpt',
    'content',
    'seoTitle',
    'seoDescription',
    'seoKeywords',
    'tags',
    'category'
  ],
  
  // Content requirements
  TITLE_MIN_LENGTH: 50,
  TITLE_MAX_LENGTH: 60,
  SLUG_MAX_LENGTH: 60,
  EXCERPT_MIN_LENGTH: 150,
  EXCERPT_MAX_LENGTH: 160,
  SEO_TITLE_MIN_LENGTH: 55,
  SEO_TITLE_MAX_LENGTH: 60,
  SEO_DESCRIPTION_MIN_LENGTH: 150,
  SEO_DESCRIPTION_MAX_LENGTH: 160,
  MIN_TAGS: 5,
  MAX_TAGS: 8,
  MIN_SEO_KEYWORDS: 8,
  MAX_SEO_KEYWORDS: 12,
  MIN_INTERNAL_LINKS: 2,
  MAX_INTERNAL_LINKS: 3,
  
  // Category rotation
  CATEGORIES: [
    'Etsy SEO for sellers',
    'Listing optimization', 
    'Etsy shop management',
    'Etsy marketing strategies',
    'Etsy trends & seasonal prep',
    'Etsy tools & automation',
    'Etsy business growth'
  ],
  MAX_CATEGORY_PERCENTAGE: 40, // Max % of posts from one category in 30 days
  
  // Internal linking rules
  ALLOWED_INTERNAL_LINKS: [
    '/app/generator',
    '/app/keyword-research', 
    '/app/tools',
    '/pricing',
    '/app'
  ],
  FORBIDDEN_LINKS: [
    '/adm1n796',
    '/api',
    '/sign-in',
    '/sign-up'
  ],
  
  // Topic management
  TOPIC_BLACKLIST: [
    'etsy buyer',
    'etsy shopping',
    'etsy customer',
    'etsy purchase',
    'etsy order',
    'etsy review',
    'etsy feedback'
  ],
  MIN_DAYS_BETWEEN_DUPLICATE_KEYWORDS: 60,
  
  // Automation settings
  DAILY_POST_LIMIT: 1,
  CRON_SCHEDULE: '0 8 * * *', // 8 AM UTC daily
  FALLBACK_SAVE_AS_DRAFT: true,
  
  // Quality scoring weights
  QUALITY_WEIGHTS: {
    SEO_COMPLETENESS: 40, // All fields present and formatted
    KEYWORD_OPTIMIZATION: 30, // Keyword density and placement
    CONTENT_QUALITY: 20, // Readability, structure, value
    INTERNAL_LINKING: 10 // Natural, relevant links
  },
  
  // Content generation settings
  TARGET_AUDIENCE: 'Etsy sellers (shop owners, creators, entrepreneurs)',
  TONE: 'Professional, helpful, empowering (NOT promotional)',
  MIN_HEADINGS: 4, // Minimum H2 sections
  MAX_HEADINGS: 6, // Maximum H2 sections
  MIN_READABILITY_SCORE: 60, // Flesch reading ease
  
  // Error handling
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000,
  TIMEOUT_MS: 30000, // 30 seconds for AI generation
} as const;

export type BlogCategory = typeof BLOG_AUTOMATION_CONFIG.CATEGORIES[number];
export type WorkflowStatus = 
  | 'draft'
  | 'pending_generation'
  | 'generated'
  | 'quality_check'
  | 'needs_revision'
  | 'approved'
  | 'published'
  | 'failed';

export interface InternalLink {
  url: string;
  anchor: string;
  context: string;
}

export interface QualityFeedback {
  seo: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  keywords: {
    score: number;
    density: number;
    placement: string[];
    suggestions: string[];
  };
  content: {
    score: number;
    readability: number;
    structure: string[];
    suggestions: string[];
  };
  links: {
    score: number;
    count: number;
    quality: string[];
    suggestions: string[];
  };
}

export interface BlogGenerationInput {
  primaryKeyword: string;
  secondaryKeywords: string[];
  category: BlogCategory;
  internalLinkSuggestions: InternalLink[];
}

export interface BlogGenerationOutput {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  tags: string[];
  category: BlogCategory;
  featuredImage: string;
  internalLinks: InternalLink[];
  targetKeywordDensity: number;
}
