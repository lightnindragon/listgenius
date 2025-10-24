/**
 * Replace Tags Modal Component for Bulk Tag Operations
 */

'use client';

import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { KeywordChips } from './KeywordChips';
import { X, Search, Replace, Plus, Minus, AlertCircle, CheckCircle } from 'lucide-react';
import { emitTopRightToast } from './TopRightToast';
import { getBaseUrl } from '@/lib/utils';

interface ReplaceTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedListings: number[];
  onTagsUpdated: () => void;
}

interface TagOperation {
  type: 'replace' | 'add' | 'remove';
  searchTag: string;
  replaceTag?: string;
  newTag?: string;
}

export const ReplaceTagsModal: React.FC<ReplaceTagsModalProps> = ({
  isOpen,
  onClose,
  selectedListings,
  onTagsUpdated,
}) => {
  const [operation, setOperation] = useState<'replace' | 'add' | 'remove'>('replace');
  const [searchTag, setSearchTag] = useState('');
  const [replaceTag, setReplaceTag] = useState('');
  const [newTag, setNewTag] = useState('');
  const [previewResults, setPreviewResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleClose = () => {
    setSearchTag('');
    setReplaceTag('');
    setNewTag('');
    setPreviewResults([]);
    setShowPreview(false);
    onClose();
  };

  const handlePreview = async () => {
    if (!searchTag.trim()) {
      emitTopRightToast('Please enter a search tag', 'error');
      return;
    }

    if (operation === 'replace' && !replaceTag.trim()) {
      emitTopRightToast('Please enter a replacement tag', 'error');
      return;
    }

    if (operation === 'add' && !newTag.trim()) {
      emitTopRightToast('Please enter a new tag to add', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/etsy/listings/bulk/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingIds: selectedListings,
          operation: {
            type: operation,
            searchTag: searchTag.trim(),
            replaceTag: operation === 'replace' ? replaceTag.trim() : undefined,
            newTag: operation === 'add' ? newTag.trim() : undefined,
          },
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setPreviewResults(result.data.preview);
        setShowPreview(true);
        emitTopRightToast(`Preview ready for ${result.data.preview.length} listings`, 'success');
      } else {
        emitTopRightToast(result.error || 'Preview failed', 'error');
      }
    } catch (error) {
      console.error('Preview error:', error);
      emitTopRightToast('Preview failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (previewResults.length === 0) {
      emitTopRightToast('Please preview changes first', 'error');
      return;
    }

    setIsApplying(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/etsy/listings/bulk/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingIds: selectedListings,
          operation: {
            type: operation,
            searchTag: searchTag.trim(),
            replaceTag: operation === 'replace' ? replaceTag.trim() : undefined,
            newTag: operation === 'add' ? newTag.trim() : undefined,
          },
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        emitTopRightToast(`Successfully updated ${result.data.updatedCount} listings`, 'success');
        onTagsUpdated();
        handleClose();
      } else {
        emitTopRightToast(result.error || 'Update failed', 'error');
      }
    } catch (error) {
      console.error('Apply error:', error);
      emitTopRightToast('Update failed', 'error');
    } finally {
      setIsApplying(false);
    }
  };

  const getOperationDescription = () => {
    switch (operation) {
      case 'replace':
        return 'Replace all instances of a tag with another tag';
      case 'add':
        return 'Add a new tag to all selected listings';
      case 'remove':
        return 'Remove a specific tag from all selected listings';
      default:
        return '';
    }
  };

  const getOperationIcon = () => {
    switch (operation) {
      case 'replace':
        return Replace;
      case 'add':
        return Plus;
      case 'remove':
        return Minus;
      default:
        return Search;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose} />
      
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bulk Tag Operations</h2>
              <p className="text-gray-600 mt-1">
                {getOperationDescription()}
              </p>
            </div>
            <Button onClick={handleClose} variant="ghost" size="sm">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Operation Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Operation Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'replace', label: 'Replace Tag', icon: Replace },
                  { value: 'add', label: 'Add Tag', icon: Plus },
                  { value: 'remove', label: 'Remove Tag', icon: Minus },
                ].map((op) => (
                  <button
                    key={op.value}
                    onClick={() => setOperation(op.value as any)}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      operation === op.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <op.icon className="h-5 w-5 mx-auto mb-2" />
                    <div className="text-sm font-medium">{op.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Tag */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Tag
              </label>
              <Input
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                placeholder="Enter tag to search for"
                className="w-full"
              />
            </div>

            {/* Replace Tag (for replace operation) */}
            {operation === 'replace' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Replacement Tag
                </label>
                <Input
                  value={replaceTag}
                  onChange={(e) => setReplaceTag(e.target.value)}
                  placeholder="Enter replacement tag"
                  className="w-full"
                />
              </div>
            )}

            {/* New Tag (for add operation) */}
            {operation === 'add' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Tag to Add
                </label>
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter new tag to add"
                  className="w-full"
                />
              </div>
            )}

            {/* Selected Listings Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium">
                  {selectedListings.length} listing(s) selected
                </span>
              </div>
            </div>

            {/* Preview Results */}
            {showPreview && previewResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Preview Changes</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {previewResults.map((result, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{result.title}</h4>
                        <span className="text-sm text-gray-500">Listing #{result.listingId}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-gray-600 mb-1">Current Tags:</div>
                          <KeywordChips
                            keywords={result.currentTags}
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-600 mb-1">Updated Tags:</div>
                          <KeywordChips
                            keywords={result.updatedTags}
                            className="text-xs"
                          />
                        </div>
                      </div>

                      {result.changes.length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm font-medium text-gray-600 mb-1">Changes:</div>
                          <div className="space-y-1">
                            {result.changes.map((change: string, changeIndex: number) => (
                              <div key={changeIndex} className="text-sm text-gray-700">• {change}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {selectedListings.length} listing(s) will be affected
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={handleClose} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={handlePreview}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                    Previewing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Preview Changes
                  </>
                )}
              </Button>
              <Button
                onClick={handleApply}
                disabled={!showPreview || isApplying}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isApplying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Applying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Apply Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
