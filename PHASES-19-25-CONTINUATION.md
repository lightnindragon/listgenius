# ListGenius - Phases 19-25 Expanded (Continuation)

**This document continues from PHASES-18-25-EXPANDED.md**

---

## Phase 19: Multi-Channel Inventory Sync

### Overview
Synchronize inventory, orders, and listings across Etsy, Amazon, eBay, and Shopify. This prevents overselling, centralizes order management, and enables sellers to expand to multiple marketplaces while maintaining accurate inventory levels across all platforms.

### Business Context
- 67% of online sellers use multiple sales channels
- Overselling costs businesses an average of $300 per incident in fees and lost customer trust
- Manual inventory sync takes 2-4 hours/day for sellers on 3+ platforms
- Unified order management reduces fulfillment time by 40%
- Cross-platform listing increases sales by 180% on average

### Implementation Tasks

#### 1. Inventory Sync Engine
**File:** `lib/inventory-sync.ts`

**Purpose:** Core engine for real-time inventory synchronization across multiple platforms

**Key Interfaces:**
```typescript
export interface InventoryItem {
  id: string;
  sku: string;
  title: string;
  quantity: number;
  reserved: number; // Items in pending orders
  available: number; // quantity - reserved
  platforms: {
    [platform: string]: PlatformInventory;
  };
  lastSyncedAt: Date;
  syncStatus: 'synced' | 'syncing' | 'conflict' | 'error';
}

export interface PlatformInventory {
  platform: 'etsy' | 'amazon' | 'ebay' | 'shopify';
  platformId: string;
  listingUrl: string;
  quantity: number;
  price: number;
  lastUpdated: Date;
  syncEnabled: boolean;
}

export interface SyncConflict {
  itemId: string;
  sku: string;
  conflictType: 'quantity_mismatch' | 'price_mismatch' | 'sold_out';
  platforms: {
    platform: string;
    quantity: number;
    lastUpdated: Date;
  }[];
  suggestedResolution: 'use_lowest' | 'use_highest' | 'manual_review';
  autoResolvable: boolean;
}

export interface SyncOperation {
  id: string;
  itemId: string;
  action: 'update_quantity' | 'update_price' | 'create_listing' | 'delete_listing';
  targetPlatforms: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}
```

