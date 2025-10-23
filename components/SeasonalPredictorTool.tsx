/**
 * Seasonal Trend Predictor Tool Component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { TopRightToast, emitTopRightToast } from './TopRightToast';
import { getBaseUrl } from '@/lib/utils';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Target, 
  Clock,
  AlertCircle,
  CheckCircle,
  Filter,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';

interface SeasonalData {
  keyword: string;
  category: string;
  monthlyTrends: {
    month: string;
    demand: number;
    competition: number;
    opportunity: number;
  }[];
  peakPeriods: {
    period: string;
    demand: number;
    reason: string;
  }[];
  lowPeriods: {
    period: string;
    demand: number;
    reason: string;
  }[];
  recommendations: {
    timing: string;
    strategy: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  confidence: number;
  lastUpdated: string;
}

interface SeasonalPredictorToolProps {
  className?: string;
}

export const SeasonalPredictorTool: React.FC<SeasonalPredictorToolProps> = ({ className = '' }) => {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SeasonalData | null>(null);
  const [activeTab, setActiveTab] = useState<'trends' | 'recommendations' | 'calendar'>('trends');

  const handleAnalyze = async () => {
    if (!keyword.trim()) {
      emitTopRightToast('Please enter a keyword to analyze', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/tools/seasonal-predictor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, category })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setData(result.data);
        emitTopRightToast('Seasonal analysis completed!', 'success');
      } else {
        emitTopRightToast(result.error || 'Failed to analyze seasonal trends', 'error');
      }
    } catch (error) {
      console.error('Seasonal analysis error:', error);
      emitTopRightToast('An error occurred while analyzing seasonal trends', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (demand: number) => {
    if (demand > 70) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (demand > 40) return <BarChart3 className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Seasonal Trend Predictor</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Analyze seasonal demand patterns and optimize your listing timing for maximum visibility and sales.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keyword *
            </label>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., handmade jewelry, vintage clothing"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category (Optional)
            </label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., jewelry, home decor, art"
              className="w-full"
            />
          </div>
        </div>

        <Button
          onClick={handleAnalyze}
          disabled={loading || !keyword.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Analyzing Seasonal Trends...
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 mr-2" />
              Analyze Seasonal Trends
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      {data && (
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'trends', name: 'Trends', icon: BarChart3 },
                { id: 'recommendations', name: 'Recommendations', icon: Target },
                { id: 'calendar', name: 'Calendar', icon: Calendar }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Trends Tab */}
            {activeTab === 'trends' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Peak Periods */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                      Peak Periods
                    </h3>
                    <div className="space-y-3">
                      {data.peakPeriods.map((period, index) => (
                        <div key={index} className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-green-900">{period.period}</span>
                            <span className="text-sm text-green-600">{period.demand}% demand</span>
                          </div>
                          <p className="text-sm text-green-700">{period.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Low Periods */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
                      Low Periods
                    </h3>
                    <div className="space-y-3">
                      {data.lowPeriods.map((period, index) => (
                        <div key={index} className="bg-red-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-red-900">{period.period}</span>
                            <span className="text-sm text-red-600">{period.demand}% demand</span>
                          </div>
                          <p className="text-sm text-red-700">{period.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Monthly Trends Chart */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
                  <div className="grid grid-cols-6 gap-2">
                    {data.monthlyTrends.map((trend, index) => (
                      <div key={index} className="text-center">
                        <div className="bg-gray-100 rounded-lg p-3 mb-2">
                          <div className="flex items-center justify-center mb-1">
                            {getTrendIcon(trend.demand)}
                          </div>
                          <div className="text-xs font-medium text-gray-900">{trend.month}</div>
                          <div className="text-xs text-gray-600">{trend.demand}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations Tab */}
            {activeTab === 'recommendations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Strategic Recommendations</h3>
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                    {data.confidence}% confidence
                  </div>
                </div>

                <div className="space-y-3">
                  {data.recommendations.map((rec, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <Clock className="h-4 w-4 mr-2 text-blue-600" />
                            <span className="font-medium text-gray-900">{rec.timing}</span>
                          </div>
                          <p className="text-gray-700">{rec.strategy}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                          {rec.priority} priority
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Seasonal Calendar</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 mb-4">
                    This calendar view shows the best times to launch and promote your listings based on seasonal trends.
                  </p>
                  <div className="grid grid-cols-12 gap-2 text-xs">
                    {data.monthlyTrends.map((trend, index) => (
                      <div key={index} className="text-center">
                        <div className={`rounded p-2 mb-1 ${
                          trend.demand > 70 ? 'bg-green-100 text-green-800' :
                          trend.demand > 40 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          <div className="font-medium">{trend.month}</div>
                          <div>{trend.demand}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>Last updated: {data?.lastUpdated || 'Never'}</p>
      </div>
    </div>
  );
};

