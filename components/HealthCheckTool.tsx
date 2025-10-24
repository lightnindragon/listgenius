/**
 * Listing Health Check Tool Component
 */

'use client';

import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { TopRightToast, emitTopRightToast } from './TopRightToast';
import { getBaseUrl } from '@/lib/utils';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Target, 
  TrendingUp,
  RefreshCw,
  Download,
  Eye,
  Star,
  Tag,
  Image,
  FileText,
  Search,
  BarChart3
} from 'lucide-react';

interface HealthIssue {
  id: string;
  type: 'critical' | 'warning' | 'suggestion';
  category: 'seo' | 'content' | 'images' | 'tags' | 'pricing' | 'description';
  title: string;
  description: string;
  impact: number;
  fix: string;
  priority: 'high' | 'medium' | 'low';
}

interface HealthScore {
  overall: number;
  seo: number;
  content: number;
  images: number;
  tags: number;
  pricing: number;
  description: number;
}

interface HealthCheckResult {
  listingId: string;
  listingTitle: string;
  healthScore: HealthScore;
  issues: HealthIssue[];
  recommendations: string[];
  lastChecked: string;
  checkedAt: string;
}

interface HealthCheckToolProps {
  className?: string;
}

export const HealthCheckTool: React.FC<HealthCheckToolProps> = ({ className = '' }) => {
  const [listingUrl, setListingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthCheckResult | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning' | 'suggestion'>('all');

  const handleHealthCheck = async () => {
    if (!listingUrl.trim()) {
      emitTopRightToast('Please enter a listing URL to analyze', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/tools/health-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingUrl })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data.data);
        emitTopRightToast('Health check completed!', 'success');
      } else {
        emitTopRightToast(data.error || 'Failed to perform health check', 'error');
      }
    } catch (error) {
      console.error('Health check error:', error);
      emitTopRightToast('An error occurred during health check', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'suggestion': return <CheckCircle className="h-5 w-5 text-blue-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'suggestion': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'seo': return <Search className="h-4 w-4" />;
      case 'content': return <FileText className="h-4 w-4" />;
      case 'images': return <Image className="h-4 w-4" />;
      case 'tags': return <Tag className="h-4 w-4" />;
      case 'pricing': return <BarChart3 className="h-4 w-4" />;
      case 'description': return <FileText className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const filteredIssues = result?.issues.filter(issue => 
    activeFilter === 'all' || issue.type === activeFilter
  ) || [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Listing Health Check</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Get instant SEO audit and optimization recommendations for your Etsy listings.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Etsy Listing URL *
          </label>
          <Input
            value={listingUrl}
            onChange={(e) => setListingUrl(e.target.value)}
            placeholder="https://www.etsy.com/listing/..."
            className="w-full"
          />
        </div>

        <Button
          onClick={handleHealthCheck}
          disabled={loading || !listingUrl.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Analyzing Listing...
            </>
          ) : (
            <>
              <Activity className="h-4 w-4 mr-2" />
              Run Health Check
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{result.listingTitle}</h2>
                <p className="text-sm text-gray-600">Listing ID: {result.listingId}</p>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(result.healthScore.overall)}`}>
                  <Star className="h-4 w-4 mr-1" />
                  {result.healthScore.overall}/100
                </div>
                <p className="text-xs text-gray-500 mt-1">Overall Health Score</p>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(result.healthScore).map(([key, score]) => (
                key !== 'overall' && (
                  <div key={key} className="text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-sm font-medium ${getScoreColor(score)}`}>
                      {score}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 capitalize">{key}</p>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Issues Section */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Issues Found</h3>
              <div className="flex space-x-2">
                {['all', 'critical', 'warning', 'suggestion'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter as any)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      activeFilter === filter
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {filteredIssues.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-gray-600">No {activeFilter} issues found!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIssues.map((issue) => (
                  <div key={issue.id} className={`border rounded-lg p-4 ${getIssueColor(issue.type)}`}>
                    <div className="flex items-start space-x-3">
                      {getIssueIcon(issue.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{issue.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            issue.priority === 'high' ? 'bg-red-100 text-red-700' :
                            issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {issue.priority} priority
                          </span>
                          <div className="flex items-center text-xs text-gray-500">
                            {getCategoryIcon(issue.category)}
                            <span className="ml-1 capitalize">{issue.category}</span>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3">{issue.description}</p>
                        <div className="bg-white rounded p-3">
                          <p className="text-sm font-medium text-gray-900 mb-1">How to fix:</p>
                          <p className="text-sm text-gray-700">{issue.fix}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2 text-blue-600" />
                Top Recommendations
              </h3>
              <div className="space-y-2">
                {result.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <TrendingUp className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>Last checked: {result?.checkedAt || 'Never'}</p>
      </div>
    </div>
  );
};