**Main Class Implementation:**
```typescript
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { EtsyConnector } from '@/lib/connectors/etsy-connector';
import { AmazonConnector } from '@/lib/connectors/amazon-connector';
import { EbayConnector } from '@/lib/connectors/ebay-connector';
import { ShopifyConnector } from '@/lib/connectors/shopify-connector';

export class InventorySyncEngine {
  private connectors: Map<string, any>;
  private syncQueue: string = 'inventory:sync:queue';
  private lockTTL: number = 30000; // 30 seconds

  constructor() {
    this.connectors = new Map([
      ['etsy', new EtsyConnector()],
      ['amazon', new AmazonConnector()],
      ['ebay', new EbayConnector()],
      ['shopify', new ShopifyConnector()]
    ]);
    logger.info('InventorySyncEngine initialized');
  }

  /**
   * Sync inventory item across all connected platforms
   */
  async syncItem(userId: string, itemId: string): Promise<SyncOperation> {
    const lockKey = `inventory:lock:${itemId}`;
    
    try {
      // Acquire lock to prevent concurrent syncs
      const lock = await this.acquireLock(lockKey);
      if (!lock) {
        throw new Error('Item is currently being synced. Please try again.');
      }

      // Get item from database
      const item = await this.getInventoryItem(userId, itemId);
      if (!item) {
        throw new Error('Inventory item not found');
      }

      // Create sync operation
      const operation = await this.createSyncOperation(item, 'update_quantity');

      // Get current quantities from all platforms
      const platformQuantities = await this.fetchPlatformQuantities(userId, item);

      // Detect conflicts
      const conflicts = this.detectConflicts(item, platformQuantities);
      
      if (conflicts.length > 0 && !conflicts[0].autoResolvable) {
        // Store conflicts for manual resolution
        await this.storeConflicts(userId, conflicts);
        throw new Error('Sync conflict detected. Manual review required.');
      }

      // Auto-resolve conflicts if possible
      const resolvedQuantity = this.autoResolveConflicts(conflicts, item);

      // Update quantity on all platforms
      const updateResults = await Promise.allSettled(
        Object.entries(item.platforms).map(async ([platform, platformData]) => {
          if (!platformData.syncEnabled) return null;
          
          const connector = this.connectors.get(platform);
          if (!connector) {
            logger.warn(`No connector found for platform: ${platform}`);
            return null;
          }

          return await connector.updateInventory(
            userId,
            platformData.platformId,
            resolvedQuantity
          );
        })
      );

      // Check for failures
      const failures = updateResults.filter(
        r => r.status === 'rejected'
      ) as PromiseRejectedResult[];

      if (failures.length > 0) {
        logger.error('Some platform updates failed:', failures);
        await this.updateSyncOperation(operation.id, 'failed', 
          `${failures.length} platform(s) failed to update`
        );
        throw new Error(`Failed to sync to ${failures.length} platform(s)`);
      }

      // Update database
      await this.updateInventoryItem(itemId, {
        quantity: resolvedQuantity,
        lastSyncedAt: new Date(),
        syncStatus: 'synced'
      });

      // Complete operation
      await this.updateSyncOperation(operation.id, 'completed');

      return operation;
    } catch (error: any) {
      logger.error(`Sync failed for item ${itemId}:`, error);
      throw error;
    } finally {
      // Release lock
      await this.releaseLock(lockKey);
    }
  }

  /**
   * Sync all inventory items for a user
   */
  async syncAllItems(userId: string): Promise<{
    success: number;
    failed: number;
    conflicts: number;
  }> {
    const items = await this.getUserInventoryItems(userId);
    const results = { success: 0, failed: 0, conflicts: 0 };

    // Queue all items for sync (processed by background worker)
    for (const item of items) {
      try {
        await redis.rpush(this.syncQueue, JSON.stringify({
          userId,
          itemId: item.id,
          timestamp: Date.now()
        }));
      } catch (error) {
        logger.error(`Failed to queue item ${item.id}:`, error);
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Handle order creation webhook from any platform
   */
  async handleOrderCreated(
    userId: string,
    platform: string,
    orderData: any
  ): Promise<void> {
    logger.info(`Processing order from ${platform}:`, orderData.id);

    try {
      // Extract line items and SKUs
      const lineItems = this.extractLineItems(platform, orderData);

      // Update inventory for each item
      for (const item of lineItems) {
        // Find inventory item by SKU
        const inventoryItem = await this.findItemBySku(userId, item.sku);
        
        if (!inventoryItem) {
          logger.warn(`SKU ${item.sku} not found in inventory`);
          continue;
        }

        // Decrease quantity
        const newQuantity = inventoryItem.quantity - item.quantity;
        
        if (newQuantity < 0) {
          logger.error(`Oversold! SKU: ${item.sku}, Quantity: ${newQuantity}`);
          // Send alert to user
          await this.sendOversoldAlert(userId, inventoryItem, item.quantity);
        }

        // Update inventory item
        await this.updateInventoryItem(inventoryItem.id, {
          quantity: Math.max(0, newQuantity),
          reserved: inventoryItem.reserved + item.quantity
        });

        // Sync to other platforms
        await this.syncItem(userId, inventoryItem.id);
      }

      // Store order in database
      await this.storeOrder(userId, platform, orderData);

    } catch (error) {
      logger.error('Failed to handle order:', error);
      throw error;
    }
  }

  /**
   * Detect conflicts between platform quantities
   */
  private detectConflicts(
    item: InventoryItem,
    platformQuantities: Map<string, number>
  ): SyncConflict[] {
    const conflicts: SyncConflict[] = [];
    const quantities = Array.from(platformQuantities.values());
    
    // Check if all quantities match
    const allMatch = quantities.every(q => q === quantities[0]);
    
    if (!allMatch) {
      const platformData = Array.from(platformQuantities.entries()).map(
        ([platform, quantity]) => ({
          platform,
          quantity,
          lastUpdated: item.platforms[platform]?.lastUpdated || new Date()
        })
      );

      conflicts.push({
        itemId: item.id,
        sku: item.sku,
        conflictType: 'quantity_mismatch',
        platforms: platformData,
        suggestedResolution: 'use_lowest', // Safe default
        autoResolvable: true
      });
    }

    return conflicts;
  }

  /**
   * Auto-resolve conflicts using strategy
   */
  private autoResolveConflicts(
    conflicts: SyncConflict[],
    item: InventoryItem
  ): number {
    if (conflicts.length === 0) {
      return item.quantity;
    }

    const conflict = conflicts[0];
    
    switch (conflict.suggestedResolution) {
      case 'use_lowest':
        // Use lowest quantity to prevent overselling
        return Math.min(...conflict.platforms.map(p => p.quantity));
      
      case 'use_highest':
        return Math.max(...conflict.platforms.map(p => p.quantity));
      
      case 'manual_review':
      default:
        // Return current quantity, don't change
        return item.quantity;
    }
  }

  /**
   * Fetch current quantities from all platforms
   */
  private async fetchPlatformQuantities(
    userId: string,
    item: InventoryItem
  ): Promise<Map<string, number>> {
    const quantities = new Map<string, number>();

    const results = await Promise.allSettled(
      Object.entries(item.platforms).map(async ([platform, platformData]) => {
        const connector = this.connectors.get(platform);
        if (!connector || !platformData.syncEnabled) return null;

        const quantity = await connector.getInventoryQuantity(
          userId,
          platformData.platformId
        );

        return { platform, quantity };
      })
    );

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        quantities.set(result.value.platform, result.value.quantity);
      }
    });

    return quantities;
  }

  /**
   * Lock management for preventing concurrent syncs
   */
  private async acquireLock(key: string): Promise<boolean> {
    try {
      const result = await redis.set(key, '1', 'PX', this.lockTTL, 'NX');
      return result === 'OK';
    } catch (error) {
      logger.error('Failed to acquire lock:', error);
      return false;
    }
  }

  private async releaseLock(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error('Failed to release lock:', error);
    }
  }

  /**
   * Database operations
   */
  private async getInventoryItem(
    userId: string,
    itemId: string
  ): Promise<InventoryItem | null> {
    return await prisma.inventoryItem.findFirst({
      where: { id: itemId, userId },
      include: { platforms: true }
    }) as InventoryItem | null;
  }

  private async getUserInventoryItems(userId: string): Promise<InventoryItem[]> {
    return await prisma.inventoryItem.findMany({
      where: { userId },
      include: { platforms: true }
    }) as InventoryItem[];
  }

  private async updateInventoryItem(
    itemId: string,
    data: Partial<InventoryItem>
  ): Promise<void> {
    await prisma.inventoryItem.update({
      where: { id: itemId },
      data
    });
  }

  private async findItemBySku(
    userId: string,
    sku: string
  ): Promise<InventoryItem | null> {
    return await prisma.inventoryItem.findFirst({
      where: { userId, sku },
      include: { platforms: true }
    }) as InventoryItem | null;
  }

  private async createSyncOperation(
    item: InventoryItem,
    action: SyncOperation['action']
  ): Promise<SyncOperation> {
    return await prisma.syncOperation.create({
      data: {
        itemId: item.id,
        action,
        targetPlatforms: Object.keys(item.platforms),
        status: 'pending',
        createdAt: new Date()
      }
    }) as SyncOperation;
  }

  private async updateSyncOperation(
    operationId: string,
    status: SyncOperation['status'],
    error?: string
  ): Promise<void> {
    await prisma.syncOperation.update({
      where: { id: operationId },
      data: {
        status,
        error,
        completedAt: status === 'completed' || status === 'failed' ? new Date() : undefined
      }
    });
  }

  private async storeConflicts(
    userId: string,
    conflicts: SyncConflict[]
  ): Promise<void> {
    await prisma.syncConflict.createMany({
      data: conflicts.map(c => ({
        userId,
        itemId: c.itemId,
        conflictType: c.conflictType,
        conflictData: JSON.stringify(c),
        createdAt: new Date()
      }))
    });
  }

  private async storeOrder(
    userId: string,
    platform: string,
    orderData: any
  ): Promise<void> {
    await prisma.order.create({
      data: {
        userId,
        platform,
        platformOrderId: orderData.id,
        orderData: JSON.stringify(orderData),
        status: 'pending',
        createdAt: new Date()
      }
    });
  }

  private extractLineItems(platform: string, orderData: any): Array<{sku: string; quantity: number}> {
    // Platform-specific extraction logic
    switch (platform) {
      case 'etsy':
        return orderData.line_items?.map((item: any) => ({
          sku: item.sku || item.product_id.toString(),
          quantity: item.quantity
        })) || [];
      
      case 'shopify':
        return orderData.line_items?.map((item: any) => ({
          sku: item.sku,
          quantity: item.quantity
        })) || [];
      
      case 'amazon':
        return orderData.OrderItems?.map((item: any) => ({
          sku: item.SellerSKU,
          quantity: parseInt(item.QuantityOrdered)
        })) || [];
      
      case 'ebay':
        return orderData.OrderLineItems?.map((item: any) => ({
          sku: item.SKU,
          quantity: parseInt(item.Quantity)
        })) || [];
      
      default:
        return [];
    }
  }

  private async sendOversoldAlert(
    userId: string,
    item: InventoryItem,
    quantity: number
  ): Promise<void> {
    // Send email/push notification
    logger.error(`OVERSOLD ALERT: User ${userId}, Item ${item.sku}, Oversold by ${Math.abs(item.quantity - quantity)}`);
    // Implementation would integrate with notification system
  }
}

export const inventorySyncEngine = new InventorySyncEngine();
```

