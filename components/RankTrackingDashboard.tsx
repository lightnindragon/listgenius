/**
 * Rank Tracking Dashboard Component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { TopRightToast, emitTopRightToast } from './TopRightToast';
import { getBaseUrl } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Plus, 
  Search, 
  Eye, 
  Clock, 
  Target,
  AlertCircle,
  CheckCircle,
  X,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';

interface RankTrackingSummary {
  totalKeywords: number;
  keywordsFound: number;
  keywordsNotFound: number;
  averagePosition: number;
  positionImprovements: number;
  positionDeclines: number;
  newRankings: number;
  top10Count: number;
  top50Count: number;
}

interface RankTrackingHistory {
  keyword: string;
  listingId: number;
  history: Array<{
    date: string;
    position: number | null;
    page: number | null;
    found: boolean;
  }>;
  currentPosition: number | null;
  bestPosition: number | null;
  worstPosition: number | null;
  averagePosition: number;
  positionTrend: 'improving' | 'declining' | 'stable';
  daysTracked: number;
}

interface RankTrackingDashboardProps {
  className?: string;
}

export const RankTrackingDashboard: React.FC<RankTrackingDashboardProps> = ({
  className = '',
}) => {
  const [summary, setSummary] = useState<RankTrackingSummary | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<RankTrackingHistory[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState('');
  const [newListingId, setNewListingId] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null);

  useEffect(() => {
    loadRankingData();
  }, []);

  const loadRankingData = async () => {
    setIsLoading(true);
    try {
      // Load summary data (mock for now)
      const mockSummary: RankTrackingSummary = {
        totalKeywords: 25,
        keywordsFound: 18,
        keywordsNotFound: 7,
        averagePosition: 23,
        positionImprovements: 8,
        positionDeclines: 3,
        newRankings: 2,
        top10Count: 3,
        top50Count: 12,
      };
      setSummary(mockSummary);

      // Load tracking history (mock for now)
      const mockHistory: RankTrackingHistory[] = [
        {
          keyword: 'handmade jewelry',
          listingId: 1234567890,
          history: [
            { date: '2024-01-01', position: 45, page: 4, found: true },
            { date: '2024-01-02', position: 42, page: 4, found: true },
            { date: '2024-01-03', position: 38, page: 4, found: true },
            { date: '2024-01-04', position: 35, page: 3, found: true },
            { date: '2024-01-05', position: 32, page: 3, found: true },
          ],
          currentPosition: 32,
          bestPosition: 32,
          worstPosition: 45,
          averagePosition: 38,
          positionTrend: 'improving',
          daysTracked: 5,
        },
        {
          keyword: 'vintage clothing',
          listingId: 1234567891,
          history: [
            { date: '2024-01-01', position: 15, page: 2, found: true },
            { date: '2024-01-02', position: 18, page: 2, found: true },
            { date: '2024-01-03', position: 22, page: 2, found: true },
            { date: '2024-01-04', position: 25, page: 3, found: true },
            { date: '2024-01-05', position: 28, page: 3, found: true },
          ],
          currentPosition: 28,
          bestPosition: 15,
          worstPosition: 28,
          averagePosition: 22,
          positionTrend: 'declining',
          daysTracked: 5,
        },
      ];
      setTrackingHistory(mockHistory);

    } catch (error) {
      console.error('Failed to load ranking data:', error);
      emitTopRightToast('Failed to load ranking data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackRankings = async () => {
    setIsTracking(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/rank-tracking?action=track`, {
        method: 'GET',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSummary(result.data.summary);
        emitTopRightToast('Rankings tracked successfully!', 'success');
      } else {
        emitTopRightToast(result.error || 'Failed to track rankings', 'error');
      }
    } catch (error) {
      console.error('Failed to track rankings:', error);
      emitTopRightToast('Failed to track rankings', 'error');
    } finally {
      setIsTracking(false);
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim() || !newListingId.trim()) {
      emitTopRightToast('Please enter both keyword and listing ID', 'error');
      return;
    }

    try {
      const response = await fetch(`${getBaseUrl()}/api/rank-tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          keyword: newKeyword.trim(),
          listingId: parseInt(newListingId),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        emitTopRightToast('Keyword added to tracking!', 'success');
        setNewKeyword('');
        setNewListingId('');
        loadRankingData(); // Refresh data
      } else {
        emitTopRightToast(result.error || 'Failed to add keyword', 'error');
      }
    } catch (error) {
      console.error('Failed to add keyword:', error);
      emitTopRightToast('Failed to add keyword', 'error');
    }
  };

  const handleRemoveKeyword = async (keyword: string, listingId: number) => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/rank-tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          keyword,
          listingId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        emitTopRightToast('Keyword removed from tracking!', 'success');
        loadRankingData(); // Refresh data
      } else {
        emitTopRightToast(result.error || 'Failed to remove keyword', 'error');
      }
    } catch (error) {
      console.error('Failed to remove keyword:', error);
      emitTopRightToast('Failed to remove keyword', 'error');
    }
  };

  const handleViewHistory = (keyword: string, listingId: number) => {
    setSelectedKeyword(keyword);
    setSelectedListingId(listingId);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'declining':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPositionColor = (position: number | null) => {
    if (position === null) return 'text-gray-500';
    if (position <= 10) return 'text-green-600 font-bold';
    if (position <= 50) return 'text-yellow-600 font-medium';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
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
          <h2 className="text-2xl font-bold text-gray-900">Rank Tracking</h2>
          <p className="text-gray-600 mt-1">
            Track your keyword rankings and monitor performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="primary" onClick={handleTrackRankings} disabled={isTracking}>
            {isTracking ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Tracking...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Track Rankings
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Keywords</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalKeywords}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Keywords Found</p>
                <p className="text-2xl font-bold text-green-600">{summary.keywordsFound}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Position</p>
                <p className="text-2xl font-bold text-gray-900">{summary.averagePosition}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Top 10 Rankings</p>
                <p className="text-2xl font-bold text-green-600">{summary.top10Count}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Improvements</p>
                <p className="text-2xl font-bold text-green-600">{summary.positionImprovements}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Declines</p>
                <p className="text-2xl font-bold text-red-600">{summary.positionDeclines}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      )}

      {/* Add New Keyword */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Keyword to Tracking</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keyword
            </label>
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Enter keyword to track"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Listing ID
            </label>
            <Input
              value={newListingId}
              onChange={(e) => setNewListingId(e.target.value)}
              placeholder="Enter listing ID"
              type="number"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddKeyword} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add to Tracking
            </Button>
          </div>
        </div>
      </div>

      {/* Tracking History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tracking History</h3>
        <div className="space-y-4">
          {trackingHistory.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{item.keyword}</h4>
                  <p className="text-sm text-gray-600">Listing #{item.listingId}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`flex items-center px-3 py-1 rounded-full border text-sm ${getTrendColor(item.positionTrend)}`}>
                    {getTrendIcon(item.positionTrend)}
                    <span className="ml-1 capitalize">{item.positionTrend}</span>
                  </div>
                  <Button
                    onClick={() => handleViewHistory(item.keyword, item.listingId)}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View History
                  </Button>
                  <Button
                    onClick={() => handleRemoveKeyword(item.keyword, item.listingId)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Current Position</p>
                  <p className={`font-medium ${getPositionColor(item.currentPosition)}`}>
                    {item.currentPosition || 'Not found'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Best Position</p>
                  <p className={`font-medium ${getPositionColor(item.bestPosition)}`}>
                    {item.bestPosition || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Average Position</p>
                  <p className="font-medium text-gray-900">{item.averagePosition}</p>
                </div>
                <div>
                  <p className="text-gray-600">Days Tracked</p>
                  <p className="font-medium text-gray-900">{item.daysTracked}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
