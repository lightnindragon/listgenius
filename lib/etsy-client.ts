// Mock Etsy client for development
export interface EtsyClient {
  getShopData(shopId: string): Promise<any>;
  getListings(shopId: string): Promise<any>;
  getShopStats(shopId: string): Promise<any>;
}

export function getEtsyClient(): EtsyClient {
  return {
    async getShopData(shopId: string) {
      // Mock implementation
      return {
        shopId,
        shopName: `Mock Shop ${shopId}`,
        sales: Math.floor(Math.random() * 1000),
        revenue: Math.floor(Math.random() * 10000),
        listings: Math.floor(Math.random() * 100),
        favorites: Math.floor(Math.random() * 500),
      };
    },

    async getListings(shopId: string) {
      // Mock implementation
      return [];
    },

    async getShopStats(shopId: string) {
      // Mock implementation
      return {
        views: Math.floor(Math.random() * 5000),
        visits: Math.floor(Math.random() * 2000),
        conversionRate: Math.random() * 0.1,
        avgOrderValue: Math.floor(Math.random() * 100) + 20,
      };
    },
  };
}