**Database Schema:**
```sql
-- Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  title TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  available INTEGER GENERATED ALWAYS AS (quantity - reserved) STORED,
  last_synced_at TIMESTAMP,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'syncing', 'conflict', 'error')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, sku),
  INDEX idx_user_inventory (user_id, updated_at DESC),
  INDEX idx_sku (sku),
  INDEX idx_sync_status (sync_status)
);

-- Platform Inventory Mappings
CREATE TABLE IF NOT EXISTS platform_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('etsy', 'amazon', 'ebay', 'shopify')),
  platform_id TEXT NOT NULL,
  listing_url TEXT,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2),
  sync_enabled BOOLEAN DEFAULT true,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(inventory_item_id, platform),
  INDEX idx_platform_mapping (inventory_item_id, platform)
);

-- Sync Operations Log
CREATE TABLE IF NOT EXISTS sync_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('update_quantity', 'update_price', 'create_listing', 'delete_listing')),
  target_platforms TEXT[] NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  INDEX idx_sync_operations (item_id, created_at DESC),
  INDEX idx_sync_status (status, created_at)
);

-- Sync Conflicts
CREATE TABLE IF NOT EXISTS sync_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  conflict_type TEXT NOT NULL CHECK (conflict_type IN ('quantity_mismatch', 'price_mismatch', 'sold_out')),
  conflict_data JSONB NOT NULL,
  resolved BOOLEAN DEFAULT false,
  resolution TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  
  INDEX idx_unresolved_conflicts (user_id, resolved, created_at DESC)
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  platform_order_id TEXT NOT NULL,
  order_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(platform, platform_order_id),
  INDEX idx_user_orders (user_id, created_at DESC),
  INDEX idx_platform_orders (platform, status)
);

-- Platform Connections
CREATE TABLE IF NOT EXISTS platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('etsy', 'amazon', 'ebay', 'shopify')),
  access_token TEXT,
  refresh_token TEXT,
  shop_id TEXT,
  shop_name TEXT,
  connected_at TIMESTAMP DEFAULT NOW(),
  last_synced_at TIMESTAMP,
  sync_enabled BOOLEAN DEFAULT true,
  
  UNIQUE(user_id, platform),
  INDEX idx_user_connections (user_id)
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 2. Platform Connectors

**File:** `lib/connectors/amazon-connector.ts`

```typescript
import axios from 'axios';
import { logger } from '@/lib/logger';

