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
  Mail, 
  Plus,
  Play,
  Pause,
  BarChart3,
  Users,
  TrendingUp,
  Eye,
  MousePointer,
  UserMinus,
  RefreshCw,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { getBaseUrl } from '@/lib/utils';

interface EmailCampaign {
  id: string;
  name: string;
  type: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  subject: string;
  recipientSegment: string;
  scheduledAt?: string;
  sentAt?: string;
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
    bounced: number;
    openRate: number;
    clickRate: number;
    unsubscribeRate: number;
  };
  createdAt: string;
}

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSent: number;
  averageOpenRate: number;
  averageClickRate: number;
  totalRevenue: number;
}

export default function CampaignsPage() {
  const { user, isLoaded } = useUser();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    if (user && isLoaded) {
      fetchCampaigns();
    }
  }, [user, isLoaded, selectedType, selectedStatus]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: selectedType,
        status: selectedStatus
      });

      const response = await fetch(`${getBaseUrl()}/api/campaigns?${params}`);
      const result = await response.json();

      if (result.success) {
        setCampaigns(result.data.campaigns);
        setStats(result.data.stats);
        emitTopRightToast('Campaigns loaded successfully', 'success');
      } else {
        emitTopRightToast(result.error || 'Failed to fetch campaigns', 'error');
      }
    } catch (error) {
      emitTopRightToast('Failed to load campaigns', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Campaign',
          type: 'custom',
          subject: 'Your Email Subject',
          content: 'Your email content here...',
          recipientSegment: 'all_customers'
        })
      });

      const result = await response.json();
      if (result.success) {
        emitTopRightToast('Campaign created successfully', 'success');
        fetchCampaigns();
      } else {
        emitTopRightToast(result.error || 'Failed to create campaign', 'error');
      }
    } catch (error) {
      emitTopRightToast('Failed to create campaign', 'error');
    }
  };

  const sendCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/campaigns/${campaignId}/send`, {
        method: 'POST'
      });

      const result = await response.json();
      if (result.success) {
        emitTopRightToast('Campaign sent successfully', 'success');
        fetchCampaigns();
      } else {
        emitTopRightToast(result.error || 'Failed to send campaign', 'error');
      }
    } catch (error) {
      emitTopRightToast('Failed to send campaign', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: string) => {
    const colors = {
      welcome: 'bg-blue-100 text-blue-800',
      abandoned_cart: 'bg-red-100 text-red-800',
      post_purchase: 'bg-green-100 text-green-800',
      win_back: 'bg-purple-100 text-purple-800',
      custom: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (!isLoaded || loading) {
    return (
      <DashboardLayout>
        <Container className="py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">Loading campaigns...</span>
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
              <Mail className="h-8 w-8 mr-3 text-blue-600" />
              Email Campaigns
            </h1>
            <p className="text-gray-600">
              Create and manage email marketing campaigns to engage your customers
            </p>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Campaigns</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
                    </div>
                    <Mail className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Campaigns</p>
                      <p className="text-2xl font-bold text-green-600">{stats.activeCampaigns}</p>
                    </div>
                    <Play className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg Open Rate</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.averageOpenRate.toFixed(1)}%</p>
                    </div>
                    <Eye className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters and Actions */}
          <div className="flex flex-wrap gap-4 mb-6">
            <select 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-[180px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="welcome">Welcome</option>
              <option value="abandoned_cart">Abandoned Cart</option>
              <option value="post_purchase">Post Purchase</option>
              <option value="win_back">Win Back</option>
              <option value="custom">Custom</option>
            </select>

            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-[180px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>

            <Button onClick={createCampaign}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>

            <Button variant="outline" onClick={fetchCampaigns}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Campaigns List */}
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                        <Badge className={getTypeColor(campaign.type)}>
                          {campaign.type.replace('_', ' ')}
                        </Badge>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{campaign.subject}</p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(campaign.createdAt).toLocaleDateString()}
                        {campaign.scheduledAt && (
                          <span className="ml-4">
                            Scheduled: {new Date(campaign.scheduledAt).toLocaleDateString()}
                          </span>
                        )}
                        {campaign.sentAt && (
                          <span className="ml-4">
                            Sent: {new Date(campaign.sentAt).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {campaign.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => sendCampaign(campaign.id)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Send
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Analytics
                      </Button>
                    </div>
                  </div>

                  {/* Campaign Metrics */}
                  {campaign.metrics.sent > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">Campaign Performance:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Mail className="h-4 w-4 text-blue-500 mr-1" />
                            <span className="text-sm text-gray-600">Sent</span>
                          </div>
                          <p className="font-semibold">{campaign.metrics.sent.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Eye className="h-4 w-4 text-purple-500 mr-1" />
                            <span className="text-sm text-gray-600">Open Rate</span>
                          </div>
                          <p className="font-semibold">{campaign.metrics.openRate.toFixed(1)}%</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <MousePointer className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-sm text-gray-600">Click Rate</span>
                          </div>
                          <p className="font-semibold">{campaign.metrics.clickRate.toFixed(1)}%</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <UserMinus className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-sm text-gray-600">Unsubscribed</span>
                          </div>
                          <p className="font-semibold">{campaign.metrics.unsubscribed}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {campaigns.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No campaigns found</p>
                <p className="text-sm text-gray-500 mt-2">
                  Create your first email campaign to start engaging with customers
                </p>
                <Button onClick={createCampaign} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Campaign
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </Container>
    </DashboardLayout>
  );
}