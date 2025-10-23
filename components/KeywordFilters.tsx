/**
 * Keyword Filters Component
 */

'use client';

import React from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Filter, X, RotateCcw } from 'lucide-react';

interface SearchFilters {
  demand: 'all' | 'low' | 'medium' | 'high';
  competition: 'all' | 'low' | 'medium' | 'high';
  opportunity: 'all' | 'low' | 'medium' | 'high';
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
  category: string;
  sortBy: 'relevance' | 'demand' | 'competition' | 'opportunity' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

interface KeywordFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApplyFilters: () => void;
}

export const KeywordFilters: React.FC<KeywordFiltersProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
}) => {
  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const resetFilters = () => {
    onFiltersChange({
      demand: 'all',
      competition: 'all',
      opportunity: 'all',
      difficulty: 'all',
      category: '',
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  };

  const hasActiveFilters = 
    filters.demand !== 'all' ||
    filters.competition !== 'all' ||
    filters.opportunity !== 'all' ||
    filters.difficulty !== 'all' ||
    filters.category !== '';

  const getScoreColor = (level: string) => {
    switch (level) {
      case 'low':
      case 'easy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high':
      case 'hard':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
          {hasActiveFilters && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              {[
                filters.demand !== 'all' && 'Demand',
                filters.competition !== 'all' && 'Competition',
                filters.opportunity !== 'all' && 'Opportunity',
                filters.difficulty !== 'all' && 'Difficulty',
                filters.category && 'Category'
              ].filter(Boolean).length} active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button
              onClick={resetFilters}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Demand Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Demand Level
          </label>
          <select
            value={filters.demand}
            onChange={(e) => handleFilterChange('demand', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="low">Low (0-30)</option>
            <option value="medium">Medium (30-70)</option>
            <option value="high">High (70-100)</option>
          </select>
        </div>

        {/* Competition Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Competition Level
          </label>
          <select
            value={filters.competition}
            onChange={(e) => handleFilterChange('competition', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="low">Low (0-30)</option>
            <option value="medium">Medium (30-70)</option>
            <option value="high">High (70-100)</option>
          </select>
        </div>

        {/* Opportunity Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Opportunity Level
          </label>
          <select
            value={filters.opportunity}
            onChange={(e) => handleFilterChange('opportunity', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="low">Low (0-30)</option>
            <option value="medium">Medium (30-70)</option>
            <option value="high">High (70-100)</option>
          </select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty Level
          </label>
          <select
            value={filters.difficulty}
            onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="easy">Easy (0-30)</option>
            <option value="medium">Medium (30-70)</option>
            <option value="hard">Hard (70-100)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <Input
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            placeholder="e.g., jewelry, home decor, art"
            className="w-full"
          />
        </div>

        {/* Sort Options */}
        <div className="flex space-x-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="relevance">Relevance</option>
              <option value="demand">Demand</option>
              <option value="competition">Competition</option>
              <option value="opportunity">Opportunity</option>
              <option value="createdAt">Date Added</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="desc">High to Low</option>
              <option value="asc">Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Presets */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700">Quick Filters</div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              onFiltersChange({
                ...filters,
                demand: 'high',
                competition: 'low',
                opportunity: 'high',
                difficulty: 'easy',
              });
            }}
            variant="outline"
            size="sm"
            className="text-green-600 border-green-300 hover:bg-green-50"
          >
            High Opportunity
          </Button>
          <Button
            onClick={() => {
              onFiltersChange({
                ...filters,
                demand: 'medium',
                competition: 'low',
                opportunity: 'medium',
                difficulty: 'easy',
              });
            }}
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            Low Competition
          </Button>
          <Button
            onClick={() => {
              onFiltersChange({
                ...filters,
                demand: 'high',
                competition: 'medium',
                opportunity: 'high',
                difficulty: 'medium',
              });
            }}
            variant="outline"
            size="sm"
            className="text-purple-600 border-purple-300 hover:bg-purple-50"
          >
            Trending Keywords
          </Button>
          <Button
            onClick={() => {
              onFiltersChange({
                ...filters,
                demand: 'low',
                competition: 'low',
                opportunity: 'low',
                difficulty: 'easy',
              });
            }}
            variant="outline"
            size="sm"
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            Easy Wins
          </Button>
        </div>
      </div>

      {/* Apply Filters Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button
          onClick={onApplyFilters}
          className="px-6"
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
};
