import axios from 'axios';
import { logger } from './logger';
import { EtsyAPIError } from './errors';

// Etsy API configuration with sandbox mode support
export class EtsyClient {
  private baseURL: string;
  private isSandbox: boolean;
  private accessToken?: string;
  private refreshToken?: string;

  constructor(accessToken?: string, refreshToken?: string) {
    this.isSandbox = process.env.ETSY_SANDBOX_MODE === "true";
    this.baseURL = this.isSandbox
      ? "https://sandbox.openapi.etsy.com/v3/application"
      : (process.env.ETSY_API_BASE || "https://openapi.etsy.com/v3");
    
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    logger.info('EtsyClient initialized', { 
      isSandbox: this.isSandbox, 
      baseURL: this.baseURL 
    });
  }

  /**
   * Generate OAuth authorization URL
   */
  static getAuthorizationUrl(): string {
    const isSandbox = process.env.ETSY_SANDBOX_MODE === "true";
    const redirectUri = process.env.ETSY_REDIRECT_URI;
    const clientId = process.env.ETSY_CLIENT_ID;

    if (!redirectUri || !clientId) {
      throw new EtsyAPIError('Missing Etsy OAuth configuration');
    }

    const authUrl = `https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=listings_r%20listings_w%20shops_r&client_id=${clientId}`;
    
    logger.info('Generated Etsy authorization URL', { 
      isSandbox, 
      authUrl: authUrl.replace(/client_id=[^&]+/, 'client_id=***') 
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }> {
    const isSandbox = process.env.ETSY_SANDBOX_MODE === "true";
    const clientId = process.env.ETSY_CLIENT_ID;
    const clientSecret = process.env.ETSY_CLIENT_SECRET;
    const redirectUri = process.env.ETSY_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new EtsyAPIError('Missing Etsy OAuth configuration');
    }

    try {
      const response = await axios.post(
        'https://api.etsy.com/v3/public/oauth/token',
        {
          grant_type: 'authorization_code',
          client_id: clientId,
          redirect_uri: redirectUri,
          code: code,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          auth: {
            username: clientId,
            password: clientSecret,
          },
        }
      );

      logger.info('Successfully exchanged code for token', { 
        isSandbox,
        tokenType: response.data.token_type 
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to exchange code for token', { 
        isSandbox, 
        error: error.message,
        status: error.response?.status 
      });
      throw new EtsyAPIError(
        `Token exchange failed: ${error.response?.data?.error_description || error.message}`
      );
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new EtsyAPIError('No refresh token available');
    }

    const clientId = process.env.ETSY_CLIENT_ID;
    const clientSecret = process.env.ETSY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new EtsyAPIError('Missing Etsy OAuth configuration');
    }

    try {
      const response = await axios.post(
        'https://api.etsy.com/v3/public/oauth/token',
        {
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          auth: {
            username: clientId,
            password: clientSecret,
          },
        }
      );

      this.accessToken = response.data.access_token;
      if (response.data.refresh_token) {
        this.refreshToken = response.data.refresh_token;
      }

      logger.info('Successfully refreshed access token', { 
        isSandbox: this.isSandbox 
      });

      if (!this.accessToken) {
        throw new EtsyAPIError('Failed to get access token from refresh response');
      }
      return this.accessToken;
    } catch (error: any) {
      logger.error('Failed to refresh access token', { 
        isSandbox: this.isSandbox, 
        error: error.message,
        status: error.response?.status 
      });
      throw new EtsyAPIError(
        `Token refresh failed: ${error.response?.data?.error_description || error.message}`
      );
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, data?: any) {
    if (!this.accessToken) {
      throw new EtsyAPIError('No access token available');
    }

    try {
      const response = await axios({
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        data,
      });

      return response.data;
    } catch (error: any) {
      // If token expired, try to refresh and retry once
      if (error.response?.status === 401 && this.refreshToken) {
        logger.info('Token expired, attempting refresh', { isSandbox: this.isSandbox });
        await this.refreshAccessToken();
        
        // Retry the request
        const response = await axios({
          method,
          url: `${this.baseURL}${endpoint}`,
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          data,
        });
        
        return response.data;
      }

      logger.error('Etsy API request failed', { 
        isSandbox: this.isSandbox,
        method,
        endpoint,
        error: error.message,
        status: error.response?.status 
      });

      throw new EtsyAPIError(
        `Etsy API request failed: ${error.response?.data?.error || error.message}`,
      );
    }
  }

  /**
   * Get shop information
   */
  async getShopInfo(): Promise<any> {
    return this.makeRequest('GET', '/shops/__SELF__');
  }

  /**
   * Get my shop listings
   */
  async getMyShopListings(limit: number = 100, offset: number = 0): Promise<any> {
    return this.makeRequest('GET', `/shops/__SELF__/listings/active?limit=${limit}&offset=${offset}`);
  }

  /**
   * Get specific listing
   */
  async getListing(listingId: number): Promise<any> {
    return this.makeRequest('GET', `/listings/${listingId}`);
  }

  /**
   * Update listing
   */
  async updateListing(listingId: number, updates: any): Promise<any> {
    return this.makeRequest('PUT', `/shops/__SELF__/listings/${listingId}`, updates);
  }

  /**
   * Upload listing image
   */
  async uploadListingImage(listingId: number, imageFile: File): Promise<any> {
    const formData = new FormData();
    formData.append('image', imageFile);

    if (!this.accessToken) {
      throw new EtsyAPIError('No access token available');
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/shops/__SELF__/listings/${listingId}/images`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Failed to upload listing image', { 
        isSandbox: this.isSandbox,
        listingId,
        error: error.message,
        status: error.response?.status 
      });
      throw new EtsyAPIError(
        `Image upload failed: ${error.response?.data?.error || error.message}`,
      );
    }
  }

  /**
   * Delete listing image
   */
  async deleteListingImage(listingId: number, imageId: number): Promise<any> {
    return this.makeRequest('DELETE', `/shops/__SELF__/listings/${listingId}/images/${imageId}`);
  }

  /**
   * Create a new listing
   */
  async createListing(listingData: any): Promise<any> {
    return this.makeRequest('POST', '/shops/__SELF__/listings', listingData);
  }

  /**
   * Get all images for my listing
   */
  async getMyListingImages(listingId: number): Promise<any> {
    return this.makeRequest('GET', `/shops/__SELF__/listings/${listingId}/images`);
  }

  /**
   * Reorder listing images
   */
  async reorderListingImages(listingId: number, imageIds: number[]): Promise<any> {
    return this.makeRequest('PUT', `/shops/__SELF__/listings/${listingId}/images`, {
      image_ids: imageIds
    });
  }

  /**
   * Update listing image (alt text, rank)
   */
  async updateListingImage(listingId: number, imageId: number, data: any): Promise<any> {
    return this.makeRequest('PUT', `/shops/__SELF__/listings/${listingId}/images/${imageId}`, data);
  }

  /**
   * Upload video to listing
   */
  async uploadListingVideo(listingId: number, videoFile: File): Promise<any> {
    const formData = new FormData();
    formData.append('video', videoFile);

    if (!this.accessToken) {
      throw new EtsyAPIError('No access token available');
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/shops/__SELF__/listings/${listingId}/videos`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Failed to upload listing video', {
        isSandbox: this.isSandbox,
        listingId,
        error: error.message,
        status: error.response?.status
      });
      throw new EtsyAPIError(
        `Video upload failed: ${error.response?.data?.error || error.message}`,
      );
    }
  }

  /**
   * Get all videos for a listing
   */
  async getListingVideos(listingId: number): Promise<any> {
    return this.makeRequest('GET', `/shops/__SELF__/listings/${listingId}/videos`);
  }

  /**
   * Delete listing video
   */
  async deleteListingVideo(listingId: number, videoId: number): Promise<any> {
    return this.makeRequest('DELETE', `/shops/__SELF__/listings/${listingId}/videos/${videoId}`);
  }

  /**
   * Get my shop sections
   */
  async getMyShopSections(): Promise<any> {
    return this.makeRequest('GET', '/shops/__SELF__/sections');
  }

  /**
   * Get shipping profiles
   */
  async getShippingProfiles(): Promise<any> {
    return this.makeRequest('GET', '/shops/__SELF__/shipping-profiles');
  }

  /**
   * Get production partners
   */
  async getProductionPartners(): Promise<any> {
    return this.makeRequest('GET', '/shops/__SELF__/production-partners');
  }

  /**
   * Delete a listing
   */
  async deleteListing(listingId: number): Promise<any> {
    return this.makeRequest('DELETE', `/shops/__SELF__/listings/${listingId}`);
  }

  /**
   * Get listing inventory
   */
  async getListingInventory(listingId: number): Promise<any> {
    return this.makeRequest('GET', `/listings/${listingId}/inventory`);
  }

  /**
   * Update listing inventory
   */
  async updateListingInventory(listingId: number, inventoryData: any): Promise<any> {
    return this.makeRequest('PUT', `/listings/${listingId}/inventory`, inventoryData);
  }

  /**
   * Search listings by keyword (for keyword research)
   */
  async searchListings(keyword: string, options: {
    limit?: number;
    offset?: number;
    sort_on?: string;
    sort_order?: 'up' | 'down';
    min_price?: number;
    max_price?: number;
    category_id?: number;
  } = {}): Promise<any> {
    const params = new URLSearchParams({
      keywords: keyword,
      limit: (options.limit || 25).toString(),
      offset: (options.offset || 0).toString(),
      sort_on: options.sort_on || 'score',
      sort_order: options.sort_order || 'down',
    });

    if (options.min_price) params.append('min_price', options.min_price.toString());
    if (options.max_price) params.append('max_price', options.max_price.toString());
    if (options.category_id) params.append('category_id', options.category_id.toString());

    return this.makeRequest('GET', `/application/listings/active?${params.toString()}`);
  }

  /**
   * Get shop statistics
   */
  async getShopStats(shopId: number): Promise<any> {
    return this.makeRequest('GET', `/shops/${shopId}`);
  }

  /**
   * Get shop listings with pagination
   */
  async getShopListings(shopId: number, options: {
    limit?: number;
    offset?: number;
    state?: 'active' | 'inactive' | 'draft' | 'expired' | 'sold_out';
    sort_on?: string;
    sort_order?: 'up' | 'down';
  } = {}): Promise<any> {
    const params = new URLSearchParams({
      limit: (options.limit || 25).toString(),
      offset: (options.offset || 0).toString(),
    });

    if (options.state) params.append('state', options.state);
    if (options.sort_on) params.append('sort_on', options.sort_on);
    if (options.sort_order) params.append('sort_order', options.sort_order);

    return this.makeRequest('GET', `/shops/${shopId}/listings?${params.toString()}`);
  }

  /**
   * Get listing details for analysis
   */
  async getListingDetails(listingId: number): Promise<any> {
    return this.makeRequest('GET', `/listings/${listingId}`);
  }

  /**
   * Get listing images for analysis
   */
  async getListingImages(listingId: number): Promise<any> {
    return this.makeRequest('GET', `/listings/${listingId}/images`);
  }

  /**
   * Get shop sections for categorization
   */
  async getShopSections(shopId: number): Promise<any> {
    return this.makeRequest('GET', `/shops/${shopId}/sections`);
  }

  /**
   * Get category taxonomy
   */
  async getCategoryTaxonomy(): Promise<any> {
    return this.makeRequest('GET', '/application/categories/taxonomy');
  }

  /**
   * Get trending tags (if available)
   */
  async getTrendingTags(limit = 50): Promise<any> {
    // Note: This might not be available in all Etsy API versions
    // This is a placeholder for potential future functionality
    return this.makeRequest('GET', `/application/tags/trending?limit=${limit}`);
  }

  /**
   * Analyze keyword competition by searching and analyzing results
   */
  async analyzeKeywordCompetition(keyword: string): Promise<{
    totalResults: number;
    averagePrice: number;
    priceRange: { min: number; max: number };
    topShops: Array<{ shopId: number; shopName: string; listingCount: number }>;
    categoryDistribution: Array<{ categoryId: number; categoryName: string; count: number }>;
    averageListingAge: number;
  }> {
    try {
      const searchResults = await this.searchListings(keyword, { limit: 100 });
      
      if (!searchResults.results || searchResults.results.length === 0) {
        return {
          totalResults: 0,
          averagePrice: 0,
          priceRange: { min: 0, max: 0 },
          topShops: [],
          categoryDistribution: [],
          averageListingAge: 0,
        };
      }

      const listings = searchResults.results;
      
      // Calculate average price
      const prices = listings
        .map((listing: any) => listing.price?.amount || 0)
        .filter((price: number) => price > 0);
      
      const averagePrice = prices.length > 0 
        ? prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length
        : 0;

      // Calculate price range
      const priceRange = {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0,
      };

      // Analyze top shops
      const shopStats: { [key: number]: { shopName: string; listingCount: number } } = {};
      listings.forEach((listing: any) => {
        const shopId = listing.shop_id;
        if (shopStats[shopId]) {
          shopStats[shopId].listingCount++;
        } else {
          shopStats[shopId] = {
            shopName: listing.shop_name || 'Unknown Shop',
            listingCount: 1,
          };
        }
      });

      const topShops = Object.entries(shopStats)
        .map(([shopId, stats]) => ({
          shopId: parseInt(shopId),
          shopName: stats.shopName,
          listingCount: stats.listingCount,
        }))
        .sort((a, b) => b.listingCount - a.listingCount)
        .slice(0, 10);

      // Analyze category distribution
      const categoryStats: { [key: number]: { categoryName: string; count: number } } = {};
      listings.forEach((listing: any) => {
        const categoryId = listing.taxonomy_id;
        if (categoryId && categoryStats[categoryId]) {
          categoryStats[categoryId].count++;
        } else if (categoryId) {
          categoryStats[categoryId] = {
            categoryName: listing.taxonomy_path?.join(' > ') || 'Unknown Category',
            count: 1,
          };
        }
      });

      const categoryDistribution = Object.entries(categoryStats)
        .map(([categoryId, stats]) => ({
          categoryId: parseInt(categoryId),
          categoryName: stats.categoryName,
          count: stats.count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate average listing age
      const now = Date.now() / 1000;
      const ages = listings
        .map((listing: any) => now - (listing.creation_tsz || now))
        .filter((age: number) => age >= 0);
      
      const averageListingAge = ages.length > 0
        ? ages.reduce((sum: number, age: number) => sum + age, 0) / ages.length
        : 0;

      return {
        totalResults: searchResults.count || listings.length,
        averagePrice,
        priceRange,
        topShops,
        categoryDistribution,
        averageListingAge,
      };
    } catch (error) {
      logger.error('Failed to analyze keyword competition', {
        keyword,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new EtsyAPIError('Failed to analyze keyword competition');
    }
  }

  /**
   * Get shop performance metrics
   */
  async getShopPerformanceMetrics(shopId: number): Promise<{
    totalListings: number;
    activeListings: number;
    totalSales: number;
    averageRating: number;
    totalReviews: number;
    shopAge: number;
    topCategories: Array<{ categoryName: string; listingCount: number }>;
  }> {
    try {
      const [shopInfo, listings] = await Promise.all([
        this.getShopStats(shopId),
        this.getShopListings(shopId, { limit: 100, state: 'active' }),
      ]);

      const activeListings = listings.results?.length || 0;
      
      // Calculate average rating and total reviews
      let totalReviews = 0;
      let totalRating = 0;
      
      listings.results?.forEach((listing: any) => {
        if (listing.num_favorers) {
          totalReviews += listing.num_favorers;
        }
        // Note: Individual listing ratings might not be available in API
        // This would need to be calculated from review data if available
      });

      const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

      // Calculate shop age
      const shopAge = shopInfo.creation_timestamp 
        ? (Date.now() / 1000) - shopInfo.creation_timestamp
        : 0;

      // Analyze top categories
      const categoryStats: { [key: string]: number } = {};
      listings.results?.forEach((listing: any) => {
        const categoryName = listing.taxonomy_path?.join(' > ') || 'Unknown';
        categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1;
      });

      const topCategories = Object.entries(categoryStats)
        .map(([categoryName, listingCount]) => ({ categoryName, listingCount }))
        .sort((a, b) => b.listingCount - a.listingCount)
        .slice(0, 10);

      return {
        totalListings: shopInfo.listing_active_count || activeListings,
        activeListings,
        totalSales: shopInfo.num_favorers || 0, // This might not be sales data
        averageRating,
        totalReviews,
        shopAge,
        topCategories,
      };
    } catch (error) {
      logger.error('Failed to get shop performance metrics', {
        shopId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new EtsyAPIError('Failed to get shop performance metrics');
    }
  }

  /**
   * Get sandbox mode status
   */
  getSandboxMode(): boolean {
    return this.isSandbox;
  }

  /**
   * Get base URL being used
   */
  getBaseURL(): string {
    return this.baseURL;
  }
}

export default EtsyClient;