export interface AmazonCredentials {
  accessKey: string;
  secretKey: string;
  sellerId: string;
  marketplaceId: string;
}

export class AmazonConnector {
  private baseUrl = 'https://mws.amazonservices.com';

  /**
   * Update inventory quantity on Amazon
   */
  async updateInventory(
    userId: string,
    sku: string,
    quantity: number
  ): Promise<void> {
    const credentials = await this.getCredentials(userId);
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/Feeds/2009-01-01`,
        this.buildInventoryUpdateXML(sku, quantity),
        {
          headers: {
            'Content-Type': 'text/xml',
            'x-amazon-user-agent': 'ListGenius/1.0'
          },
          params: this.buildAuthParams(credentials, 'SubmitFeed')
        }
      );

      logger.info(`Amazon inventory updated for SKU ${sku}: ${quantity}`);
    } catch (error: any) {
      logger.error('Amazon inventory update failed:', error);
      throw new Error(`Failed to update Amazon inventory: ${error.message}`);
    }
  }

  /**
   * Get current inventory quantity
   */
  async getInventoryQuantity(userId: string, sku: string): Promise<number> {
    const credentials = await this.getCredentials(userId);
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/Products/2011-10-01`,
        {
          params: {
            ...this.buildAuthParams(credentials, 'GetCompetitivePricingForSKU'),
            SellerSKUList: sku
          }
        }
      );

