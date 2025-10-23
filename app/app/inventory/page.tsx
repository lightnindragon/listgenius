'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { emitTopRightToast } from '@/components/TopRightToast';
import { 
  Package2, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  RotateCcw
} from 'lucide-react';
import { getBaseUrl } from '@/lib/utils';

interface InventoryItem {
  id: string;
  sku: string;
  title: string;
  quantity: number;
  reserved: number;
  available: number;
  platforms: {
    platform: string;
    quantity: number;
    syncEnabled: boolean;
  }[];
  syncStatus: string;
  lastSyncedAt: string;
}

export default function InventoryPage() {
  const { user, isLoaded } = useUser();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user && isLoaded) {
      fetchInventory();
    }
  }, [user, isLoaded]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      // Mock data for now
      const mockInventory: InventoryItem[] = [
        {
          id: '1',
          sku: 'NECKLACE-001',
          title: 'Handmade Silver Necklace',
          quantity: 50,
          reserved: 5,
          available: 45,
          platforms: [
            { platform: 'etsy', quantity: 45, syncEnabled: true },
            { platform: 'amazon', quantity: 40, syncEnabled: true },
            { platform: 'ebay', quantity: 50, syncEnabled: false },
            { platform: 'shopify', quantity: 45, syncEnabled: true }
          ],
          syncStatus: 'synced',
          lastSyncedAt: new Date().toISOString()
        },
        {
          id: '2',
          sku: 'BRACELET-002',
          title: 'Bohemian Beaded Bracelet',
          quantity: 25,
          reserved: 2,
          available: 23,
          platforms: [
            { platform: 'etsy', quantity: 25, syncEnabled: true },
            { platform: 'amazon', quantity: 20, syncEnabled: true },
            { platform: 'ebay', quantity: 25, syncEnabled: true },
            { platform: 'shopify', quantity: 23, syncEnabled: true }
          ],
          syncStatus: 'conflict',
          lastSyncedAt: new Date(Date.now() - 3600000).toISOString()
        }
      ];

      setInventory(mockInventory);
      emitTopRightToast('Inventory loaded', 'success');
    } catch (error) {
      emitTopRightToast('Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const syncAllInventory = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/inventory/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncAll: true })
      });

      const result = await response.json();
      if (result.success) {
        emitTopRightToast('Inventory sync initiated', 'success');
        fetchInventory();
      } else {
        emitTopRightToast(result.error || 'Sync failed', 'error');
      }
    } catch (error) {
      emitTopRightToast('Failed to sync inventory', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const syncItem = async (itemId: string) => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/inventory/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });

      const result = await response.json();
      if (result.success) {
        emitTopRightToast('Item synced successfully', 'success');
        fetchInventory();
      } else {
        emitTopRightToast(result.error || 'Sync failed', 'error');
      }
    } catch (error) {
      emitTopRightToast('Failed to sync item', 'error');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />;
      case 'conflict':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <RotateCcw className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced':
        return 'bg-green-100 text-green-800';
      case 'syncing':
        return 'bg-blue-100 text-blue-800';
      case 'conflict':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  if (!isLoaded || loading) {
    return (
      <DashboardLayout>
        <Container className="py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">Loading inventory...</span>
          </div>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container className="py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Package2 className="h-8 w-8 mr-3 text-purple-600" />
              Inventory Sync
            </h1>
            <p className="text-gray-600">
              Manage your inventory across all platforms with real-time synchronization
            </p>
          </div>

          {/* Sync Actions */}
          <div className="mb-8">
            <Button
              onClick={syncAllInventory}
              disabled={syncing}
              className="mr-4"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync All Inventory
            </Button>
            <Button variant="outline" onClick={fetchInventory}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Inventory Items */}
          <div className="space-y-4">
            {inventory.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        <Badge variant="outline">{item.sku}</Badge>
                        <Badge className={getStatusColor(item.syncStatus)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(item.syncStatus)}
                            {item.syncStatus}
                          </span>
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total:</span>
                          <span className="ml-2 font-medium">{item.quantity}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Reserved:</span>
                          <span className="ml-2 font-medium">{item.reserved}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Available:</span>
                          <span className="ml-2 font-medium text-green-600">{item.available}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Last synced: {new Date(item.lastSyncedAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => syncItem(item.id)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Sync
                      </Button>
                    </div>
                  </div>

                  {/* Platform Quantities */}
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">Platform Quantities:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {item.platforms.map((platform) => (
                        <div
                          key={platform.platform}
                          className={`p-3 rounded-lg border ${
                            platform.syncEnabled ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Badge className={getPlatformColor(platform.platform)}>
                              {platform.platform}
                            </Badge>
                            {!platform.syncEnabled && (
                              <Badge variant="outline" className="text-xs">
                                Disabled
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Qty:</span>
                            <span className="font-medium">{platform.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {inventory.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Package2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No inventory items found</p>
                <p className="text-sm text-gray-500 mt-2">
                  Connect your platforms to start syncing inventory
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </Container>
    </DashboardLayout>
  );
}
