'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/EmptyState';
import { TopRightToast, emitTopRightToast } from '@/components/TopRightToast';
import { 
  getShopComparator, 
  ShopComparison, 
  CompetitorShop, 
  ComparisonGap, 
  ComparisonRecommendation 
} from '@/lib/shop-comparator';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Trash2, 
  Download, 
  BarChart3,
  Percent,
  DollarSign,
  Star,
  Eye,
  MessageSquare
} from 'lucide-react';
import { getBaseUrl } from '@/lib/utils';

export default function ShopComparePage() {
  const { user, isLoaded } = useUser();
  const [competitors, setCompetitors] = useState<CompetitorShop[]>([]);
  const [comparison, setComparison] = useState<ShopComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingCompetitor, setAddingCompetitor] = useState(false);
  const [newCompetitorUrl, setNewCompetitorUrl] = useState('');
  const [newCompetitorCategory, setNewCompetitorCategory] = useState('');
  const [selectedCompetitors, setSelectedCompetitors] = useState<Set<string>>(new Set());

  const shopComparator = getShopComparator();

  useEffect(() => {
    if (user && isLoaded) {
      loadCompetitors();
    }
  }, [user, isLoaded]);

  const loadCompetitors = async () => {
    try {
      const competitorList = shopComparator.getCompetitors();
      setCompetitors(competitorList);
    } catch (error) {
      console.error('Error loading competitors:', error);
      emitTopRightToast('Failed to load competitors', 'error');
    }
  };

  const handleAddCompetitor = async () => {
    if (!newCompetitorUrl || !newCompetitorCategory) {
      emitTopRightToast('Please fill in all fields', 'error');
      return;
    }

    setAddingCompetitor(true);
    try {
      const success = await shopComparator.addCompetitor(newCompetitorUrl, newCompetitorCategory);
      if (success) {
        setNewCompetitorUrl('');
        setNewCompetitorCategory('');
        loadCompetitors();
      }
    } catch (error) {
      console.error('Error adding competitor:', error);
      emitTopRightToast('Failed to add competitor', 'error');
    } finally {
      setAddingCompetitor(false);
    }
  };

  const handleRemoveCompetitor = async (shopId: string) => {
    try {
      const success = await shopComparator.removeCompetitor(shopId);
      if (success) {
        loadCompetitors();
      }
    } catch (error) {
      console.error('Error removing competitor:', error);
      emitTopRightToast('Failed to remove competitor', 'error');
    }
  };

  const handleCompareShop = async () => {
    if (selectedCompetitors.size === 0) {
      emitTopRightToast('Please select at least one competitor', 'error');
      return;
    }

    setLoading(true);
    try {
      // Mock shop ID - in real implementation, this would be the user's shop ID
      const yourShopId = 'your_shop_id';
      const competitorIds = Array.from(selectedCompetitors);
      
      const comparisonResult = await shopComparator.compareShop(
        yourShopId, 
        'jewelry', // Mock category
        competitorIds
      );

      if (comparisonResult) {
        setComparison(comparisonResult);
        emitTopRightToast('Comparison completed successfully!', 'success');
      } else {
        emitTopRightToast('Failed to generate comparison', 'error');
      }
    } catch (error) {
      console.error('Error comparing shop:', error);
      emitTopRightToast('Failed to compare shop', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompetitor = (shopId: string) => {
    const newSelected = new Set(selectedCompetitors);
    if (newSelected.has(shopId)) {
      newSelected.delete(shopId);
    } else {
      newSelected.add(shopId);
    }
    setSelectedCompetitors(newSelected);
  };

  const handleExportReport = () => {
    if (!comparison) return;

    const report = shopComparator.exportComparisonReport(comparison);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shop-comparison-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 80) return 'text-green-600';
    if (percentile >= 60) return 'text-yellow-600';
    if (percentile >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Sign in required
        </h1>
        <p className="text-gray-600 mb-6">
          Please sign in to use the shop comparison tool.
        </p>
        <a
          href="/sign-in"
          className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <DashboardLayout onCreateListingClick={() => {}}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shop Comparison</h1>
          <p className="text-gray-600">
            Compare your shop against competitors and identify opportunities for improvement.
          </p>
        </div>

        {/* Add Competitor Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add Competitor</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Etsy Shop URL
              </label>
              <Input
                value={newCompetitorUrl}
                onChange={(e) => setNewCompetitorUrl(e.target.value)}
                placeholder="https://etsy.com/shop/competitorshop"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={newCompetitorCategory}
                onChange={(e) => setNewCompetitorCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="">Select category</option>
                <option value="jewelry">Jewelry</option>
                <option value="home_decor">Home Decor</option>
                <option value="art">Art</option>
                <option value="clothing">Clothing</option>
                <option value="accessories">Accessories</option>
                <option value="crafts">Crafts</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAddCompetitor}
                disabled={addingCompetitor}
                className="w-full"
              >
                {addingCompetitor ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
          </div>
        </div>

        {/* Competitors List */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Tracked Competitors</h2>
            {competitors.length > 0 && (
              <Button
                onClick={handleCompareShop}
                disabled={loading || selectedCompetitors.size === 0}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Comparing...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Compare ({selectedCompetitors.size} selected)
                  </>
                )}
              </Button>
            )}
          </div>

          {competitors.length === 0 ? (
            <EmptyState
              icon={<Users className="h-16 w-16 text-gray-400" />}
              title="No competitors tracked"
              description="Add competitor shops to start comparing your performance."
            />
          ) : (
            <div className="space-y-4">
              {competitors.map((competitor) => (
                <div
                  key={competitor.shopId}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    selectedCompetitors.has(competitor.shopId)
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedCompetitors.has(competitor.shopId)}
                      onChange={() => handleSelectCompetitor(competitor.shopId)}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">{competitor.shopName}</h3>
                      <p className="text-sm text-gray-500">
                        {competitor.category} • Added {competitor.addedDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a href={competitor.url} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveCompetitor(competitor.shopId)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comparison Results */}
        {comparison && (
          <div className="space-y-8">
            {/* Overall Score */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-gray-900">Comparison Results</h2>
                <Button
                  onClick={handleExportReport}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {comparison.percentileRankings.overall}%
                  </div>
                  <div className="text-sm text-gray-500">Overall Percentile</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {comparison.percentileRankings.totalSales}%
                  </div>
                  <div className="text-sm text-gray-500">Sales Percentile</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {comparison.percentileRankings.conversionRate}%
                  </div>
                  <div className="text-sm text-gray-500">Conversion Percentile</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {comparison.percentileRankings.seoScore}%
                  </div>
                  <div className="text-sm text-gray-500">SEO Percentile</div>
                </div>
              </div>
            </div>

            {/* Key Gaps */}
            {comparison.gaps.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Key Gaps Identified</h3>
                <div className="space-y-4">
                  {comparison.gaps.map((gap, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{gap.metric}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(gap.importance)}`}>
                          {gap.importance} priority
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{gap.description}</p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span>Your Value: <strong>{formatCurrency(gap.yourValue)}</strong></span>
                        <span>Competitor Average: <strong>{formatCurrency(gap.competitorValue)}</strong></span>
                        <span className="text-red-600">Gap: {formatCurrency(gap.gap)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {comparison.recommendations.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
                <div className="space-y-4">
                  {comparison.recommendations.map((rec, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{rec.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(rec.priority)}`}>
                          {rec.priority} priority
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Impact:</span>
                          <p className="text-gray-600">{rec.impact}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Effort:</span>
                          <p className="text-gray-600 capitalize">{rec.effort}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Timeframe:</span>
                          <p className="text-gray-600">{rec.timeframe}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="font-medium text-gray-700 text-sm">Action Steps:</span>
                        <ul className="mt-1 text-sm text-gray-600">
                          {rec.actionSteps.map((step, stepIndex) => (
                            <li key={stepIndex} className="flex items-start">
                              <span className="mr-2">•</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(comparison.metrics.totalRevenue)}
                  </div>
                  <div className="text-sm text-gray-500">Total Revenue</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {comparison.metrics.totalSales}
                  </div>
                  <div className="text-sm text-gray-500">Total Sales</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {comparison.metrics.averageRating.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500">Average Rating</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Percent className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {comparison.metrics.conversionRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Conversion Rate</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Eye className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {comparison.metrics.totalListings}
                  </div>
                  <div className="text-sm text-gray-500">Total Listings</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <MessageSquare className="h-8 w-8 text-pink-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {comparison.metrics.totalReviews}
                  </div>
                  <div className="text-sm text-gray-500">Total Reviews</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <TopRightToast />
    </DashboardLayout>
  );
}
