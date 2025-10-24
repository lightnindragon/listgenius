/**
 * Keyword Lab - Advanced Keyword Research Tool
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DashboardLayout } from '@/components/DashboardLayout';
import { TopRightToast, emitTopRightToast } from '@/components/TopRightToast';
import { KeywordResultsTable } from '@/components/KeywordResultsTable';
import { KeywordCompareDrawer } from '@/components/KeywordCompareDrawer';
import { KeywordFilters } from '@/components/KeywordFilters';
import { KeywordSearchBox } from '@/components/KeywordSearchBox';
import { Search, Filter, Download, Upload, BarChart3, TrendingUp, Target, Users } from 'lucide-react';
import { getBaseUrl } from '@/lib/utils';

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
  suggestions?: string[];
  relatedKeywords?: Array<{
    keyword: string;
    source: string;
    relevance: number;
  }>;
  trends?: {
    averageInterest: number;
    trendDirection: 'rising' | 'falling' | 'stable';
    trendChange: number;
    seasonality: number;
  };
}

interface SearchFilters {
  demand: 'all' | 'low' | 'medium' | 'high';
  competition: 'all' | 'low' | 'medium' | 'high';
  opportunity: 'all' | 'low' | 'medium' | 'high';
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
  category: string;
  sortBy: 'relevance' | 'demand' | 'competition' | 'opportunity' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

export default function KeywordLabPage() {
  const { user, isLoaded } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [showCompareDrawer, setShowCompareDrawer] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    demand: 'all',
    competition: 'all',
    opportunity: 'all',
    difficulty: 'all',
    category: '',
    sortBy: 'relevance',
    sortOrder: 'desc',
  });
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [difficultyScores, setDifficultyScores] = useState<Map<string, any>>(new Map());

  // Load initial data when component mounts
  useEffect(() => {
    if (isLoaded && user) {
      loadInitialKeywords();
    }
  }, [isLoaded, user]);

  const loadInitialKeywords = async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/keywords/search?q=&limit=20`);
      const data = await response.json();
      if (data.success) {
        setResults(data.data.keywords || []);
      }
    } catch (error) {
      console.error('Failed to load initial keywords:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '50',
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      // Add filters to params
      if (filters.demand !== 'all') params.append('filters', `demand:${filters.demand}`);
      if (filters.competition !== 'all') params.append('filters', `competition:${filters.competition}`);
      if (filters.opportunity !== 'all') params.append('filters', `opportunity:${filters.opportunity}`);
      if (filters.difficulty !== 'all') params.append('filters', `difficulty:${filters.difficulty}`);
      if (filters.category) params.append('category', filters.category);

      const response = await fetch(`${getBaseUrl()}/api/keywords/search?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setResults(data.data.keywords || []);
        emitTopRightToast(`Found ${data.data.keywords?.length || 0} keywords`, 'success');
      } else {
        emitTopRightToast(data.error || 'Search failed', 'error');
      }
    } catch (error) {
      console.error('Search error:', error);
      emitTopRightToast('Search failed', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleBatchAnalysis = async () => {
    if (selectedKeywords.size === 0) {
      emitTopRightToast('Please select keywords to analyze', 'error');
      return;
    }

    setBatchProcessing(true);
    try {
      // First, calculate difficulty scores
      const difficultyResponse = await fetch(`${getBaseUrl()}/api/keywords/difficulty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch',
          keywords: Array.from(selectedKeywords),
        }),
      });

      const difficultyData = await difficultyResponse.json();
      if (difficultyData.success) {
        setDifficultyScores(new Map(Object.entries(difficultyData.data.keywords)));
        emitTopRightToast(`Difficulty scores calculated for ${selectedKeywords.size} keywords`, 'success');
      }

      // Then run batch analysis
      const response = await fetch(`${getBaseUrl()}/api/keywords/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: Array.from(selectedKeywords),
          operations: ['suggest', 'serp', 'trends', 'score', 'related'],
          priority: 5,
        }),
      });

      const data = await response.json();

      if (data.success) {
        emitTopRightToast(`Batch analysis started for ${selectedKeywords.size} keywords`, 'success');
        // Poll for job completion
        pollBatchJob(data.data.jobId);
      } else {
        emitTopRightToast(data.error || 'Batch analysis failed', 'error');
      }
    } catch (error) {
      console.error('Batch analysis error:', error);
      emitTopRightToast('Batch analysis failed', 'error');
    } finally {
      setBatchProcessing(false);
    }
  };

  const pollBatchJob = async (jobId: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`${getBaseUrl()}/api/keywords/batch?jobId=${jobId}`);
        const data = await response.json();

        if (data.success) {
          if (data.data.status === 'completed') {
            emitTopRightToast('Batch analysis completed!', 'success');
            // Refresh results
            handleSearch();
          } else if (data.data.status === 'failed') {
            emitTopRightToast('Batch analysis failed', 'error');
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(poll, 2000); // Poll every 2 seconds
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    poll();
  };

  const handleExportCSV = async () => {
    if (results.length === 0) {
      emitTopRightToast('No data to export', 'error');
      return;
    }

    try {
      const csvData = results.map(result => ({
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
      a.download = `keyword-research-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      emitTopRightToast('Keywords exported successfully', 'success');
    } catch (error) {
      console.error('Export error:', error);
      emitTopRightToast('Export failed', 'error');
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      const keywords = lines.slice(1).map(line => {
        const values = line.split(',');
        const keyword = values[0]?.trim();
        return keyword;
      }).filter(keyword => keyword);

      if (keywords.length === 0) {
        emitTopRightToast('No valid keywords found in CSV', 'error');
        return;
      }

      // Perform batch analysis on imported keywords
      setBatchProcessing(true);
      const response = await fetch(`${getBaseUrl()}/api/keywords/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords,
          operations: ['suggest', 'serp', 'trends', 'score', 'related'],
          priority: 5,
        }),
      });

      const data = await response.json();

      if (data.success) {
        emitTopRightToast(`Importing and analyzing ${keywords.length} keywords`, 'success');
        setSearchQuery(keywords.join(', '));
        pollBatchJob(data.data.jobId);
      } else {
        emitTopRightToast(data.error || 'Import failed', 'error');
      }
    } catch (error) {
      console.error('Import error:', error);
      emitTopRightToast('Import failed', 'error');
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleKeywordSelect = (keyword: string, selected: boolean) => {
    const newSelected = new Set(selectedKeywords);
    if (selected) {
      newSelected.add(keyword);
    } else {
      newSelected.delete(keyword);
    }
    setSelectedKeywords(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedKeywords.size === results.length) {
      setSelectedKeywords(new Set());
    } else {
      setSelectedKeywords(new Set(results.map(r => r.keyword)));
    }
  };

  if (!isLoaded) {
    return (
      <DashboardLayout>
        <Container className="py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Keyword Lab...</p>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Keyword Lab</h1>
            <p className="text-gray-600 mt-1">
              Advanced keyword research with live Etsy data and AI insights
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className={showFilters ? 'bg-blue-50 border-blue-300' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <label className="cursor-pointer">
              <Button variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </span>
              </Button>
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            <KeywordSearchBox
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              isLoading={isSearching}
              placeholder="Enter keywords to research (comma-separated for multiple)"
            />

            {showFilters && (
              <KeywordFilters
                filters={filters}
                onFiltersChange={setFilters}
                onApplyFilters={handleSearch}
              />
            )}
          </div>
        </div>

        {/* Batch Actions */}
        {selectedKeywords.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedKeywords.size} keyword(s) selected
                </span>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleBatchAnalysis}
                    disabled={batchProcessing}
                    size="sm"
                  >
                    {batchProcessing ? 'Analyzing...' : 'Analyze Selected'}
                  </Button>
                  <Button
                    onClick={() => setShowCompareDrawer(true)}
                    variant="outline"
                    size="sm"
                  >
                    Compare Keywords
                  </Button>
                </div>
              </div>
              <Button
                onClick={() => setSelectedKeywords(new Set())}
                variant="ghost"
                size="sm"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <KeywordResultsTable
            results={results}
            selectedKeywords={selectedKeywords}
            onKeywordSelect={handleKeywordSelect}
            onSelectAll={handleSelectAll}
            isLoading={isSearching}
          />
        </div>

        {/* Compare Drawer */}
        <KeywordCompareDrawer
          isOpen={showCompareDrawer}
          onClose={() => setShowCompareDrawer(false)}
          keywords={Array.from(selectedKeywords)}
          results={results}
        />
      </div>

      <TopRightToast />
    </DashboardLayout>
  );
}
