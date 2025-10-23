/**
 * Keyword Results Table Component
 */

'use client';

import React from 'react';
import { Button } from './ui/Button';
import { BarChart3, TrendingUp, Users, Target, Eye, MoreHorizontal } from 'lucide-react';
import { getDifficultyColor, getDifficultyLabel } from '@/lib/weights';

interface KeywordResult {
  keyword: string;
  demand: number;
  competition: number;
  seasonality: number;
  opportunity: number;
  difficulty: number;
  overallScore: number;
  metrics: {
    suggestStrength?: number;
    serpCount?: number;
    trendsIndex?: number;
    activeListings?: number;
    page1ShopConc?: number;
    titleExactRate?: number;
  };
}

interface KeywordResultsTableProps {
  results: KeywordResult[];
  selectedKeywords: Set<string>;
  onKeywordSelect: (keyword: string, selected: boolean) => void;
  onSelectAll: () => void;
  isLoading?: boolean;
}

export const KeywordResultsTable: React.FC<KeywordResultsTableProps> = ({
  results,
  selectedKeywords,
  onKeywordSelect,
  onSelectAll,
  isLoading = false,
}) => {
  const isAllSelected = results.length > 0 && selectedKeywords.size === results.length;
  const isPartiallySelected = selectedKeywords.size > 0 && selectedKeywords.size < results.length;

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getTrendIcon = (trendDirection?: 'rising' | 'falling' | 'stable') => {
    switch (trendDirection) {
      case 'rising':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'falling':
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-400" />;
    }
  };

  const getOpportunityBadge = (opportunity: number) => {
    if (opportunity >= 70) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Target className="h-3 w-3 mr-1" />
          High
        </span>
      );
    } else if (opportunity >= 40) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Target className="h-3 w-3 mr-1" />
          Medium
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <Target className="h-3 w-3 mr-1" />
          Low
        </span>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Analyzing keywords...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-8 text-center">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No keywords found</h3>
        <p className="text-gray-600">
          Try searching for different keywords or adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(input) => {
                  if (input) input.indeterminate = isPartiallySelected;
                }}
                onChange={onSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Keyword
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-1" />
                Demand
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Competition
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                <Target className="h-4 w-4 mr-1" />
                Opportunity
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                Difficulty
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Overall Score
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Metrics
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {results.map((result, index) => (
            <tr key={result.keyword} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedKeywords.has(result.keyword)}
                  onChange={(e) => onKeywordSelect(result.keyword, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="text-sm font-medium text-gray-900">
                    {result.keyword}
                  </div>
                  {index < 3 && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Top {index + 1}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className={`w-16 h-2 bg-gray-200 rounded-full mr-3`}>
                    <div
                      className={`h-2 rounded-full ${getScoreColor(result.demand).replace('text-', 'bg-').replace('bg-green-600', 'bg-green-500').replace('bg-yellow-600', 'bg-yellow-500').replace('bg-red-600', 'bg-red-500')}`}
                      style={{ width: `${result.demand}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium ${getScoreColor(result.demand)}`}>
                    {result.demand}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className={`w-16 h-2 bg-gray-200 rounded-full mr-3`}>
                    <div
                      className={`h-2 rounded-full ${getScoreColor(result.competition).replace('text-', 'bg-').replace('bg-green-600', 'bg-green-500').replace('bg-yellow-600', 'bg-yellow-500').replace('bg-red-600', 'bg-red-500')}`}
                      style={{ width: `${result.competition}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium ${getScoreColor(result.competition)}`}>
                    {result.competition}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className={`w-16 h-2 bg-gray-200 rounded-full mr-3`}>
                    <div
                      className={`h-2 rounded-full ${getScoreColor(result.opportunity).replace('text-', 'bg-').replace('bg-green-600', 'bg-green-500').replace('bg-yellow-600', 'bg-yellow-500').replace('bg-red-600', 'bg-red-500')}`}
                      style={{ width: `${result.opportunity}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium ${getScoreColor(result.opportunity)}`}>
                    {result.opportunity}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(result.difficulty) === 'green' ? 'bg-green-100 text-green-800' : getDifficultyColor(result.difficulty) === 'yellow' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    {getDifficultyLabel(result.difficulty)}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    {result.difficulty}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className={`w-16 h-2 bg-gray-200 rounded-full mr-3`}>
                    <div
                      className={`h-2 rounded-full ${getScoreColor(result.overallScore).replace('text-', 'bg-').replace('bg-green-600', 'bg-green-500').replace('bg-yellow-600', 'bg-yellow-500').replace('bg-red-600', 'bg-red-500')}`}
                      style={{ width: `${result.overallScore}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold ${getScoreColor(result.overallScore)}`}>
                    {result.overallScore}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="space-y-1">
                  {result.metrics.activeListings && (
                    <div className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {result.metrics.activeListings.toLocaleString()} listings
                    </div>
                  )}
                  {result.metrics.page1ShopConc && (
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {result.metrics.page1ShopConc.toFixed(1)}% concentration
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Handle keyword details
                      console.log('View details for:', result.keyword);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      // Handle more actions
                      console.log('More actions for:', result.keyword);
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
