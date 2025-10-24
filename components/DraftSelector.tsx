'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { ListingDraft } from '@/lib/saved-drafts';
import { 
  X, 
  Search, 
  Filter, 
  Clock, 
  Save, 
  FileText,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface DraftSelectorProps {
  onSelect: (draft: ListingDraft) => void;
  onCancel: () => void;
  className?: string;
}

export const DraftSelector: React.FC<DraftSelectorProps> = ({
  onSelect,
  onCancel,
  className = ''
}) => {
  const [drafts, setDrafts] = useState<ListingDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'auto-saved' | 'manual'>('all');

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/drafts');
      const result = await response.json();
      
      if (result.success) {
        setDrafts(result.data.drafts || result.data);
      } else {
        console.error('Failed to load drafts:', result.error);
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrafts = drafts.filter(draft => {
    const matchesSearch = (draft.title || 'Untitled Draft').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         draft.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         draft.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'auto-saved' && draft.isAutoSaved) ||
                         (filterType === 'manual' && !draft.isAutoSaved);
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getCompletionColor = (completion: number) => {
    if (completion >= 80) return 'bg-green-500';
    if (completion >= 60) return 'bg-blue-500';
    if (completion >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Load Draft</h2>
            <p className="text-sm text-gray-600">Continue working on a saved draft</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search drafts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="all">All Drafts</option>
                <option value="auto-saved">Auto-saved</option>
                <option value="manual">Manually Saved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Drafts List */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts found</h3>
              <p className="text-gray-600">No drafts match your search criteria or you haven't created any drafts yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-brand-500 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => onSelect(draft)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {draft.title || 'Untitled Draft'}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            draft.isAutoSaved 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {draft.isAutoSaved ? (
                              <>
                                <Save className="h-3 w-3 mr-1" />
                                Auto-saved
                              </>
                            ) : (
                              <>
                                <Save className="h-3 w-3 mr-1" />
                                Manually saved
                              </>
                            )}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(draft.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${
                        draft.completionPct >= 80 ? 'bg-green-100 text-green-600' :
                        draft.completionPct >= 60 ? 'bg-blue-100 text-blue-600' :
                        draft.completionPct >= 40 ? 'bg-yellow-100 text-yellow-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        <span className="text-lg font-bold">{draft.completionPct}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getCompletionColor(draft.completionPct)}`}
                        style={{ width: `${draft.completionPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="mb-3">
                    <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 max-h-16 overflow-y-auto">
                      {draft.description || 'No description yet...'}
                    </div>
                  </div>

                  {/* Tags Preview */}
                  {draft.tags.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {draft.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                        {draft.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{draft.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Metadata and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Created {formatDate(draft.createdAt)}
                      </span>
                      {draft.niche && (
                        <span>Niche: {draft.niche}</span>
                      )}
                      {draft.tone && (
                        <span>Tone: {draft.tone}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {draft.completionPct >= 80 && (
                        <div className="flex items-center text-green-600 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ready to publish
                        </div>
                      )}
                      {draft.completionPct < 40 && (
                        <div className="flex items-center text-yellow-600 text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Needs more content
                        </div>
                      )}
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); onSelect(draft); }}>
                        <Target className="h-3 w-3 mr-1" />
                        Continue
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
