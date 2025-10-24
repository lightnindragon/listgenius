/**
 * Advanced Analytics Dashboard Component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { TopRightToast, emitTopRightToast } from './TopRightToast';
import { ABTestingDashboard } from './ABTestingDashboard';
import { getBaseUrl } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Heart, 
  ShoppingCart, 
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Users,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  TestTube
} from 'lucide-react';

interface AnalyticsOverview {
  totalListings: number;
  activeListings: number;
  totalViews: number;
  totalFavorites: number;
  totalSales: number;
  totalRevenue: number;
  averageListingPrice: number;
  conversionRate: number;
  averageViewsPerListing: number;
  topPerformingListings: Array<{
    listingId: number;
    title: string;
    views: number;
    favorites: number;
    revenue: number;
  }>;
  performanceTrends: {
    views: { current: number; previous: number; change: number };
    favorites: { current: number; previous: number; change: number };
    sales: { current: number; previous: number; change: number };
    revenue: { current: number; previous: number; change: number };
  };
}

interface ListingAnalytics {
  listingId: number;
  title: string;
  views: number;
  favorites: number;
  sales: number;
  revenue: number;
  conversionRate: number;
  averagePrice: number;
  tags: string[];
  materials: string[];
  category: string;
  performanceScore: number;
  trend: 'improving' | 'declining' | 'stable';
  recommendations: string[];
  lastUpdated: string;
}

interface KeywordAnalytics {
  keyword: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  revenue: number;
  averagePosition: number;
  trend: 'improving' | 'declining' | 'stable';
  opportunity: number;
  difficulty: number;
  recommendations: string[];
}

interface CompetitorAnalytics {
  competitorId: string;
  shopName: string;
  totalListings: number;
  averagePrice: number;
  estimatedRevenue: number;
  topKeywords: string[];
  marketShare: number;
  threatLevel: 'low' | 'medium' | 'high';
  lastAnalyzed: string;
}

interface AIRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  actionItems: string[];
}

interface AdvancedAnalyticsDashboardProps {
  className?: string;
}

export const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  className = '',
}) => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [listings, setListings] = useState<ListingAnalytics[]>([]);
  const [keywords, setKeywords] = useState<KeywordAnalytics[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorAnalytics[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'keywords' | 'competitors' | 'recommendations' | 'ab-tests'>('overview');
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalyticsData();
  }, [period]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Load overview data
      const overviewResponse = await fetch(`${getBaseUrl()}/api/analytics/overview?period=${period}`);
      const overviewData = await overviewResponse.json();
      if (overviewData.success) {
        setOverview(overviewData.data.overview);
      }

      // Load listings data
      const listingsResponse = await fetch(`${getBaseUrl()}/api/analytics/listings?period=${period}`);
      const listingsData = await listingsResponse.json();
      if (listingsData.success) {
        setListings(listingsData.data.listings);
      }

      // Load keywords data
      const keywordsResponse = await fetch(`${getBaseUrl()}/api/analytics/keywords?period=${period}`);
      const keywordsData = await keywordsResponse.json();
      if (keywordsData.success) {
        setKeywords(keywordsData.data.keywords);
      }

      // Load competitors data
      const competitorsResponse = await fetch(`${getBaseUrl()}/api/analytics/competitors`);
      const competitorsData = await competitorsResponse.json();
      if (competitorsData.success) {
        setCompetitors(competitorsData.data.competitors);
      }

      // Load recommendations data
      const recommendationsResponse = await fetch(`${getBaseUrl()}/api/analytics/recommendations`);
      const recommendationsData = await recommendationsResponse.json();
      if (recommendationsData.success) {
        setRecommendations(recommendationsData.data.recommendations);
      }

    } catch (error) {
      console.error('Failed to load analytics data:', error);
      emitTopRightToast('Failed to load analytics data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'listings', name: 'Listings', icon: Eye },
    { id: 'keywords', name: 'Keywords', icon: Target },
    { id: 'competitors', name: 'Competitors', icon: Users },
    { id: 'recommendations', name: 'AI Insights', icon: Activity },
    { id: 'ab-tests', name: 'A/B Tests', icon: TestTube },
  ];

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
          <h2 className="text-2xl font font-bold text-gray-900">Advanced Analytics</h2>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into your shop performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button onClick={loadAnalyticsData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
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
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${overview.totalRevenue}</p>
                  <div className={`flex items-center text-sm ${getTrendColor(overview.performanceTrends.revenue.change)}`}>
                    {getTrendIcon(overview.performanceTrends.revenue.change)}
                    <span className="ml-1">{Math.abs(overview.performanceTrends.revenue.change).toFixed(1)}%</span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.totalViews.toLocaleString()}</p>
                  <div className={`flex items-center text-sm ${getTrendColor(overview.performanceTrends.views.change)}`}>
                    {getTrendIcon(overview.performanceTrends.views.change)}
                    <span className="ml-1">{Math.abs(overview.performanceTrends.views.change).toFixed(1)}%</span>
                  </div>
                </div>
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.totalSales}</p>
                  <div className={`flex items-center text-sm ${getTrendColor(overview.performanceTrends.sales.change)}`}>
                    {getTrendIcon(overview.performanceTrends.sales.change)}
                    <span className="ml-1">{Math.abs(overview.performanceTrends.sales.change).toFixed(1)}%</span>
                  </div>
                </div>
                <ShoppingCart className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.conversionRate.toFixed(2)}%</p>
                  <div className="flex items-center text-sm text-gray-600">
                    <Target className="h-4 w-4" />
                    <span className="ml-1">Target: 2-3%</span>
                  </div>
                </div>
                <Target className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Top Performing Listings */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Listings</h3>
            <div className="space-y-3">
              {overview.topPerformingListings.map((listing, index) => (
                <div key={listing.listingId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{listing.title}</p>
                      <p className="text-sm text-gray-500">
                        {listing.views} views • {listing.favorites} favorites
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">${listing.revenue}</p>
                    <p className="text-sm text-gray-500">Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Listings Tab */}
      {activeTab === 'listings' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Listing Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Listing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Favorites
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {listings.map((listing) => (
                    <tr key={listing.listingId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{listing.title}</div>
                        <div className="text-sm text-gray-500">{listing.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {listing.views.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {listing.favorites}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {listing.sales}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${listing.revenue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          listing.performanceScore >= 80 ? 'bg-green-100 text-green-800' :
                          listing.performanceScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {listing.performanceScore}/100
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center ${
                          listing.trend === 'improving' ? 'text-green-600' :
                          listing.trend === 'declining' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {listing.trend === 'improving' ? <TrendingUp className="h-4 w-4" /> :
                           listing.trend === 'declining' ? <TrendingDown className="h-4 w-4" /> :
                           <Activity className="h-4 w-4" />}
                          <span className="ml-1 text-sm capitalize">{listing.trend}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Keywords Tab */}
      {activeTab === 'keywords' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Keyword Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Keyword
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Impressions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CTR
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Difficulty
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {keywords.map((keyword) => (
                    <tr key={keyword.keyword}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{keyword.keyword}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {keyword.impressions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {keyword.ctr.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {keyword.averagePosition}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${keyword.revenue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          keyword.difficulty >= 70 ? 'bg-red-100 text-red-800' :
                          keyword.difficulty >= 40 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {keyword.difficulty}/100
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Competitors Tab */}
      {activeTab === 'competitors' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Competitor Analysis</h3>
            <div className="space-y-4">
              {competitors.map((competitor) => (
                <div key={competitor.competitorId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{competitor.shopName}</h4>
                      <p className="text-sm text-gray-600">
                        {competitor.totalListings} listings • Est. Revenue: ${competitor.estimatedRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getThreatLevelColor(competitor.threatLevel)}`}>
                      {competitor.threatLevel} threat
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Listings</p>
                      <p className="font-medium">{competitor.totalListings}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Avg Price</p>
                      <p className="font-medium">${competitor.averagePrice}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Est. Revenue</p>
                      <p className="font-medium">${competitor.estimatedRevenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Market Share</p>
                      <p className="font-medium">{competitor.marketShare.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Powered Recommendations</h3>
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="font-medium text-gray-900">{rec.title}</h4>
                        <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                          {rec.priority} priority
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Impact: {rec.impact}</span>
                        <span>Effort: {rec.effort}</span>
                        <span>Category: {rec.category}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Action Items:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {rec.actionItems.map((item, itemIndex) => (
                        <li key={itemIndex}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* A/B Tests Tab */}
      {activeTab === 'ab-tests' && (
        <div className="space-y-6">
          <ABTestingDashboard />
        </div>
      )}
    </div>
  );
};
