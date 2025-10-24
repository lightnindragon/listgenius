'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { TopRightToast, emitTopRightToast } from '@/components/TopRightToast';
import { 
  smartPricingEngine, 
  PricingRecommendation,
  CompetitorPriceData,
  BundlePricingRecommendation,
  PriceElasticityData
} from '@/lib/smart-pricing';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3, 
  RefreshCw,
  Download,
  Filter,
  Search,
  Plus,
  Minus,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Users,
  Package,
  Calculator
} from 'lucide-react';
import { getBaseUrl } from '@/lib/utils';

interface Listing {
  id: number;
  title: string;
  currentPrice: number;
  category: string;
  keywords: string[];
  costPrice?: number;
  targetMargin?: number;
  sales?: number;
  revenue?: number;
}

export default function PricingOptimizerPage() {
  const { user, isLoaded } = useUser();
  const [listings, setListings] = useState<Listing[]>([]);
  const [recommendations, setRecommendations] = useState<Map<number, PricingRecommendation>>(new Map());
  const [competitorData, setCompetitorData] = useState<Map<string, CompetitorPriceData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [selectedListings, setSelectedListings] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<'individual' | 'bulk' | 'bundle' | 'history'>('individual');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    if (user && isLoaded) {
      loadListings();
    }
  }, [user, isLoaded]);

  const loadListings = async () => {
    setLoading(true);
    try {
      // Mock listings data - in real implementation, this would fetch from Etsy API
      const mockListings: Listing[] = [
        {
          id: 1,
          title: 'Handmade Silver Ring',
          currentPrice: 45.99,
          category: 'jewelry',
          keywords: ['handmade', 'silver', 'ring', 'jewelry'],
          costPrice: 25,
          targetMargin: 40,
          sales: 25,
          revenue: 1149.75
        },
        {
          id: 2,
          title: 'Vintage Ceramic Bowl',
          currentPrice: 32.50,
          category: 'home-decor',
          keywords: ['vintage', 'ceramic', 'bowl', 'home'],
          costPrice: 15,
          targetMargin: 35,
          sales: 18,
          revenue: 585
        },
        {
          id: 3,
          title: 'Custom Art Print',
          currentPrice: 22.00,
          category: 'art-supplies',
          keywords: ['art', 'print', 'custom', 'wall'],
          costPrice: 8,
          targetMargin: 60,
          sales: 42,
          revenue: 924
        }
      ];

      setListings(mockListings);
      await analyzeAllListings(mockListings);
    } catch (error) {
      console.error('Error loading listings:', error);
      emitTopRightToast('Failed to load listings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const analyzeAllListings = async (listingsToAnalyze: Listing[]) => {
    setLoading(true);
    try {
      const newRecommendations = new Map<number, PricingRecommendation>();
      const newCompetitorData = new Map<string, CompetitorPriceData>();

      for (const listing of listingsToAnalyze) {
        try {
          // Get pricing recommendation
          const recommendation = await smartPricingEngine.getPricingRecommendation(
            listing.id,
            listing.currentPrice,
            listing.category,
            listing.keywords,
            listing.costPrice,
            listing.targetMargin
          );
          newRecommendations.set(listing.id, recommendation);

          // Get competitor data
          const competitor = await smartPricingEngine.getCompetitorPriceRange(
            listing.category,
            listing.keywords
          );
          newCompetitorData.set(listing.category, competitor);
        } catch (error) {
          console.error(`Failed to analyze listing ${listing.id}:`, error);
        }
      }

      setRecommendations(newRecommendations);
      setCompetitorData(newCompetitorData);
      emitTopRightToast('Pricing analysis complete!', 'success');
    } catch (error) {
      console.error('Error analyzing listings:', error);
      emitTopRightToast('Failed to analyze pricing', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectListing = (listingId: number) => {
    const newSelected = new Set(selectedListings);
    if (newSelected.has(listingId)) {
      newSelected.delete(listingId);
    } else {
      newSelected.add(listingId);
    }
    setSelectedListings(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedListings.size === filteredListings.length) {
      setSelectedListings(new Set());
    } else {
      setSelectedListings(new Set(filteredListings.map(l => l.id)));
    }
  };

  const handleApplyRecommendation = async (listingId: number, recommendedPrice: number) => {
    setLoading(true);
    try {
      // In real implementation, this would update the listing price via Etsy API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setListings(prev => prev.map(listing => 
        listing.id === listingId 
          ? { ...listing, currentPrice: recommendedPrice }
          : listing
      ));

      emitTopRightToast('Price updated successfully!', 'success');
      
      // Re-analyze the listing
      const updatedListing = listings.find(l => l.id === listingId);
      if (updatedListing) {
        await analyzeAllListings([updatedListing]);
      }
    } catch (error) {
      console.error('Error updating price:', error);
      emitTopRightToast('Failed to update price', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkApplyRecommendations = async () => {
    if (selectedListings.size === 0) {
      emitTopRightToast('Please select listings to update', 'error');
      return;
    }

    setLoading(true);
    try {
      const updates = Array.from(selectedListings).map(listingId => {
        const listing = listings.find(l => l.id === listingId);
        const recommendation = recommendations.get(listingId);
        return {
          listingId,
          newPrice: recommendation?.recommendedPrice || listing?.currentPrice || 0
        };
      });

      // Simulate bulk update
      await new Promise(resolve => setTimeout(resolve, 2000));

      setListings(prev => prev.map(listing => {
        const update = updates.find(u => u.listingId === listing.id);
        return update ? { ...listing, currentPrice: update.newPrice } : listing;
      }));

      emitTopRightToast(`${selectedListings.size} prices updated successfully!`, 'success');
      setSelectedListings(new Set());
      
      // Re-analyze all listings
      await analyzeAllListings(listings);
    } catch (error) {
      console.error('Error updating prices:', error);
      emitTopRightToast('Failed to update prices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || listing.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(listings.map(l => l.category)));

  const getPriceChangeColor = (current: number, recommended: number) => {
    const change = ((recommended - current) / current) * 100;
    if (change > 5) return 'text-green-600';
    if (change < -5) return 'text-red-600';
    return 'text-gray-600';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Sign in required
        </h1>
        <p className="text-gray-600 mb-6">
          Please sign in to access the pricing optimizer.
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Pricing Optimizer</h1>
            <p className="text-gray-600">
              Optimize your listing prices with AI-powered recommendations and competitor analysis.
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => analyzeAllListings(listings)}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Re-analyze
            </Button>
            <Button
              onClick={() => emitTopRightToast('Export functionality coming soon!', 'info')}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search listings or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'individual', name: 'Individual Analysis', icon: BarChart3 },
              { id: 'bulk', name: 'Bulk Optimization', icon: Package },
              { id: 'bundle', name: 'Bundle Pricing', icon: Calculator },
              { id: 'history', name: 'Price History', icon: TrendingUp }
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

        {/* Content */}
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
        ) : (
          <>
            {/* Individual Analysis Tab */}
            {activeTab === 'individual' && (
              <div className="space-y-6">
                {filteredListings.length === 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-8">
                    <EmptyState
                      icon={<DollarSign className="h-16 w-16 text-gray-400" />}
                      title="No listings found"
                      description="No listings match your search criteria."
                      action={
                        <Button onClick={() => { setSearchTerm(''); setFilterCategory('all'); }}>
                          Clear Filters
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {filteredListings.map((listing) => {
                      const recommendation = recommendations.get(listing.id);
                      const competitor = competitorData.get(listing.category);
                      
                      return (
                        <div key={listing.id} className="bg-white rounded-lg border border-gray-200 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {listing.title}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>Category: {listing.category}</span>
                                <span>Sales: {listing.sales || 0}</span>
                                <span>Revenue: ${listing.revenue || 0}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectedListings.has(listing.id)}
                                onChange={() => handleSelectListing(listing.id)}
                                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Current Price */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="text-sm font-medium text-gray-700 mb-1">Current Price</div>
                              <div className="text-2xl font-bold text-gray-900">${listing.currentPrice.toFixed(2)}</div>
                            </div>

                            {/* Recommended Price */}
                            {recommendation && (
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-sm font-medium text-blue-700 mb-1">Recommended Price</div>
                                <div className={`text-2xl font-bold ${getPriceChangeColor(listing.currentPrice, recommendation.recommendedPrice)}`}>
                                  ${recommendation.recommendedPrice.toFixed(2)}
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  {((recommendation.recommendedPrice - listing.currentPrice) / listing.currentPrice * 100).toFixed(1)}% change
                                </div>
                              </div>
                            )}

                            {/* Competitor Average */}
                            {competitor && (
                              <div className="bg-green-50 p-4 rounded-lg">
                                <div className="text-sm font-medium text-green-700 mb-1">Competitor Average</div>
                                <div className="text-2xl font-bold text-green-900">
                                  ${competitor.average.toFixed(2)}
                                </div>
                                <div className="text-xs text-green-600 mt-1">
                                  Range: ${competitor.min.toFixed(2)} - ${competitor.max.toFixed(2)}
                                </div>
                              </div>
                            )}

                            {/* Confidence Score */}
                            {recommendation && (
                              <div className="bg-yellow-50 p-4 rounded-lg">
                                <div className="text-sm font-medium text-yellow-700 mb-1">Confidence</div>
                                <div className={`text-2xl font-bold ${getConfidenceColor(recommendation.confidence)}`}>
                                  {recommendation.confidence}%
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Recommendation Details */}
                          {recommendation && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="font-medium text-gray-900">AI Recommendation</h4>
                                <Button
                                  onClick={() => handleApplyRecommendation(listing.id, recommendation.recommendedPrice)}
                                  disabled={loading}
                                  size="sm"
                                >
                                  Apply Price
                                </Button>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{recommendation.reasoning}</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700">Expected Conversion:</span>
                                  <div className="text-green-600">+{recommendation.expectedConversionChange.toFixed(1)}%</div>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Expected Profit:</span>
                                  <div className="text-blue-600">{recommendation.expectedProfitChange.toFixed(1)}%</div>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Psychological Price:</span>
                                  <div className="text-purple-600">${recommendation.psychologicalPrice.toFixed(2)}</div>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Competitor Price:</span>
                                  <div className="text-orange-600">${recommendation.competitorPrice.toFixed(2)}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Bulk Optimization Tab */}
            {activeTab === 'bulk' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Bulk Price Optimization</h3>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        {selectedListings.size} of {listings.length} listings selected
                      </span>
                      <Button
                        onClick={handleSelectAll}
                        variant="outline"
                        size="sm"
                      >
                        {selectedListings.size === filteredListings.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                  </div>

                  {selectedListings.size > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-900">Ready to update {selectedListings.size} listings</h4>
                          <p className="text-sm text-blue-700">
                            Prices will be updated based on AI recommendations
                          </p>
                        </div>
                        <Button
                          onClick={handleBulkApplyRecommendations}
                          disabled={loading}
                        >
                          {loading ? 'Updating...' : 'Apply Recommendations'}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Selected Listings</h4>
                    <div className="space-y-2">
                      {filteredListings.filter(l => selectedListings.has(l.id)).map((listing) => {
                        const recommendation = recommendations.get(listing.id);
                        return (
                          <div key={listing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <span className="font-medium text-gray-900">{listing.title}</span>
                              <span className="text-sm text-gray-600 ml-2">
                                ${listing.currentPrice.toFixed(2)} → ${recommendation?.recommendedPrice.toFixed(2) || listing.currentPrice.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {recommendation && (
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  recommendation.confidence >= 80 ? 'bg-green-100 text-green-800' :
                                  recommendation.confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {recommendation.confidence}% confidence
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bundle Pricing Tab */}
            {activeTab === 'bundle' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Bundle Pricing Optimizer</h3>
                  <p className="text-gray-600 mb-6">
                    Create attractive bundle offers to increase average order value and conversion rates.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {listings.slice(0, 4).map((listing) => (
                      <div key={listing.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{listing.title}</h4>
                          <span className="text-lg font-bold text-gray-900">${listing.currentPrice.toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Category: {listing.category}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Bundle Recommendation</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-700">Individual Total:</span>
                        <div className="text-lg font-bold text-blue-900">
                          ${listings.slice(0, 4).reduce((sum, l) => sum + l.currentPrice, 0).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Bundle Price:</span>
                        <div className="text-lg font-bold text-blue-900">
                          ${(listings.slice(0, 4).reduce((sum, l) => sum + l.currentPrice, 0) * 0.85).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Savings:</span>
                        <div className="text-lg font-bold text-green-600">
                          ${(listings.slice(0, 4).reduce((sum, l) => sum + l.currentPrice, 0) * 0.15).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Expected Conversion:</span>
                        <div className="text-lg font-bold text-green-600">+25%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Price History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Price History Analysis</h3>
                  <p className="text-gray-600 mb-6">
                    Analyze historical pricing data to optimize future pricing strategies.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {listings.map((listing) => (
                      <div key={listing.id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">{listing.title}</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Current Price:</span>
                            <span className="font-medium">${listing.currentPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Sales:</span>
                            <span className="font-medium">{listing.sales || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Revenue:</span>
                            <span className="font-medium">${listing.revenue || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Avg. Revenue/Sale:</span>
                            <span className="font-medium">
                              ${listing.sales ? (listing.revenue || 0) / listing.sales : 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      <TopRightToast />
    </DashboardLayout>
  );
}