      // Parse XML response to get quantity
      const quantity = this.parseQuantityFromResponse(response.data);
      return quantity;
    } catch (error: any) {
      logger.error('Failed to get Amazon inventory:', error);
      throw error;
    }
  }

  /**
   * Get orders from Amazon
   */
  async getOrders(userId: string, since: Date): Promise<any[]> {
    const credentials = await this.getCredentials(userId);
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/Orders/2013-09-01`,
        {
          params: {
            ...this.buildAuthParams(credentials, 'ListOrders'),
            CreatedAfter: since.toISOString(),
            MarketplaceId: credentials.marketplaceId
          }
        }
      );

      return this.parseOrdersFromResponse(response.data);
    } catch (error: any) {
      logger.error('Failed to get Amazon orders:', error);
      throw error;
    }
  }

  private buildInventoryUpdateXML(sku: string, quantity: number): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
      <AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
        xsi:noNamespaceSchemaLocation="amzn-envelope.xsd">
        <Header>
          <DocumentVersion>1.01</DocumentVersion>
          <MerchantIdentifier>MERCHANT_ID</MerchantIdentifier>
        </Header>
        <MessageType>Inventory</MessageType>
        <Message>
          <MessageID>1</MessageID>
          <OperationType>Update</OperationType>
          <Inventory>
            <SKU>${sku}</SKU>
            <Quantity>${quantity}</Quantity>
          </Inventory>
        </Message>
      </AmazonEnvelope>`;
  }

  private buildAuthParams(credentials: AmazonCredentials, action: string): any {
    // Amazon MWS signature calculation (simplified)
    const timestamp = new Date().toISOString();
    return {
      AWSAccessKeyId: credentials.accessKey,
      Action: action,
      SellerId: credentials.sellerId,
      SignatureVersion: '2',
      SignatureMethod: 'HmacSHA256',
      Timestamp: timestamp,
      Version: '2009-01-01'
      // Signature would be calculated here
    };
  }

  private parseQuantityFromResponse(xml: string): number {
    // XML parsing logic
    return 0; // Placeholder
  }

  private parseOrdersFromResponse(xml: string): any[] {
    // XML parsing logic
    return []; // Placeholder
  }

  private async getCredentials(userId: string): Promise<AmazonCredentials> {
    // Fetch from database
    return {
      accessKey: '',
      secretKey: '',
      sellerId: '',
      marketplaceId: ''
    };
  }
}
```

**File:** `lib/connectors/ebay-connector.ts`

```typescript
import axios from 'axios';
import { logger } from '@/lib/logger';

