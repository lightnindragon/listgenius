'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { ListingTemplate, templateCategories, templateVariables } from '@/lib/listing-templates';
import { 
  X, 
  Save, 
  Eye, 
  Tag, 
  DollarSign, 
  Package,
  Plus,
  Trash2,
  Info,
  Lightbulb,
  AlertCircle
} from 'lucide-react';

interface TemplateEditorProps {
  template?: ListingTemplate;
  onSave: (templateData: Partial<ListingTemplate>) => void;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onCancel,
  loading = false,
  className = ''
}) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'custom',
    title: template?.title || '',
    tags: template?.tags || [],
    price: template?.price || 0,
    materials: template?.materials || [],
    shippingProfile: template?.shippingProfile || '',
    etsyCategory: template?.etsyCategory || ''
  });

  const [newTag, setNewTag] = useState('');
  const [newMaterial, setNewMaterial] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedVariables, setSelectedVariables] = useState<{ [key: string]: string }>({});

  const isEditing = !!template;

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        category: template.category,
        title: template.title,
        tags: template.tags,
        price: template.price || 0,
        materials: template.materials,
        shippingProfile: template.shippingProfile || '',
        etsyCategory: template.etsyCategory || ''
      });
    }
  }, [template]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddMaterial = () => {
    if (newMaterial.trim() && !formData.materials.includes(newMaterial.trim())) {
      setFormData(prev => ({
        ...prev,
        materials: [...prev.materials, newMaterial.trim()]
      }));
      setNewMaterial('');
    }
  };

  const handleRemoveMaterial = (materialToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter(material => material !== materialToRemove)
    }));
  };

  const handleVariableChange = (variableName: string, value: string) => {
    setSelectedVariables(prev => ({
      ...prev,
      [variableName]: value
    }));
  };

  const insertVariable = (variableName: string) => {
    const variable = `{${variableName}}`;
    setFormData(prev => ({
      ...prev,
      title: prev.title + variable,
      description: prev.description + variable
    }));
  };

  const processTemplate = () => {
    let processedTitle = formData.title;
    let processedDescription = formData.description;
    let processedTags = [...formData.tags];

    // Replace variables with selected values
    Object.entries(selectedVariables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      processedTitle = processedTitle.replace(new RegExp(placeholder, 'g'), value);
      processedDescription = processedDescription.replace(new RegExp(placeholder, 'g'), value);
      processedTags = processedTags.map(tag => 
        tag.replace(new RegExp(placeholder, 'g'), value)
      );
    });

    return {
      title: processedTitle,
      description: processedDescription,
      tags: processedTags
    };
  };

  const handleSave = () => {
    onSave(formData);
  };

  const getAvailableVariables = () => {
    const titleMatches = formData.title.match(/\{([^}]+)\}/g) || [];
    const descMatches = formData.description.match(/\{([^}]+)\}/g) || [];
    const tagMatches = formData.tags.join(' ').match(/\{([^}]+)\}/g) || [];
    
    const allMatches = [...titleMatches, ...descMatches, ...tagMatches];
    const uniqueVariables = [...new Set(allMatches.map(match => match.slice(1, -1)))];
    
    return uniqueVariables;
  };

  const availableVariables = getAvailableVariables();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Template' : 'Create New Template'}
            </h2>
            <p className="text-sm text-gray-600">
              {isEditing ? 'Update your listing template' : 'Create a reusable template for your listings'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Form */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Handmade Jewelry Template"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      placeholder="Brief description of this template..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    >
                      {templateCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Listing Content */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Listing Content</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title Template *
                    </label>
                    <Textarea
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      rows={2}
                      placeholder="e.g., Handmade {MATERIAL} Ring - {COLOR}"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description Template *
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={6}
                      placeholder="Write your description template here. Use variables like {COLOR}, {MATERIAL}, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button
                      onClick={handleAddTag}
                      disabled={!newTag.trim()}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Materials */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Materials</h3>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      value={newMaterial}
                      onChange={(e) => setNewMaterial(e.target.value)}
                      placeholder="Add a material..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddMaterial()}
                    />
                    <Button
                      onClick={handleAddMaterial}
                      disabled={!newMaterial.trim()}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {formData.materials.map((material, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                      >
                        {material}
                        <button
                          onClick={() => handleRemoveMaterial(material)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Variables & Preview */}
            <div className="space-y-6">
              {/* Template Variables */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                  Template Variables
                </h3>
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">Using Variables</p>
                        <p>Use variables like {`{COLOR}`}, {`{MATERIAL}`} in your title and description. Click the variable buttons below to insert them.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {templateVariables.map((variable) => (
                      <Button
                        key={variable.name}
                        onClick={() => insertVariable(variable.name)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        {`{${variable.name}}`}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Variable Values (for Preview) */}
              {availableVariables.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Variable Values</h3>
                  <div className="space-y-3">
                    {availableVariables.map((variableName) => {
                      const variable = templateVariables.find(v => v.name === variableName);
                      return (
                        <div key={variableName}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {variable?.description || variableName}
                          </label>
                          {variable?.type === 'select' && variable.options ? (
                            <select
                              value={selectedVariables[variableName] || variable.defaultValue || ''}
                              onChange={(e) => handleVariableChange(variableName, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                            >
                              <option value="">Select {variableName}</option>
                              {variable.options.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              value={selectedVariables[variableName] || ''}
                              onChange={(e) => handleVariableChange(variableName, e.target.value)}
                              placeholder={`Enter ${variableName.toLowerCase()}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Preview</h3>
                  <Button
                    onClick={() => setShowPreview(!showPreview)}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showPreview ? 'Hide' : 'Show'} Preview
                  </Button>
                </div>

                {showPreview && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    {(() => {
                      const processed = processTemplate();
                      return (
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-1">Title:</div>
                            <div className="text-sm text-gray-900">{processed.title}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-1">Description:</div>
                            <div className="text-sm text-gray-900 max-h-32 overflow-y-auto">
                              {processed.description}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-1">Tags:</div>
                            <div className="flex flex-wrap gap-1">
                              {processed.tags.map((tag, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Additional Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Suggested Price
                    </label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping Profile
                    </label>
                    <Input
                      value={formData.shippingProfile}
                      onChange={(e) => handleInputChange('shippingProfile', e.target.value)}
                      placeholder="Standard shipping"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Etsy Category
                    </label>
                    <Input
                      value={formData.etsyCategory}
                      onChange={(e) => handleInputChange('etsyCategory', e.target.value)}
                      placeholder="e.g., Style > Rings"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !formData.name || !formData.title || !formData.description}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isEditing ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </div>
    </div>
  );
};
