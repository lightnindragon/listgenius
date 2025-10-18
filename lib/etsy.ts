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
      throw new EtsyAPIError('Missing Etsy OAuth configuration', 500);
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
      throw new EtsyAPIError('Missing Etsy OAuth configuration', 500);
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
        `Token exchange failed: ${error.response?.data?.error_description || error.message}`,
        error.response?.status || 500
      );
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new EtsyAPIError('No refresh token available', 401);
    }

    const clientId = process.env.ETSY_CLIENT_ID;
    const clientSecret = process.env.ETSY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new EtsyAPIError('Missing Etsy OAuth configuration', 500);
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

      return this.accessToken;
    } catch (error: any) {
      logger.error('Failed to refresh access token', { 
        isSandbox: this.isSandbox, 
        error: error.message,
        status: error.response?.status 
      });
      throw new EtsyAPIError(
        `Token refresh failed: ${error.response?.data?.error_description || error.message}`,
        error.response?.status || 500
      );
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, data?: any) {
    if (!this.accessToken) {
      throw new EtsyAPIError('No access token available', 401);
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
        error.response?.status || 500
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
   * Get shop listings
   */
  async getShopListings(limit: number = 100, offset: number = 0): Promise<any> {
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
      throw new EtsyAPIError('No access token available', 401);
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
        error.response?.status || 500
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
