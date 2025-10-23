/**
 * Competitor Analysis Dashboard Component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { TopRightToast, emitTopRightToast } from './TopRightToast';
import { getBaseUrl } from '@/lib/utils';
import { 
  Users, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Eye,
  BarChart3,
  DollarSign,
  Target,
  Activity,
  Clock,
  Search,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface CompetitorShop {
  shopId: number;
  shopName: string;
  shopUrl: string;
  totalListings: number;
  activeListings: number;
  estimatedSales: number;
  estimatedRevenue: number;
  averagePrice: number;
  topCategories: string[];
  topKeywords: string[];
  pricingStrategy: 'premium' | 'mid-range' | 'budget';
  listingFrequency: 'high' | 'medium' | 'low';
  shopAge: number;
  lastAnalyzed: string;
}

interface CompetitorAlert {
  competitorId: string;
  shopName: string;
  alertType: 'new_listing' | 'price_change' | 'keyword_change' | 'sales_spike' | 'new_category';
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  details: any;
}

interface CompetitorComparison {
  competitorId: string;
  shopName: string;
  comparison: {
    listingCount: { competitor: number; yourShop: number; difference: number };
    averagePrice: { competitor: number; yourShop: number; difference: number };
    estimatedRevenue: { competitor: number; yourShop: number; difference: number };
    topKeywords: { shared: string[]; competitorOnly: string[]; yourShopOnly: string[] };
  };
  opportunities: string[];
  threats: string[];
}

interface CompetitorAnalysisDashboardProps {
  className?: string;
}

export const CompetitorAnalysisDashboard: React.FC<CompetitorAnalysisDashboardProps> = ({
  className = '',
}) => {
  const [competitors, setCompetitors] = useState<CompetitorShop[]>([]);
  const [alerts, setAlerts] = useState<CompetitorAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newShopId, setNewShopId] = useState('');
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorShop | null>(null);
  const [comparison, setComparison] = useState<CompetitorComparison | null>(null);
  const [activeTab, setActiveTab] = useState<'competitors' | 'alerts' | 'comparison'>('competitors');

  useEffect(() => {
    loadCompetitorData();
  }, []);

  const loadCompetitorData = async () => {
    setIsLoading(true);
    try {
      // Load competitors
      const competitorsResponse = await fetch(`${getBaseUrl()}/api/competitors`);
      const competitorsData = await competitorsResponse.json();
      if (competitorsData.success) {
        setCompetitors(competitorsData.data.competitors);
      }

      // Load alerts
      const alertsResponse = await fetch(`${getBaseUrl()}/api/competitors/alerts`);
      const alertsData = await alertsResponse.json();
      if (alertsData.success) {
        setAlerts(alertsData.data.alerts);
      }

    } catch (error) {
      console.error('Failed to load competitor data:', error);
      emitTopRightToast('Failed to load competitor data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCompetitor = async () => {
    if (!newShopId.trim()) {
      emitTopRightToast('Please enter a shop ID', 'error');
      return;
    }

    const shopId = parseInt(newShopId.trim());
    if (isNaN(shopId)) {
      emitTopRightToast('Please enter a valid shop ID', 'error');
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          shopId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        emitTopRightToast('Competitor added successfully!', 'success');
        setNewShopId('');
        loadCompetitorData(); // Refresh data
      } else {
        emitTopRightToast(result.error || 'Failed to add competitor', 'error');
      }
    } catch (error) {
      console.error('Failed to add competitor:', error);
      emitTopRightToast('Failed to add competitor', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveCompetitor = async (shopId: number) => {
    if (!confirm('Are you sure you want to remove this competitor from tracking?')) {
      return;
    }

    try {
      const response = await fetch(`${getBaseUrl()}/api/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          shopId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        emitTopRightToast('Competitor removed successfully!', 'success');
        loadCompetitorData(); // Refresh data
      } else {
        emitTopRightToast(result.error || 'Failed to remove competitor', 'error');
      }
    } catch (error) {
      console.error('Failed to remove competitor:', error);
      emitTopRightToast('Failed to remove competitor', 'error');
    }
  };

  const handleCompareCompetitor = async (competitor: CompetitorShop) => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'compare',
          shopId: competitor.shopId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSelectedCompetitor(competitor);
        setComparison(result.data.comparison);
        setActiveTab('comparison');
      } else {
        emitTopRightToast(result.error || 'Failed to compare competitor', 'error');
      }
    } catch (error) {
      console.error('Failed to compare competitor:', error);
      emitTopRightToast('Failed to compare competitor', 'error');
    }
  };

  const getPricingStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'mid-range': return 'bg-blue-100 text-blue-800';
      case 'budget': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getListingFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'new_listing': return <Plus className="h-4 w-4" />;
      case 'price_change': return <DollarSign className="h-4 w-4" />;
      case 'keyword_change': return <Target className="h-4 w-4" />;
      case 'sales_spike': return <TrendingUp className="h-4 w-4" />;
      case 'new_category': return <BarChart3 className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const tabs = [
    { id: 'competitors', name: 'Tracked Competitors', icon: Users },
    { id: 'alerts', name: 'Alerts', icon: AlertTriangle },
    { id: 'comparison', name: 'Comparison', icon: BarChart3 },
  ];

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Competitor Analysis</h2>
          <p className="text-gray-600 mt-1">
            Track and analyze your competitors for strategic insights
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={loadCompetitorData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Add Competitor */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Competitor</h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              value={newShopId}
              onChange={(e) => setNewShopId(e.target.value)}
              placeholder="Enter Etsy shop ID (e.g., 12345678)"
              type="number"
            />
          </div>
          <Button onClick={handleAddCompetitor} disabled={isAdding}>
            {isAdding ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Competitor
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Find shop IDs in Etsy shop URLs: etsy.com/shop/shopname
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
                {tab.id === 'alerts' && alerts.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-600 text-xs rounded-full px-2 py-1">
                    {alerts.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Competitors Tab */}
      {activeTab === 'competitors' && (
        <div className="space-y-6">
          {competitors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Competitors Tracked</h3>
              <p className="text-gray-600 mb-4">
                Add competitors to start tracking their performance and strategies
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {competitors.map((competitor) => (
                <div key={competitor.shopId} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{competitor.shopName}</h3>
                      <p className="text-sm text-gray-600">Shop ID: {competitor.shopId}</p>
                    </div>
                    <Button
                      onClick={() => handleRemoveCompetitor(competitor.shopId)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Listings</span>
                      <span className="text-sm font-medium">{competitor.activeListings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Est. Revenue</span>
                      <span className="text-sm font-medium">${competitor.estimatedRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Price</span>
                      <span className="text-sm font-medium">${competitor.averagePrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Shop Age</span>
                      <span className="text-sm font-medium">{competitor.shopAge} days</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPricingStrategyColor(competitor.pricingStrategy)}`}>
                      {competitor.pricingStrategy}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getListingFrequencyColor(competitor.listingFrequency)}`}>
                      {competitor.listingFrequency} frequency
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleCompareCompetitor(competitor)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Compare
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                    >
                      <a
                        href={competitor.shopUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Alerts</h3>
              <p className="text-gray-600">
                Competitor alerts will appear here when significant changes are detected
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <div key={index} className={`border rounded-lg p-4 ${getAlertSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        {getAlertIcon(alert.alertType)}
                      </div>
                      <div>
                        <h4 className="font-medium">{alert.shopName}</h4>
                        <p className="text-sm mt-1">{alert.message}</p>
                        <p className="text-xs mt-2 opacity-75">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAlertSeverityColor(alert.severity)}`}>
                      {alert.severity} priority
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comparison Tab */}
      {activeTab === 'comparison' && comparison && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Comparison: {comparison.shopName}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Listings</h4>
                <div className="text-2xl font-bold text-gray-900">{comparison.comparison.listingCount.competitor}</div>
                <div className="text-sm text-gray-500">
                  vs {comparison.comparison.listingCount.yourShop} (yours)
                </div>
                <div className={`text-sm ${comparison.comparison.listingCount.difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {comparison.comparison.listingCount.difference > 0 ? '+' : ''}{comparison.comparison.listingCount.difference}
                </div>
              </div>

              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Average Price</h4>
                <div className="text-2xl font-bold text-gray-900">${comparison.comparison.averagePrice.competitor}</div>
                <div className="text-sm text-gray-500">
                  vs ${comparison.comparison.averagePrice.yourShop} (yours)
                </div>
                <div className={`text-sm ${comparison.comparison.averagePrice.difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {comparison.comparison.averagePrice.difference > 0 ? '+' : ''}${comparison.comparison.averagePrice.difference.toFixed(2)}
                </div>
              </div>

              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Est. Revenue</h4>
                <div className="text-2xl font-bold text-gray-900">${comparison.comparison.estimatedRevenue.competitor.toLocaleString()}</div>
                <div className="text-sm text-gray-500">
                  vs ${comparison.comparison.estimatedRevenue.yourShop.toLocaleString()} (yours)
                </div>
                <div className={`text-sm ${comparison.comparison.estimatedRevenue.difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {comparison.comparison.estimatedRevenue.difference > 0 ? '+' : ''}${comparison.comparison.estimatedRevenue.difference.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Opportunities</h4>
                <div className="space-y-2">
                  {comparison.opportunities.map((opportunity, index) => (
                    <div key={index} className="flex items-start">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                      <span className="text-sm text-gray-700">{opportunity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Threats</h4>
                <div className="space-y-2">
                  {comparison.threats.map((threat, index) => (
                    <div key={index} className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-red-600 mr-2 mt-0.5" />
                      <span className="text-sm text-gray-700">{threat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
