/**
 * Keyword Search Box Component
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Search, Loader2, X, TrendingUp, Target, Users } from 'lucide-react';
import { emitTopRightToast } from './TopRightToast';
import { getBaseUrl } from '@/lib/utils';

interface KeywordSearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const KeywordSearchBox: React.FC<KeywordSearchBoxProps> = ({
  value,
  onChange,
  onSearch,
  isLoading = false,
  placeholder = "Enter keywords to research..."
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('keyword-search-history');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Handle input change with debounced suggestions
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (newValue.trim().length > 2) {
      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(`${getBaseUrl()}/api/keywords/suggest?q=${encodeURIComponent(newValue)}&limit=10`);
        const data = await response.json();
        
        if (data.success) {
          setSuggestions(data.data || []);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Failed to load suggestions:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    if (!value.trim()) return;

    // Add to search history
    const newHistory = [value.trim(), ...searchHistory.filter(item => item !== value.trim())].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('keyword-search-history', JSON.stringify(newHistory));

    setShowSuggestions(false);
    onSearch();
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Handle history click
  const handleHistoryClick = (historyItem: string) => {
    onChange(historyItem);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Clear input
  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick search buttons
  const quickSearches = [
    { label: 'Trending', icon: TrendingUp, keywords: 'handmade jewelry, vintage clothing, home decor' },
    { label: 'High Opportunity', icon: Target, keywords: 'custom gifts, personalized items, unique art' },
    { label: 'Low Competition', icon: Users, keywords: 'handmade soap, ceramic mugs, macrame wall hanging' },
  ];

  const handleQuickSearch = (keywords: string) => {
    onChange(keywords);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      {/* Main Search Input */}
      <div className="flex space-x-3">
        <div className="flex-1 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              value={value}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="pl-10 pr-10"
              disabled={isLoading}
            />
            {value && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
            >
              {/* Search History */}
              {searchHistory.length > 0 && value.length === 0 && (
                <div className="p-3 border-b border-gray-100">
                  <div className="text-xs font-medium text-gray-500 mb-2">Recent Searches</div>
                  {searchHistory.slice(0, 5).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleHistoryClick(item)}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="p-3">
                  <div className="text-xs font-medium text-gray-500 mb-2">Suggestions</div>
                  {isLoadingSuggestions ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500">Loading suggestions...</span>
                    </div>
                  ) : (
                    suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                      >
                        {suggestion}
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Quick Search Options */}
              {value.length === 0 && (
                <div className="p-3 border-t border-gray-100">
                  <div className="text-xs font-medium text-gray-500 mb-2">Quick Searches</div>
                  {quickSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickSearch(search.keywords)}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                    >
                      <search.icon className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="flex-1 text-left">{search.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <Button
          onClick={handleSearch}
          disabled={!value.trim() || isLoading}
          className="px-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Search
            </>
          )}
        </Button>
      </div>

      {/* Search Tips */}
      <div className="mt-3 text-sm text-gray-500">
        <p>
          💡 <strong>Pro tip:</strong> Use commas to search multiple keywords at once. 
          Try "handmade jewelry, vintage clothing, home decor" for batch analysis.
        </p>
      </div>
    </div>
  );
};
