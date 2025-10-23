'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
  RefreshCw,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { getBaseUrl } from '@/lib/utils';

interface Order {
  id: string;
  platform: string;
  platformOrderId: string;
  customerName: string;
  customerEmail: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    sku: string;
    title: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress?: {
    name: string;
    address1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
  avgOrderValue: number;
}

export default function OrdersPage() {
  const { user, isLoaded } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');

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
        status: selectedStatus,
        sortBy
      });

      const response = await fetch(`${getBaseUrl()}/api/orders?${params}`);
      const result = await response.json();

      if (result.success) {
        setOrders(result.data.orders);
        setStats(result.data.stats);
        emitTopRightToast('Orders loaded successfully', 'success');
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

  const exportOrders = () => {
    const csv = [
      ['Order ID', 'Platform', 'Customer', 'Status', 'Total', 'Items', 'Date'].join(','),
      ...orders.map(order => [
        order.platformOrderId,
        order.platform,
        `"${order.customerName}"`,
        order.status,
        order.totalAmount.toFixed(2),
        order.itemCount,
        new Date(order.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
      etsy: 'bg-orange-100 text-orange-800'
    };
    return colors[platform as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredOrders = orders.filter(order =>
    order.platformOrderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isLoaded || loading) {
    return (
      <DashboardLayout>
        <Container className="py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">Loading orders...</span>
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
              <ShoppingCart className="h-8 w-8 mr-3 text-blue-600" />
              Order Management
            </h1>
            <p className="text-gray-600">
              Manage orders from all your connected platforms in one place
            </p>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-green-50/30 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                      <p className="text-3xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50/30 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                      <p className="text-3xl font-bold text-blue-600">${stats.avgOrderValue.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-yellow-50/30 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Pending Orders</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 border-gray-200 focus:border-brand-300 focus:ring-brand-200"
                />
              </div>

              <select 
                value={selectedPlatform} 
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-[180px] px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-200 focus:border-brand-300 bg-white"
              >
                <option value="all">All Platforms</option>
                <option value="etsy">Etsy</option>
              </select>

              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-[180px] px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-200 focus:border-brand-300 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="w-[180px] px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-200 focus:border-brand-300 bg-white"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="amount">Highest Amount</option>
                <option value="status">Status</option>
              </select>

              <Button 
                variant="primary" 
                onClick={exportOrders} 
                disabled={orders.length === 0}
                className="bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>

              <Button 
                variant="outline" 
                onClick={fetchOrders}
                className="border-brand-200 text-brand-700 hover:bg-brand-50 hover:border-brand-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-r from-white to-gray-50/30 shadow-sm hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.platformOrderId}
                        </h3>
                        <Badge className={`${getPlatformColor(order.platform)} font-medium px-3 py-1`}>
                          {order.platform}
                        </Badge>
                        <Badge className={`${getStatusColor(order.status)} font-medium px-3 py-1`}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700 font-medium">
                          {order.customerName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.customerEmail}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            {order.itemCount} item(s)
                          </span>
                          <span className="font-semibold text-gray-900">
                            ${order.totalAmount.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="w-[140px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Items
                    </p>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2">
                          <span className="text-sm text-gray-700 font-medium">
                            {item.quantity}x {item.title}
                          </span>
                          <div className="text-right">
                            <span className="text-sm text-gray-900 font-semibold">
                              ${item.price.toFixed(2)}
                            </span>
                            <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {order.shippingAddress && (
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <TruckIcon className="h-4 w-4" />
                        Shipping Address
                      </p>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-sm text-gray-700 space-y-1">
                          <p className="font-medium">{order.shippingAddress.name}</p>
                          <p>{order.shippingAddress.address1}</p>
                          <p>
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                          </p>
                          <p>{order.shippingAddress.country}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredOrders.length === 0 && !loading && (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Package className="h-10 w-10 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'Try adjusting your search filters' : 'Connect your platforms to start syncing orders'}
                </p>
                {!searchTerm && (
                  <Button 
                    variant="primary" 
                    className="bg-brand-600 hover:bg-brand-700 text-white"
                  >
                    Connect Platforms
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </Container>
    </DashboardLayout>
  );
}
