import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

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
  platform: 'etsy'; // Only Etsy platform supported
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
      const result = await redis.set(key, '1', { px: this.lockTTL, nx: true });
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
    }) as unknown as InventoryItem | null;
  }

  private async getUserInventoryItems(userId: string): Promise<InventoryItem[]> {
    return await prisma.inventoryItem.findMany({
      where: { userId },
      include: { platforms: true }
    }) as unknown as InventoryItem[];
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

// Placeholder connector classes - will be implemented in separate files
class EtsyConnector {
  async updateInventory(userId: string, listingId: string, quantity: number): Promise<void> {
    // Implementation for Etsy API
  }
  
  async getInventoryQuantity(userId: string, listingId: string): Promise<number> {
    // Implementation for Etsy API
    return 0;
  }
}

class AmazonConnector {
  async updateInventory(userId: string, sku: string, quantity: number): Promise<void> {
    // Implementation for Amazon MWS API
  }
  
  async getInventoryQuantity(userId: string, sku: string): Promise<number> {
    // Implementation for Amazon MWS API
    return 0;
  }
}

class EbayConnector {
  async updateInventory(userId: string, itemId: string, quantity: number): Promise<void> {
    // Implementation for eBay API
  }
  
  async getInventoryQuantity(userId: string, itemId: string): Promise<number> {
    // Implementation for eBay API
    return 0;
  }
}

class ShopifyConnector {
  async updateInventory(userId: string, inventoryItemId: string, quantity: number): Promise<void> {
    // Implementation for Shopify API
  }
  
  async getInventoryQuantity(userId: string, inventoryItemId: string): Promise<number> {
    // Implementation for Shopify API
    return 0;
  }
}

export const inventorySyncEngine = new InventorySyncEngine();
