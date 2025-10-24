'use client';

import React from 'react';
import { Button } from './ui/Button';
import { ListingDraft } from '@/lib/saved-drafts';
import { 
  FileText, 
  Clock, 
  Edit3, 
  Copy, 
  Trash2, 
  Save,
  Target,
  AlertCircle,
  CheckCircle,
  Eye
} from 'lucide-react';

interface DraftCardProps {
  draft: ListingDraft;
  isSelected: boolean;
  onSelect: () => void;
  onContinueEditing: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  className?: string;
}

export const DraftCard: React.FC<DraftCardProps> = ({
  draft,
  isSelected,
  onSelect,
  onContinueEditing,
  onDuplicate,
  onDelete,
  className = ''
}) => {
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

  const getCompletionText = (completion: number) => {
    if (completion >= 80) return 'Almost Ready';
    if (completion >= 60) return 'Good Progress';
    if (completion >= 40) return 'In Progress';
    return 'Just Started';
  };

  const getSaveTypeIcon = () => {
    if (draft.isAutoSaved) {
      return <Save className="h-3 w-3 text-blue-600" />;
    }
    return <Save className="h-3 w-3 text-green-600" />;
  };

  const getSaveTypeText = () => {
    if (draft.isAutoSaved) {
      return 'Auto-saved';
    }
    return 'Manually saved';
  };

  const getSaveTypeColor = () => {
    if (draft.isAutoSaved) {
      return 'text-blue-600 bg-blue-100 border-blue-200';
    }
    return 'text-green-600 bg-green-100 border-green-200';
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-brand-500' : ''} ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {draft.title || 'Untitled Draft'}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSaveTypeColor()}`}>
                {getSaveTypeIcon()}
                <span className="ml-1">{getSaveTypeText()}</span>
              </span>
            </div>
          </div>
        </div>
        
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Completion</span>
          <span className="text-sm text-gray-600">{draft.completionPct}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${getCompletionColor(draft.completionPct)}`}
            style={{ width: `${draft.completionPct}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {getCompletionText(draft.completionPct)}
        </div>
      </div>

      {/* Content Preview */}
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">
          <strong>Description:</strong>
        </div>
        <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 max-h-20 overflow-y-auto">
          {draft.description || 'No description yet...'}
        </div>
      </div>

      {/* Tags Preview */}
      {draft.tags.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">
            <strong>Tags:</strong>
          </div>
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

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-xs text-gray-500">
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          <span>Updated {formatDate(draft.updatedAt)}</span>
        </div>
        <div className="flex items-center">
          <Target className="h-3 w-3 mr-1" />
          <span>{draft.wordCount || 300} words</span>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mb-4 space-y-2">
        {draft.niche && (
          <div className="text-xs text-gray-600">
            <strong>Niche:</strong> {draft.niche}
          </div>
        )}
        {draft.tone && (
          <div className="text-xs text-gray-600">
            <strong>Tone:</strong> {draft.tone}
          </div>
        )}
        {draft.price && (
          <div className="text-xs text-gray-600">
            <strong>Price:</strong> ${draft.price}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <Button
            onClick={onContinueEditing}
            size="sm"
          >
            <Edit3 className="h-3 w-3 mr-1" />
            Continue
          </Button>
          
          <Button
            onClick={onDuplicate}
            variant="outline"
            size="sm"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
        
        <Button
          onClick={onDelete}
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Status Indicators */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            {draft.completionPct >= 80 && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ready to publish
              </div>
            )}
            {draft.completionPct < 40 && (
              <div className="flex items-center text-yellow-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                Needs more content
              </div>
            )}
          </div>
          <div className="text-xs text-gray-400">
            Created {formatDate(draft.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
};
