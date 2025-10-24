'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { TopRightToast, emitTopRightToast } from '@/components/TopRightToast';
import { TemplateCard } from '@/components/TemplateCard';
import { TemplateEditor } from '@/components/TemplateEditor';
import { 
  listingTemplatesManager, 
  ListingTemplate, 
  templateCategories 
} from '@/lib/listing-templates';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  RefreshCw,
  Download,
  Upload,
  Star,
  Clock,
  TrendingUp,
  Target,
  Eye,
  Edit3,
  Copy,
  Trash2
} from 'lucide-react';
import { getBaseUrl } from '@/lib/utils';

export default function TemplatesPage() {
  const { user, isLoaded } = useUser();
  const [templates, setTemplates] = useState<ListingTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ListingTemplate | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user && isLoaded) {
      loadTemplates();
    }
  }, [user, isLoaded]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const userTemplates = await listingTemplatesManager.getUserTemplates(user?.id || '');
      const builtInTemplates = await listingTemplatesManager.getBuiltInTemplates();
      setTemplates([...userTemplates, ...builtInTemplates]);
    } catch (error) {
      console.error('Error loading templates:', error);
      emitTopRightToast('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (templateData: Partial<ListingTemplate>) => {
    setLoading(true);
    try {
      await listingTemplatesManager.saveListingAsTemplate(
        user?.id || '',
        {
          title: templateData.title || '',
          description: templateData.description || '',
          tags: templateData.tags || [],
          price: templateData.price,
          materials: templateData.materials || [],
          category: templateData.category || 'custom'
        },
        templateData.name || 'New Template',
        templateData.description
      );
      
      setShowCreateModal(false);
      await loadTemplates();
      emitTopRightToast('Template created successfully!', 'success');
    } catch (error) {
      console.error('Error creating template:', error);
      emitTopRightToast('Failed to create template', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = async (templateId: string, updates: Partial<ListingTemplate>) => {
    setLoading(true);
    try {
      await listingTemplatesManager.updateTemplate(templateId, user?.id || '', updates);
      setEditingTemplate(null);
      await loadTemplates();
      emitTopRightToast('Template updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating template:', error);
      emitTopRightToast('Failed to update template', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    setLoading(true);
    try {
      const success = await listingTemplatesManager.deleteTemplate(templateId, user?.id || '');
      if (success) {
        await loadTemplates();
        emitTopRightToast('Template deleted successfully!', 'success');
      } else {
        emitTopRightToast('Failed to delete template', 'error');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      emitTopRightToast('Failed to delete template', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    setLoading(true);
    try {
      const duplicated = await listingTemplatesManager.duplicateTemplate(templateId, user?.id || '');
      if (duplicated) {
        await loadTemplates();
        emitTopRightToast('Template duplicated successfully!', 'success');
      } else {
        emitTopRightToast('Failed to duplicate template', 'error');
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      emitTopRightToast('Failed to duplicate template', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = (template: ListingTemplate) => {
    // Navigate to generator with template loaded
    const templateData = encodeURIComponent(JSON.stringify({
      id: template.id,
      title: template.title,
      description: template.description,
      tags: template.tags,
      tone: 'Professional',
      niche: template.etsyCategory || '',
      audience: 'General',
      wordCount: 300,
      price: template.price,
      materials: template.materials
    }));
    
    window.open(`/app/generator?template=${templateData}`, '_blank');
  };

  const handleSelectTemplate = (templateId: string) => {
    const newSelected = new Set(selectedTemplates);
    if (newSelected.has(templateId)) {
      newSelected.delete(templateId);
    } else {
      newSelected.add(templateId);
    }
    setSelectedTemplates(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTemplates.size === filteredTemplates.length) {
      setSelectedTemplates(new Set());
    } else {
      setSelectedTemplates(new Set(filteredTemplates.map(t => t.id)));
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const userTemplates = templates.filter(t => !t.isBuiltIn);
  const builtInTemplates = templates.filter(t => t.isBuiltIn);

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Sign in required
        </h1>
        <p className="text-gray-600 mb-6">
          Please sign in to access your templates.
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Listing Templates</h1>
            <p className="text-gray-600">
              Save and reuse listing configurations to speed up your listing creation process.
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => loadTemplates()}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{userTemplates.length}</div>
                <div className="text-sm text-gray-600">Your Templates</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{builtInTemplates.length}</div>
                <div className="text-sm text-gray-600">Built-in Templates</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {userTemplates.reduce((sum, t) => sum + t.usageCount, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Uses</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {userTemplates.length > 0 ? new Date(Math.max(...userTemplates.map(t => t.updatedAt.getTime()))).toLocaleDateString() : 'None'}
                </div>
                <div className="text-sm text-gray-600">Last Updated</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
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
                {templateCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-brand-100 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-brand-100 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {selectedTemplates.size > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedTemplates.size} templates selected
                </span>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSelectAll}
                    variant="outline"
                    size="sm"
                  >
                    {selectedTemplates.size === filteredTemplates.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button
                    onClick={() => emitTopRightToast('Bulk actions coming soon!', 'info')}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Templates Grid/List */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <EmptyState
              icon={<FileText className="h-16 w-16 text-gray-400" />}
              title="No templates found"
              description="No templates match your search criteria or you haven't created any templates yet."
              action={
                <div className="flex space-x-3">
                  <Button onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}>
                    Clear Filters
                  </Button>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Template
                  </Button>
                </div>
              }
            />
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                viewMode={viewMode}
                isSelected={selectedTemplates.has(template.id)}
                onSelect={() => handleSelectTemplate(template.id)}
                onUse={() => handleUseTemplate(template)}
                onEdit={() => setEditingTemplate(template)}
                onDuplicate={() => handleDuplicateTemplate(template.id)}
                onDelete={() => handleDeleteTemplate(template.id)}
                canEdit={!template.isBuiltIn && template.userId === user?.id}
                canDelete={!template.isBuiltIn && template.userId === user?.id}
              />
            ))}
          </div>
        )}

        {/* Create Template Modal */}
        {showCreateModal && (
          <TemplateEditor
            onSave={handleCreateTemplate}
            onCancel={() => setShowCreateModal(false)}
            loading={loading}
          />
        )}

        {/* Edit Template Modal */}
        {editingTemplate && (
          <TemplateEditor
            template={editingTemplate}
            onSave={(updates) => handleEditTemplate(editingTemplate.id, updates)}
            onCancel={() => setEditingTemplate(null)}
            loading={loading}
          />
        )}
      </div>
      
      <TopRightToast />
    </DashboardLayout>
  );
}
