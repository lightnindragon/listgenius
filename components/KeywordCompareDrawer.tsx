/**
 * Keyword Compare Drawer Component
 */

'use client';

import React from 'react';
import { Button } from './ui/Button';
import { X, BarChart3, TrendingUp, Users, Target, Eye, Download } from 'lucide-react';
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

interface KeywordCompareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  keywords: string[];
  results: KeywordResult[];
}

export const KeywordCompareDrawer: React.FC<KeywordCompareDrawerProps> = ({
  isOpen,
  onClose,
  keywords,
  results,
}) => {
  if (!isOpen) return null;

  const selectedResults = results.filter(result => keywords.includes(result.keyword));

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getBarColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const exportComparison = () => {
    const csvData = selectedResults.map(result => ({
      keyword: result.keyword,
      demand: result.demand,
      competition: result.competition,
      seasonality: result.seasonality,
      opportunity: result.opportunity,
      difficulty: result.difficulty,
      overallScore: result.overallScore,
      activeListings: result.metrics.activeListings || 0,
      page1ShopConc: result.metrics.page1ShopConc || 0,
      titleExactRate: result.metrics.titleExactRate || 0,
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keyword-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Keyword Comparison</h2>
              <p className="text-gray-600 mt-1">
                Compare {selectedResults.length} keywords side by side
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={exportComparison} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedResults.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No keywords selected</h3>
                <p className="text-gray-600">
                  Select keywords from the results table to compare them here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {selectedResults.map((result, index) => (
                    <div key={result.keyword} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900 truncate" title={result.keyword}>
                          {result.keyword}
                        </h3>
                        <span className="text-xs text-gray-500">#{index + 1}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Overall Score</span>
                          <span className={`text-sm font-bold ${getScoreColor(result.overallScore)}`}>
                            {result.overallScore}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getBarColor(result.overallScore)}`}
                            style={{ width: `${result.overallScore}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{getDifficultyLabel(result.difficulty)}</span>
                          <span>{result.metrics.activeListings?.toLocaleString() || 0} listings</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Detailed Comparison Table */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Detailed Comparison</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Metric
                          </th>
                          {selectedResults.map((result) => (
                            <th key={result.keyword} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <div className="truncate" title={result.keyword}>
                                {result.keyword}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Demand */}
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                              <BarChart3 className="h-4 w-4 mr-2 text-blue-500" />
                              Demand
                            </div>
                          </td>
                          {selectedResults.map((result) => (
                            <td key={result.keyword} className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 h-2 bg-gray-200 rounded-full mr-3">
                                  <div
                                    className={`h-2 rounded-full ${getBarColor(result.demand)}`}
                                    style={{ width: `${result.demand}%` }}
                                  />
                                </div>
                                <span className={`text-sm font-medium ${getScoreColor(result.demand)}`}>
                                  {result.demand}
                                </span>
                              </div>
                            </td>
                          ))}
                        </tr>

                        {/* Competition */}
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-orange-500" />
                              Competition
                            </div>
                          </td>
                          {selectedResults.map((result) => (
                            <td key={result.keyword} className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 h-2 bg-gray-200 rounded-full mr-3">
                                  <div
                                    className={`h-2 rounded-full ${getBarColor(result.competition)}`}
                                    style={{ width: `${result.competition}%` }}
                                  />
                                </div>
                                <span className={`text-sm font-medium ${getScoreColor(result.competition)}`}>
                                  {result.competition}
                                </span>
                              </div>
                            </td>
                          ))}
                        </tr>

                        {/* Opportunity */}
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                              <Target className="h-4 w-4 mr-2 text-green-500" />
                              Opportunity
                            </div>
                          </td>
                          {selectedResults.map((result) => (
                            <td key={result.keyword} className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 h-2 bg-gray-200 rounded-full mr-3">
                                  <div
                                    className={`h-2 rounded-full ${getBarColor(result.opportunity)}`}
                                    style={{ width: `${result.opportunity}%` }}
                                  />
                                </div>
                                <span className={`text-sm font-medium ${getScoreColor(result.opportunity)}`}>
                                  {result.opportunity}
                                </span>
                              </div>
                            </td>
                          ))}
                        </tr>

                        {/* Difficulty */}
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                              <TrendingUp className="h-4 w-4 mr-2 text-red-500" />
                              Difficulty
                            </div>
                          </td>
                          {selectedResults.map((result) => (
                            <td key={result.keyword} className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  getDifficultyColor(result.difficulty) === 'green' ? 'bg-green-100 text-green-800' :
                                  getDifficultyColor(result.difficulty) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {getDifficultyLabel(result.difficulty)}
                                </span>
                                <span className="ml-2 text-sm text-gray-500">
                                  {result.difficulty}
                                </span>
                              </div>
                            </td>
                          ))}
                        </tr>

                        {/* Active Listings */}
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                              <Eye className="h-4 w-4 mr-2 text-purple-500" />
                              Active Listings
                            </div>
                          </td>
                          {selectedResults.map((result) => (
                            <td key={result.keyword} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {result.metrics.activeListings?.toLocaleString() || 'N/A'}
                            </td>
                          ))}
                        </tr>

                        {/* Page 1 Shop Concentration */}
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-indigo-500" />
                              Page 1 Concentration
                            </div>
                          </td>
                          {selectedResults.map((result) => (
                            <td key={result.keyword} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {result.metrics.page1ShopConc ? `${result.metrics.page1ShopConc.toFixed(1)}%` : 'N/A'}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-blue-900 mb-4">Recommendations</h3>
                  <div className="space-y-3">
                    {selectedResults
                      .sort((a, b) => b.overallScore - a.overallScore)
                      .slice(0, 3)
                      .map((result, index) => (
                        <div key={result.keyword} className="flex items-start space-x-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-blue-900 font-medium">{result.keyword}</p>
                            <p className="text-blue-700 text-sm">
                              Best overall score ({result.overallScore}) with {getDifficultyLabel(result.difficulty).toLowerCase()} difficulty.
                              {result.metrics.activeListings && ` ${result.metrics.activeListings.toLocaleString()} active listings.`}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
