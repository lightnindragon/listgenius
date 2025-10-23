'use client';

import React from 'react';
import { Button } from './ui/Button';
import { ListingTemplate, templateCategories } from '@/lib/listing-templates';
import { 
  FileText, 
  Star, 
  Clock, 
  TrendingUp, 
  Eye, 
  Edit3, 
  Copy, 
  Trash2, 
  Target,
  Tag,
  DollarSign,
  Calendar,
  Users
} from 'lucide-react';

interface TemplateCardProps {
  template: ListingTemplate;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: () => void;
  onUse: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
  className?: string;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  viewMode,
  isSelected,
  onSelect,
  onUse,
  onEdit,
  onDuplicate,
  onDelete,
  canEdit,
  canDelete,
  className = ''
}) => {
  const category = templateCategories.find(cat => cat.id === template.category);
  
  const getCategoryColor = (categoryId: string) => {
    const cat = templateCategories.find(c => c.id === categoryId);
    return cat?.color || 'gray';
  };

  const getCategoryIcon = (categoryId: string) => {
    const cat = templateCategories.find(c => c.id === categoryId);
    return cat?.icon || '📄';
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getUsageColor = (usageCount: number) => {
    if (usageCount === 0) return 'text-gray-500';
    if (usageCount < 5) return 'text-yellow-600';
    if (usageCount < 20) return 'text-blue-600';
    return 'text-green-600';
  };

  if (viewMode === 'list') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg bg-${getCategoryColor(template.category)}-100 flex items-center justify-center`}>
                <span className="text-lg">{getCategoryIcon(template.category)}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {template.name}
                  </h3>
                  {template.isBuiltIn && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Star className="h-3 w-3 mr-1" />
                      Built-in
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate mt-1">
                  {template.description || 'No description provided'}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center">
                    <Tag className="h-3 w-3 mr-1" />
                    {template.tags.length} tags
                  </span>
                  <span className="flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {template.price ? `$${template.price}` : 'No price'}
                  </span>
                  <span className="flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span className={getUsageColor(template.usageCount)}>
                      {template.usageCount} uses
                    </span>
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(template.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={onUse}
              size="sm"
            >
              <Target className="h-4 w-4 mr-2" />
              Use Template
            </Button>
            
            {canEdit && (
              <Button
                onClick={onEdit}
                variant="outline"
                size="sm"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              onClick={onDuplicate}
              variant="outline"
              size="sm"
            >
              <Copy className="h-4 w-4" />
            </Button>
            
            {canDelete && (
              <Button
                onClick={onDelete}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-brand-500' : ''} ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-lg bg-${getCategoryColor(template.category)}-100 flex items-center justify-center`}>
            <span className="text-xl">{getCategoryIcon(template.category)}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {template.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${getCategoryColor(template.category)}-100 text-${getCategoryColor(template.category)}-800`}>
                {category?.name || template.category}
              </span>
              {template.isBuiltIn && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <Star className="h-3 w-3 mr-1" />
                  Built-in
                </span>
              )}
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

      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
        {template.description || 'No description provided'}
      </p>

      {/* Template Preview */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="text-xs font-medium text-gray-700 mb-2">Template Preview:</div>
        <div className="text-sm text-gray-600 mb-2 line-clamp-2">
          <strong>Title:</strong> {template.title}
        </div>
        <div className="text-xs text-gray-500">
          <strong>Tags:</strong> {template.tags.slice(0, 3).join(', ')}
          {template.tags.length > 3 && ` +${template.tags.length - 3} more`}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{template.tags.length}</div>
          <div className="text-xs text-gray-600">Tags</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-bold ${getUsageColor(template.usageCount)}`}>
            {template.usageCount}
          </div>
          <div className="text-xs text-gray-600">Uses</div>
        </div>
      </div>

      {/* Price */}
      {template.price && (
        <div className="flex items-center justify-center mb-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
            <DollarSign className="h-4 w-4 mr-1" />
            ${template.price}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Updated {formatDate(template.updatedAt)}
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            onClick={onUse}
            size="sm"
          >
            <Target className="h-3 w-3 mr-1" />
            Use
          </Button>
          
          {canEdit && (
            <Button
              onClick={onEdit}
              variant="outline"
              size="sm"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          )}
          
          <Button
            onClick={onDuplicate}
            variant="outline"
            size="sm"
          >
            <Copy className="h-3 w-3" />
          </Button>
          
          {canDelete && (
            <Button
              onClick={onDelete}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
