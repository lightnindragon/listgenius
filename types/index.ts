export interface ListingOutput {
  title: string;
  description: string;
  tags: string[]; // exactly 13
  materials: string[]; // exactly 13
  pinterestCaption?: string;
  etsyMessage?: string;
}

export interface UserMetadata {
  plan: 'free' | 'pro' | 'business' | 'agency';
  genUsage?: Record<string, number>; // monthKey -> count
  dailyGenCount: number; // keep for backward compat
  dailyRewriteCount: number;
  monthlyGenCount?: number; // current month's generation count
  lastResetDate: string; // ISO 8601 format (YYYY-MM-DD)
  preferences?: {
    tone?: string; // e.g., "Professional", "Casual", "Luxury"
    niche?: string;
    audience?: string;
  };
  etsyTokens?: string; // encrypted JSON string
  etsyShopId?: string;
  etsyRateLimitCount?: number; // track Etsy API calls
  etsyRateLimitReset?: string; // ISO timestamp for daily reset
}

export interface EtsyListing {
  listing_id: number;
  title: string;
  description: string;
  tags: string[];
  materials: string[];
  state: 'active' | 'draft' | 'inactive';
  url: string;
  images?: EtsyImage[];
  videos?: EtsyVideo[];
}

export interface EtsyImage {
  image_id: number;
  url_75x75: string;
  url_170x135: string;
  url_570xN: string;
  url_fullxfull: string;
  full_width: number;
  full_height: number;
  alt_text?: string;
  rank: number;
}

export interface EtsyVideo {
  video_id: number;
  listing_id: number;
  url: string;
  thumbnail_url: string;
  duration: number;
  width: number;
  height: number;
  file_size: number;
  creation_timestamp: number;
}

export interface PlanFeatures {
  generatePerDay?: number;
  generateUnlimited?: boolean;
  rewritePerDay?: number;
  rewriteUnlimited?: boolean;
  etsyPublish: boolean;
  bulkGenerate?: boolean;
  bulkPublish?: boolean;
  maxBulkSize?: number;
  history: boolean;
  tonePresets: boolean;
  multiShop?: boolean;
  seats?: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    wordCount?: number;
    generatedAt?: string;
    model?: string;
    tokensUsed?: number;
    warnings?: string[];
  };
}

export interface BulkJobResponse {
  jobId: string;
  status: 'completed' | 'processing' | 'failed';
  completed: number;
  total: number;
  results: ListingOutput[];
}

export interface GenerateRequest {
  productName: string;
  niche?: string;
  audience?: string;
  keywords: string[];
  tone?: string;
  extras?: {
    pinterestCaption?: boolean;
    etsyMessage?: boolean;
  };
}

export interface RewriteRequest {
  originalTitle: string;
  originalDescription: string;
  originalTags: string[];
  productName: string;
  niche?: string;
  audience?: string;
  keywords: string[];
  tone?: string;
}

// Admin Panel Types
export interface AdminSession {
  username: string;
  iat: number;
  exp: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'business' | 'agency';
  status: 'active' | 'suspended' | 'cancelled';
  loginCount: number;
  lastLoginAt: string;
  lifetimeGenerations: number;
  dailyGenCount: number;
  dailyRewriteCount: number;
  signUpDate: string;
  stripeCustomerId?: string;
  subscriptionStatus?: string;
  customQuota?: number;
}

export interface AdminAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByPlan: {
    free: number;
    pro: number;
    business: number;
    agency: number;
  };
  cancelledSubscriptions: number;
  totalGenerationsThisMonth: number;
  averageGenerationsPerUser: number;
  revenueThisMonth: number;
  userGrowthData: Array<{ date: string; count: number }>;
  generationTrends: Array<{ date: string; count: number }>;
}

export interface UserActivity {
  type: 'login' | 'generation' | 'page_view' | 'plan_change' | 'quota_reset';
  timestamp: string;
  details?: any;
  ip?: string;
}

export interface LoginHistory {
  timestamp: string;
  ip?: string;
  userAgent?: string;
}