export class EbayConnector {
  private baseUrl = 'https://api.ebay.com';
  
  async updateInventory(userId: string, itemId: string, quantity: number): Promise<void> {
    const token = await this.getAccessToken(userId);
    
    try {
      await axios.put(
        `${this.baseUrl}/sell/inventory/v1/inventory_item/${itemId}`,
        {
          availability: {
            shipToLocationAvailability: {
              quantity
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      logger.info(`eBay inventory updated for item ${itemId}: ${quantity}`);
    } catch (error: any) {
      logger.error('eBay inventory update failed:', error);
      throw new Error(`Failed to update eBay inventory: ${error.message}`);
    }
  }

  async getInventoryQuantity(userId: string, itemId: string): Promise<number> {
    const token = await this.getAccessToken(userId);
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/sell/inventory/v1/inventory_item/${itemId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response.data.availability?.shipToLocationAvailability?.quantity || 0;
    } catch (error: any) {
      logger.error('Failed to get eBay inventory:', error);
      throw error;
    }
  }

  async getOrders(userId: string, since: Date): Promise<any[]> {
    const token = await this.getAccessToken(userId);
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/sell/fulfillment/v1/order`,
        {
          params: {
            filter: `creationdate:[${since.toISOString()}..${new Date().toISOString()}]`
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response.data.orders || [];
    } catch (error: any) {
      logger.error('Failed to get eBay orders:', error);
      throw error;
    }
  }

  private async getAccessToken(userId: string): Promise<string> {
    // Fetch from database and refresh if needed
    return '';
  }
}
```

**File:** `lib/connectors/shopify-connector.ts`

```typescript
import axios from 'axios';
import { logger } from '@/lib/logger';

export class ShopifyConnector {
  async updateInventory(
    userId: string,
    inventoryItemId: string,
    quantity: number
  ): Promise<void> {
    const { shop, accessToken } = await this.getCredentials(userId);
    
    try {
      // First, get the inventory level ID
      const locationResponse = await axios.get(
        `https://${shop}/admin/api/2024-01/locations.json`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken
          }
        }
      );
      
      const locationId = locationResponse.data.locations[0].id;
      
      // Update inventory level
      await axios.post(
        `https://${shop}/admin/api/2024-01/inventory_levels/set.json`,
        {
          location_id: locationId,
          inventory_item_id: inventoryItemId,
          available: quantity
        },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        }
      );
      
      logger.info(`Shopify inventory updated: ${quantity}`);
    } catch (error: any) {
      logger.error('Shopify inventory update failed:', error);
      throw new Error(`Failed to update Shopify inventory: ${error.message}`);
    }
  }

  async getInventoryQuantity(userId: string, inventoryItemId: string): Promise<number> {
    const { shop, accessToken } = await this.getCredentials(userId);
    
    try {
      const response = await axios.get(
        `https://${shop}/admin/api/2024-01/inventory_levels.json`,
        {
          params: {
            inventory_item_ids: inventoryItemId
          },
          headers: {
            'X-Shopify-Access-Token': accessToken
          }
        }
      );
      
      return response.data.inventory_levels[0]?.available || 0;
    } catch (error: any) {
      logger.error('Failed to get Shopify inventory:', error);
      throw error;
    }
  }

  async getOrders(userId: string, since: Date): Promise<any[]> {
    const { shop, accessToken } = await this.getCredentials(userId);
    
    try {
      const response = await axios.get(
        `https://${shop}/admin/api/2024-01/orders.json`,
        {
          params: {
            created_at_min: since.toISOString(),
            status: 'any'
          },
          headers: {
            'X-Shopify-Access-Token': accessToken
          }
        }
      );
      
      return response.data.orders || [];
    } catch (error: any) {
      logger.error('Failed to get Shopify orders:', error);
      throw error;
    }
  }

  private async getCredentials(userId: string): Promise<{shop: string; accessToken: string}> {
    // Fetch from database
    return { shop: '', accessToken: '' };
  }
}
```

#### 3. Order Management Dashboard

**File:** `app/app/orders/page.tsx`

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { emitTopRightToast } from '@/components/TopRightToast';
import { 
  Package, 
  ShoppingCart, 
  TruckIcon, 
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { getBaseUrl } from '@/lib/utils';

interface Order {
  id: string;
  platform: string;
  platformOrderId: string;
  customerName: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  itemCount: number;
  createdAt: string;
  items: Array<{
    sku: string;
    title: string;
    quantity: number;
    price: number;
  }>;
}

export default function OrdersPage() {
  const { user, isLoaded } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user && isLoaded) {
      fetchOrders();
    }
  }, [user, isLoaded, selectedPlatform, selectedStatus]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        platform: selectedPlatform,
        status: selectedStatus
      });

      const response = await fetch(`${getBaseUrl()}/api/orders?${params}`);
      const result = await response.json();

      if (result.success) {
        setOrders(result.data);
      } else {
        emitTopRightToast(result.error || 'Failed to fetch orders', 'error');
      }
    } catch (error) {
      emitTopRightToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();
      if (result.success) {
        emitTopRightToast('Order status updated', 'success');
        fetchOrders();
      } else {
        emitTopRightToast(result.error || 'Failed to update status', 'error');
      }
    } catch (error) {
      emitTopRightToast('Failed to update order status', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPlatformColor = (platform: string) => {
    const colors = {
      etsy: 'bg-orange-100 text-orange-800',
      amazon: 'bg-yellow-100 text-yellow-800',
      ebay: 'bg-blue-100 text-blue-800',
      shopify: 'bg-green-100 text-green-800'
    };
    return colors[platform as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredOrders = orders.filter(order =>
    order.platformOrderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length
  };

  return (
    <DashboardLayout>
      <Container className="py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <ShoppingCart className="h-8 w-8 mr-3 text-blue-600" />
              Order Management
            </h1>
            <p className="text-gray-600">
              Manage orders from all your connected platforms in one place
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <Package className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Processing</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Shipped</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.shipped}</p>
                  </div>
                  <TruckIcon className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="etsy">Etsy</SelectItem>
                <SelectItem value="amazon">Amazon</SelectItem>
                <SelectItem value="ebay">eBay</SelectItem>
                <SelectItem value="shopify">Shopify</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchOrders}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          Order #{order.platformOrderId}
                        </h3>
                        <Badge className={getPlatformColor(order.platform)}>
                          {order.platform}
                        </Badge>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Customer: {order.customerName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.itemCount} item(s) • ${order.totalAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.quantity}x {item.title}
                          </span>
                          <span className="text-gray-900 font-medium">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredOrders.length === 0 && !loading && (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No orders found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </Container>
    </DashboardLayout>
  );
}
```

Due to length constraints, I'll note that this document continues with:
- Phase 20: Customer Follow-ups & Email Marketing (complete implementation)
- Phase 21: Print-on-Demand Integration
- Phase 22: Financial Reports & Accounting
- Phase 23: Social Media Integration
- Phase 24: Chrome Extension
- Phase 25: Mobile App

Each would follow the same comprehensive format with full code examples, database schemas, API routes, and testing requirements.

Would you like me to continue with the remaining phases in this level of detail?

