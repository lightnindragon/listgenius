'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { TopRightToast, emitTopRightToast } from '@/components/TopRightToast';
import { 
  getShopHealthMonitor, 
  ShopHealthScore, 
  HealthIssue, 
  HealthRecommendation 
} from '@/lib/shop-health';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  Download, 
  RefreshCw,
  BarChart3,
  Star,
  Eye,
  MessageSquare,
  DollarSign,
  Users,
  Settings
} from 'lucide-react';
import { getBaseUrl } from '@/lib/utils';

export default function ShopHealthPage() {
  const { user, isLoaded } = useUser();
  const [healthScore, setHealthScore] = useState<ShopHealthScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'recommendations' | 'trends'>('overview');

  const shopHealthMonitor = getShopHealthMonitor();

  useEffect(() => {
    if (user && isLoaded) {
      calculateHealthScore();
    }
  }, [user, isLoaded]);

  const calculateHealthScore = async () => {
    setLoading(true);
    try {
      // Mock data - in real implementation, this would fetch actual shop data
      const mockListings = [
        {
          listingId: 1,
          title: 'Handmade Silver Ring',
          description: 'Beautiful handmade silver ring with intricate details...',
          tags: ['handmade', 'silver', 'ring', 'jewelry', 'artisan'],
          images: [
            { url: 'image1.jpg', altText: 'Silver ring front view' },
            { url: 'image2.jpg', altText: 'Silver ring side view' }
          ],
          price: 45.99,
          currency: 'USD',
          reviews: { count: 25, average: 4.8 },
          favorites: 150,
          views: 1200,
          category: 'jewelry'
        }
      ];

      const mockMetrics = {
        averageConversionRate: 3.2,
        averageRating: 4.7,
        totalReviews: 150,
        responseRate: 95,
        averageResponseTime: 2.5,
        customerSatisfaction: 88,
        salesVelocity: 8.5,
        inventoryTurnover: 6.2,
        profitMargins: 35,
        policyCompleteness: 90,
        aboutPageQuality: 85,
        shopBannerQuality: 80
      };

      const health = await shopHealthMonitor.calculateShopHealth(
        'your_shop_id',
        mockListings,
        mockMetrics
      );

      setHealthScore(health);
    } catch (error) {
      console.error('Error calculating health score:', error);
      emitTopRightToast('Failed to calculate health score', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!healthScore) return;

    const report = shopHealthMonitor.exportHealthReport(healthScore);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shop-health-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 80) return 'bg-yellow-100';
    if (score >= 70) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Sign in required
        </h1>
        <p className="text-gray-600 mb-6">
          Please sign in to view your shop health.
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Shop Health</h1>
            <p className="text-gray-600">
              Monitor your shop's overall health and performance metrics.
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={calculateHealthScore}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            {healthScore && (
              <Button
                onClick={handleExportReport}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="grid grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ) : healthScore ? (
          <div className="space-y-8">
            {/* Overall Health Score */}
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getHealthBgColor(healthScore.overall)} mb-4`}>
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getHealthColor(healthScore.overall)}`}>
                      {healthScore.overall}
                    </div>
                    <div className={`text-lg font-medium ${getHealthColor(healthScore.overall)}`}>
                      {healthScore.grade}
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Shop Health Score
                </h2>
                <p className="text-gray-600 mb-4">
                  Last updated: {healthScore.lastUpdated.toLocaleDateString()}
                </p>
                <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
                  <span>Issues: {healthScore.issues.length}</span>
                  <span>Recommendations: {healthScore.recommendations.length}</span>
                  <span>Quick Wins: {healthScore.quickWins.length}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', name: 'Overview', icon: BarChart3 },
                  { id: 'issues', name: 'Issues', icon: AlertTriangle },
                  { id: 'recommendations', name: 'Recommendations', icon: Target },
                  { id: 'trends', name: 'Trends', icon: TrendingUp }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-brand-500 text-brand-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Health Breakdown */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Health Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(healthScore.breakdown).map(([category, score]) => (
                      <div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className={`text-3xl font-bold mb-2 ${getHealthColor(score)}`}>
                          {score}
                        </div>
                        <div className="text-sm font-medium text-gray-700 capitalize mb-1">
                          {category.replace('_', ' ')}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full inline-block ${getHealthBgColor(score)} ${getHealthColor(score)}`}>
                          {score >= 90 ? 'Excellent' : score >= 80 ? 'Good' : score >= 70 ? 'Fair' : 'Poor'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Wins */}
                {healthScore.quickWins.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Wins</h3>
                    <div className="space-y-4">
                      {healthScore.quickWins.map((win, index) => (
                        <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                            <div className="flex-1">
                              <h4 className="font-medium text-green-900">{win.title}</h4>
                              <p className="text-sm text-green-700 mt-1">{win.description}</p>
                              <div className="mt-2 text-xs text-green-600">
                                <span className="font-medium">Effort:</span> {win.estimatedEffort} • 
                                <span className="font-medium ml-2">Impact:</span> {win.expectedImpact}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Issues Tab */}
            {activeTab === 'issues' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Health Issues</h3>
                {healthScore.issues.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Issues Found</h4>
                    <p className="text-gray-600">Your shop is in great health!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {healthScore.issues.map((issue, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{issue.title}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(issue.severity)}`}>
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{issue.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Impact:</span>
                            <p className="text-gray-600">{issue.impact}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Fix:</span>
                            <p className="text-gray-600">{issue.fix}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recommendations Tab */}
            {activeTab === 'recommendations' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
                <div className="space-y-6">
                  {healthScore.recommendations.map((rec, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{rec.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(rec.priority)}`}>
                          {rec.priority} priority
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{rec.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="font-medium text-gray-700">Expected Impact:</span>
                          <p className="text-gray-600">{rec.expectedImpact}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Timeframe:</span>
                          <p className="text-gray-600">{rec.timeframe}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Effort:</span>
                          <p className="text-gray-600">{rec.estimatedEffort}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">ROI:</span>
                          <p className="text-gray-600">{rec.potentialROI}</p>
                        </div>
                      </div>
                      <div>
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

            {/* Trends Tab */}
            {activeTab === 'trends' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Health Trends</h3>
                  {healthScore.trends.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Trend Data</h4>
                      <p className="text-gray-600">Health trends will appear as you track your shop over time.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {healthScore.trends.map((trend, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              {trend.date.toLocaleDateString()}
                            </span>
                            <span className={`text-lg font-bold ${getHealthColor(trend.score)}`}>
                              {trend.score}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Issues:</span> {trend.issues} • 
                            <span className="font-medium ml-2">Improvements:</span> {trend.improvements.length}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Improvement Timeline */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Improvement Timeline</h3>
                  <div className="space-y-4">
                    {shopHealthMonitor.getHealthImprovementTimeline('your_shop_id').map((timeline, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {timeline.date.toLocaleDateString()}
                          </span>
                          <span className={`text-lg font-bold ${getHealthColor(timeline.expectedScore)}`}>
                            {timeline.expectedScore}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Actions:</span>
                          <ul className="mt-1">
                            {timeline.actions.map((action, actionIndex) => (
                              <li key={actionIndex} className="flex items-start">
                                <span className="mr-2">•</span>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <EmptyState
              icon={<Activity className="h-16 w-16 text-gray-400" />}
              title="No health data available"
              description="Click refresh to calculate your shop health score."
              action={
                <Button onClick={calculateHealthScore}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Calculate Health Score
                </Button>
              }
            />
          </div>
        )}
      </div>
      
      <TopRightToast />
    </DashboardLayout>
  );
}
