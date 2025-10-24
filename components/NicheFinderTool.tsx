/**
 * Niche Finder Tool Component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { TopRightToast, emitTopRightToast } from './TopRightToast';
import { getBaseUrl } from '@/lib/utils';
import { 
  Search, 
  TrendingUp, 
  Target, 
  DollarSign, 
  Users, 
  BarChart3,
  Star,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface NicheOpportunity {
  niche: string;
  category: string;
  demand: number;
  competition: number;
  opportunity: number;
  difficulty: number;
  avgPrice: number;
  totalListings: number;
  topKeywords: string[];
  marketSize: 'small' | 'medium' | 'large';
  trendDirection: 'growing' | 'stable' | 'declining';
  seasonality: 'low' | 'medium' | 'high';
  profitPotential: 'low' | 'medium' | 'high';
  entryBarriers: 'low' | 'medium' | 'high';
  recommendations: string[];
}

interface NicheFinderToolProps {
  className?: string;
}

export const NicheFinderTool: React.FC<NicheFinderToolProps> = ({
  className = '',
}) => {
  const [niches, setNiches] = useState<NicheOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minDemand: '',
    maxCompetition: '',
    minOpportunity: '',
    maxDifficulty: '',
    marketSize: '',
    trendDirection: '',
    profitPotential: '',
  });
  const [activeTab, setActiveTab] = useState<'search' | 'trending' | 'personalized'>('search');

  const categories = [
    'Home & Living',
    'Jewelry',
    'Art & Collectibles',
    'Clothing',
    'Accessories',
    'Crafts & Supplies',
    'Toys & Entertainment',
    'Health & Beauty',
  ];

  const marketSizes = ['small', 'medium', 'large'];
  const trendDirections = ['growing', 'stable', 'declining'];
  const profitPotentials = ['low', 'medium', 'high'];

  const loadTrendingNiches = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/tools/niche-finder?action=trending&limit=20`);
      const data = await response.json();

      if (response.ok && data.success) {
        setNiches(data.data.niches);
        emitTopRightToast('Trending niches loaded!', 'success');
      } else {
        emitTopRightToast(data.error || 'Failed to load trending niches', 'error');
      }
    } catch (error) {
      console.error('Failed to load trending niches:', error);
      emitTopRightToast('Failed to load trending niches', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPersonalizedNiches = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/tools/niche-finder?action=personalized&limit=20`);
      const data = await response.json();

      if (response.ok && data.success) {
        setNiches(data.data.niches);
        emitTopRightToast('Personalized niches loaded!', 'success');
      } else {
        emitTopRightToast(data.error || 'Failed to load personalized niches', 'error');
      }
    } catch (error) {
      console.error('Failed to load personalized niches:', error);
      emitTopRightToast('Failed to load personalized niches', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const searchNiches = async () => {
    setIsLoading(true);
    try {
      const searchFilters: any = {};
      
      if (filters.minDemand) searchFilters.minDemand = parseInt(filters.minDemand);
      if (filters.maxCompetition) searchFilters.maxCompetition = parseInt(filters.maxCompetition);
      if (filters.minOpportunity) searchFilters.minOpportunity = parseInt(filters.minOpportunity);
      if (filters.maxDifficulty) searchFilters.maxDifficulty = parseInt(filters.maxDifficulty);
      if (selectedCategory) searchFilters.categories = [selectedCategory];
      if (filters.marketSize) searchFilters.marketSize = [filters.marketSize];
      if (filters.trendDirection) searchFilters.trendDirection = [filters.trendDirection];
      if (filters.profitPotential) searchFilters.profitPotential = [filters.profitPotential];

      const response = await fetch(`${getBaseUrl()}/api/tools/niche-finder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'find',
          filters: searchFilters,
          limit: 20,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setNiches(data.data.niches);
        emitTopRightToast(`Found ${data.data.niches.length} niche opportunities!`, 'success');
      } else {
        emitTopRightToast(data.error || 'Failed to search niches', 'error');
      }
    } catch (error) {
      console.error('Failed to search niches:', error);
      emitTopRightToast('Failed to search niches', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeSpecificNiche = async (niche: string) => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/tools/niche-finder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          niche,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Replace or add the analyzed niche to the list
        const updatedNiches = niches.filter(n => n.niche !== niche);
        updatedNiches.unshift(data.data.niche);
        setNiches(updatedNiches);
        emitTopRightToast(`Analyzed "${niche}" successfully!`, 'success');
      } else {
        emitTopRightToast(data.error || 'Failed to analyze niche', 'error');
      }
    } catch (error) {
      console.error('Failed to analyze niche:', error);
      emitTopRightToast('Failed to analyze niche', 'error');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'growing': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMarketSizeColor = (size: string) => {
    switch (size) {
      case 'large': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'small': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'search', name: 'Search Niches', icon: Search },
    { id: 'trending', name: 'Trending', icon: TrendingUp },
    { id: 'personalized', name: 'For You', icon: Star },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Niche Finder</h2>
          <p className="text-gray-600 mt-1">
            Discover profitable niches with low competition
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
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

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Search Input */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a specific niche..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    analyzeSpecificNiche(searchQuery.trim());
                  }
                }}
              />
            </div>
            <Button 
              onClick={() => searchQuery.trim() && analyzeSpecificNiche(searchQuery.trim())}
              disabled={!searchQuery.trim()}
            >
              <Search className="h-4 w-4 mr-2" />
              Analyze
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Demand
                  </label>
                  <Input
                    value={filters.minDemand}
                    onChange={(e) => setFilters({ ...filters, minDemand: e.target.value })}
                    placeholder="0-100"
                    type="number"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Competition
                  </label>
                  <Input
                    value={filters.maxCompetition}
                    onChange={(e) => setFilters({ ...filters, maxCompetition: e.target.value })}
                    placeholder="0-100"
                    type="number"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Opportunity
                  </label>
                  <Input
                    value={filters.minOpportunity}
                    onChange={(e) => setFilters({ ...filters, minOpportunity: e.target.value })}
                    placeholder="0-100"
                    type="number"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Market Size
                  </label>
                  <select
                    value={filters.marketSize}
                    onChange={(e) => setFilters({ ...filters, marketSize: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Sizes</option>
                    {marketSizes.map((size) => (
                      <option key={size} value={size}>{size.charAt(0).toUpperCase() + size.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trend Direction
                  </label>
                  <select
                    value={filters.trendDirection}
                    onChange={(e) => setFilters({ ...filters, trendDirection: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Trends</option>
                    {trendDirections.map((trend) => (
                      <option key={trend} value={trend}>{trend.charAt(0).toUpperCase() + trend.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profit Potential
                  </label>
                  <select
                    value={filters.profitPotential}
                    onChange={(e) => setFilters({ ...filters, profitPotential: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Levels</option>
                    {profitPotentials.map((potential) => (
                      <option key={potential} value={potential}>{potential.charAt(0).toUpperCase() + potential.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <Button onClick={searchNiches} className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    Search Niches
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trending Tab */}
      {activeTab === 'trending' && (
        <div className="text-center py-8">
          <Button onClick={loadTrendingNiches} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Load Trending Niches
              </>
            )}
          </Button>
        </div>
      )}

      {/* Personalized Tab */}
      {activeTab === 'personalized' && (
        <div className="text-center py-8">
          <Button onClick={loadPersonalizedNiches} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                Load Personalized Niches
              </>
            )}
          </Button>
        </div>
      )}

      {/* Results */}
      {niches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Niche Opportunities ({niches.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {niches.map((niche, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{niche.niche}</h4>
                    <p className="text-sm text-gray-600">{niche.category}</p>
                  </div>
                  <div className="flex items-center">
                    {getTrendIcon(niche.trendDirection)}
                    <span className="ml-1 text-sm text-gray-600 capitalize">{niche.trendDirection}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center">
                    <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(niche.opportunity)}`}>
                      {niche.opportunity}/100
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Opportunity</p>
                  </div>
                  <div className="text-center">
                    <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(niche.demand)}`}>
                      {niche.demand}/100
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Demand</p>
                  </div>
                  <div className="text-center">
                    <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(100 - niche.competition)}`}>
                      {niche.competition}/100
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Competition</p>
                  </div>
                  <div className="text-center">
                    <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(100 - niche.difficulty)}`}>
                      {niche.difficulty}/100
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Difficulty</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Price:</span>
                    <span className="font-medium">${niche.avgPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Listings:</span>
                    <span className="font-medium">{niche.totalListings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Market Size:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMarketSizeColor(niche.marketSize)}`}>
                      {niche.marketSize}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Profit Potential:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      niche.profitPotential === 'high' ? 'bg-green-100 text-green-800' :
                      niche.profitPotential === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {niche.profitPotential}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">Top Keywords:</p>
                  <div className="flex flex-wrap gap-1">
                    {niche.topKeywords.slice(0, 3).map((keyword, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {niche.recommendations.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">Recommendations:</p>
                    <ul className="space-y-1">
                      {niche.recommendations.slice(0, 2).map((rec, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-start">
                          <Lightbulb className="h-3 w-3 mr-1 mt-0.5 text-yellow-500" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {niches.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Niches Found</h3>
          <p className="text-gray-600 mb-4">
            Use the search filters above to find profitable niche opportunities
          </p>
          <Button onClick={searchNiches}>
            <Search className="h-4 w-4 mr-2" />
            Search Niches
          </Button>
        </div>
      )}
    </div>
  );
};
