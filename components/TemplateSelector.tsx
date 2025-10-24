'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { ListingTemplate } from '@/lib/listing-templates';
import { 
  X, 
  Search, 
  Filter, 
  Star, 
  FileText, 
  Target,
  Copy,
  Eye
} from 'lucide-react';

interface TemplateSelectorProps {
  onSelect: (template: ListingTemplate) => void;
  onCancel: () => void;
  className?: string;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelect,
  onCancel,
  className = ''
}) => {
  const [templates, setTemplates] = useState<ListingTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/templates');
      const result = await response.json();
      
      if (result.success) {
        setTemplates(result.data);
      } else {
        console.error('Failed to load templates:', result.error);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'jewelry': '💍',
      'home-decor': '🏠',
      'clothing': '👕',
      'art-supplies': '🎨',
      'vintage': '🕰️',
      'personalized': '🎁',
      'seasonal': '🎄',
      'digital': '💻'
    };
    return icons[category] || '📄';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Select Template</h2>
            <p className="text-sm text-gray-600">Choose a template to start your listing</p>
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
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="jewelry">Jewelry</option>
                <option value="home-decor">Home Decor</option>
                <option value="clothing">Clothing</option>
                <option value="art-supplies">Art & Crafts</option>
                <option value="vintage">Vintage</option>
                <option value="personalized">Personalized</option>
                <option value="seasonal">Seasonal</option>
                <option value="digital">Digital</option>
              </select>
            </div>
          </div>
        </div>

        {/* Templates List */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600">No templates match your search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-brand-500 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => onSelect(template)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">{getCategoryIcon(template.category)}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 capitalize">{template.category}</span>
                          {template.isBuiltIn && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Star className="h-3 w-3 mr-1" />
                              Built-in
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {template.description || 'No description provided'}
                  </p>

                  <div className="text-xs text-gray-500 mb-3">
                    <div className="font-medium">Title:</div>
                    <div className="line-clamp-1">{template.title}</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {template.tags.length} tags • {template.usageCount} uses
                    </div>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); onSelect(template); }}>
                      <Target className="h-3 w-3 mr-1" />
                      Use
                    </Button>
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
