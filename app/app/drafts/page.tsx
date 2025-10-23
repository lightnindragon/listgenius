'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { TopRightToast, emitTopRightToast } from '@/components/TopRightToast';
import { DraftCard } from '@/components/DraftCard';
import { 
  savedDraftsManager, 
  ListingDraft, 
  DraftStats 
} from '@/lib/saved-drafts';
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
  Clock,
  TrendingUp,
  Target,
  Eye,
  Edit3,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { getBaseUrl } from '@/lib/utils';

export default function DraftsPage() {
  const { user, isLoaded } = useUser();
  const [drafts, setDrafts] = useState<ListingDraft[]>([]);
  const [stats, setStats] = useState<DraftStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'auto-saved' | 'manual'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'completion'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedDrafts, setSelectedDrafts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user && isLoaded) {
      loadDrafts();
    }
  }, [user, isLoaded]);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const userDrafts = await savedDraftsManager.getUserDrafts(user?.id || '');
      const draftStats = await savedDraftsManager.getDraftStats(user?.id || '');
      
      setDrafts(userDrafts);
      setStats(draftStats);
    } catch (error) {
      console.error('Error loading drafts:', error);
      emitTopRightToast('Failed to load drafts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) {
      return;
    }

    setLoading(true);
    try {
      const success = await savedDraftsManager.deleteDraft(draftId, user?.id || '');
      if (success) {
        await loadDrafts();
        emitTopRightToast('Draft deleted successfully!', 'success');
      } else {
        emitTopRightToast('Failed to delete draft', 'error');
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      emitTopRightToast('Failed to delete draft', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateDraft = async (draftId: string) => {
    setLoading(true);
    try {
      const duplicated = await savedDraftsManager.duplicateDraft(draftId, user?.id || '');
      if (duplicated) {
        await loadDrafts();
        emitTopRightToast('Draft duplicated successfully!', 'success');
      } else {
        emitTopRightToast('Failed to duplicate draft', 'error');
      }
    } catch (error) {
      console.error('Error duplicating draft:', error);
      emitTopRightToast('Failed to duplicate draft', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueEditing = (draft: ListingDraft) => {
    // Navigate to generator with draft loaded
    const draftData = encodeURIComponent(JSON.stringify({
      id: draft.id,
      title: draft.title,
      description: draft.description,
      tags: draft.tags,
      keywords: draft.keywords,
      tone: draft.tone,
      niche: draft.niche,
      audience: draft.audience,
      wordCount: draft.wordCount,
      price: draft.price,
      quantity: draft.quantity,
      materials: draft.materials,
      shopSection: draft.shopSection,
      shippingProfile: draft.shippingProfile
    }));
    
    window.open(`/app/generator?draft=${draftData}`, '_blank');
  };

  const handleSelectDraft = (draftId: string) => {
    const newSelected = new Set(selectedDrafts);
    if (newSelected.has(draftId)) {
      newSelected.delete(draftId);
    } else {
      newSelected.add(draftId);
    }
    setSelectedDrafts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDrafts.size === filteredDrafts.length) {
      setSelectedDrafts(new Set());
    } else {
      setSelectedDrafts(new Set(filteredDrafts.map(d => d.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDrafts.size === 0) {
      emitTopRightToast('Please select drafts to delete', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedDrafts.size} drafts?`)) {
      return;
    }

    setLoading(true);
    try {
      const deletePromises = Array.from(selectedDrafts).map(draftId => 
        savedDraftsManager.deleteDraft(draftId, user?.id || '')
      );
      
      await Promise.all(deletePromises);
      setSelectedDrafts(new Set());
      await loadDrafts();
      emitTopRightToast(`${selectedDrafts.size} drafts deleted successfully!`, 'success');
    } catch (error) {
      console.error('Error bulk deleting drafts:', error);
      emitTopRightToast('Failed to delete drafts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredDrafts = drafts.filter(draft => {
    const matchesSearch = (draft.title || 'Untitled Draft').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         draft.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         draft.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         draft.niche?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'auto-saved' && draft.isAutoSaved) ||
                         (filterType === 'manual' && !draft.isAutoSaved);
    
    return matchesSearch && matchesFilter;
  });

  const sortedDrafts = [...filteredDrafts].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'updated':
        comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
        break;
      case 'created':
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
        break;
      case 'completion':
        comparison = a.completionPct - b.completionPct;
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleCleanupOldDrafts = async () => {
    if (!confirm('This will delete all auto-saved drafts older than 30 days. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      const deletedCount = await savedDraftsManager.cleanupOldDrafts(user?.id || '', 30);
      await loadDrafts();
      emitTopRightToast(`${deletedCount} old drafts cleaned up!`, 'success');
    } catch (error) {
      console.error('Error cleaning up old drafts:', error);
      emitTopRightToast('Failed to cleanup old drafts', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Sign in required
        </h1>
        <p className="text-gray-600 mb-6">
          Please sign in to access your drafts.
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Drafts</h1>
            <p className="text-gray-600">
              Manage your listing drafts and continue where you left off.
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => loadDrafts()}
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
              onClick={() => emitTopRightToast('Create new draft in the Generator page!', 'info')}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Draft
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalDrafts}</div>
                  <div className="text-sm text-gray-600">Total Drafts</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.autoSavedDrafts}</div>
                  <div className="text-sm text-gray-600">Auto-saved</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <Save className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.manuallySavedDrafts}</div>
                  <div className="text-sm text-gray-600">Manually Saved</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.averageCompletion}%</div>
                  <div className="text-sm text-gray-600">Avg Completion</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
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
            <div className="md:w-48">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy as any);
                  setSortOrder(newSortOrder as any);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="updated-desc">Last Updated (Newest)</option>
                <option value="updated-asc">Last Updated (Oldest)</option>
                <option value="created-desc">Created (Newest)</option>
                <option value="created-asc">Created (Oldest)</option>
                <option value="completion-desc">Completion (High to Low)</option>
                <option value="completion-asc">Completion (Low to High)</option>
              </select>
            </div>
            <Button
              onClick={handleCleanupOldDrafts}
              variant="outline"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Cleanup
            </Button>
          </div>

          {selectedDrafts.size > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedDrafts.size} drafts selected
                </span>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSelectAll}
                    variant="outline"
                    size="sm"
                  >
                    {selectedDrafts.size === filteredDrafts.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button
                    onClick={handleBulkDelete}
                    disabled={loading}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drafts Grid */}
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
        ) : filteredDrafts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <EmptyState
              icon={<FileText className="h-16 w-16 text-gray-400" />}
              title="No drafts found"
              description="No drafts match your search criteria or you haven't created any drafts yet."
              action={
                <div className="flex space-x-3">
                  <Button onClick={() => { setSearchTerm(''); setFilterType('all'); }}>
                    Clear Filters
                  </Button>
                  <Button onClick={() => window.open('/app/generator', '_blank')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Draft
                  </Button>
                </div>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedDrafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                isSelected={selectedDrafts.has(draft.id)}
                onSelect={() => handleSelectDraft(draft.id)}
                onContinueEditing={() => handleContinueEditing(draft)}
                onDuplicate={() => handleDuplicateDraft(draft.id)}
                onDelete={() => handleDeleteDraft(draft.id)}
              />
            ))}
          </div>
        )}

        {/* Help Text */}
        {drafts.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Auto-save Information</p>
                <p>
                  Drafts are automatically saved every 30 seconds while you're working on them in the Generator. 
                  Manual saves are preserved indefinitely, while auto-saved drafts older than 30 days are automatically cleaned up.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <TopRightToast />
    </DashboardLayout>
  );
}
