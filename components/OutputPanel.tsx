'use client';

import React, { useState, useEffect } from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { CopyButtons } from './CopyButtons';
import { PublishToEtsyButton } from './PublishToEtsyButton';
import { formatWordCount } from '@/lib/utils';
import { isEnabled } from '@/lib/flags';
import { SkeletonText, SkeletonTitle } from '@/components/ui/Skeleton';
import { Save, Check, Edit3, X, Plus } from 'lucide-react';
import { emitTopRightToast } from './TopRightToast';

interface OutputPanelProps {
  title?: string;
  description?: string;
  tags?: string[];
  materials?: string[];
  pinterestCaption?: string;
  etsyMessage?: string;
  loading?: boolean;
  className?: string;
  listingId?: number; // For updating existing listings
  onContentChange?: (content: { title?: string; description?: string; tags?: string[]; materials?: string[] }) => void;
}

const OutputPanel: React.FC<OutputPanelProps> = ({
  title: initialTitle,
  description: initialDescription,
  tags: initialTags,
  materials: initialMaterials,
  pinterestCaption,
  etsyMessage,
  loading = false,
  className,
  listingId,
  onContentChange
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Editable state
  const [title, setTitle] = useState(initialTitle || '');
  const [description, setDescription] = useState(initialDescription || '');
  const [tags, setTags] = useState<string[]>(initialTags || []);
  const [materials, setMaterials] = useState<string[]>(initialMaterials || []);
  
  // Edit mode state
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [editingMaterials, setEditingMaterials] = useState(false);
  
  // Temporary edit values
  const [tempTitle, setTempTitle] = useState('');
  const [tempDescription, setTempDescription] = useState('');
  const [tempTags, setTempTags] = useState<string[]>([]);
  const [tempMaterials, setTempMaterials] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newMaterial, setNewMaterial] = useState('');

  // Update local state when props change (only on initial load or when props actually change)
  useEffect(() => {
    setTitle(initialTitle || '');
    setDescription(initialDescription || '');
    setTags(initialTags || []);
    setMaterials(initialMaterials || []);
  }, [initialTitle, initialDescription, initialTags, initialMaterials]);

  // Notify parent of content changes only when user makes edits (not on initial load)
  const notifyParent = (content: { title?: string; description?: string; tags?: string[]; materials?: string[] }) => {
    if (onContentChange) {
      onContentChange(content);
    }
  };

  // Edit functions
  const startEdit = (type: 'title' | 'description' | 'tags' | 'materials') => {
    switch (type) {
      case 'title':
        setTempTitle(title);
        setEditingTitle(true);
        break;
      case 'description':
        setTempDescription(description);
        setEditingDescription(true);
        break;
      case 'tags':
        setTempTags([...tags]);
        setEditingTags(true);
        break;
      case 'materials':
        setTempMaterials([...materials]);
        setEditingMaterials(true);
        break;
    }
  };

  const cancelEdit = (type: 'title' | 'description' | 'tags' | 'materials') => {
    switch (type) {
      case 'title':
        setEditingTitle(false);
        setTempTitle('');
        break;
      case 'description':
        setEditingDescription(false);
        setTempDescription('');
        break;
      case 'tags':
        setEditingTags(false);
        setTempTags([]);
        setNewTag('');
        break;
      case 'materials':
        setEditingMaterials(false);
        setTempMaterials([]);
        setNewMaterial('');
        break;
    }
  };

  const saveEdit = (type: 'title' | 'description' | 'tags' | 'materials') => {
    switch (type) {
      case 'title':
        setTitle(tempTitle);
        setEditingTitle(false);
        setTempTitle('');
        notifyParent({ title: tempTitle, description, tags, materials });
        break;
      case 'description':
        setDescription(tempDescription);
        setEditingDescription(false);
        setTempDescription('');
        notifyParent({ title, description: tempDescription, tags, materials });
        break;
      case 'tags':
        setTags(tempTags);
        setEditingTags(false);
        setTempTags([]);
        setNewTag('');
        notifyParent({ title, description, tags: tempTags, materials });
        break;
      case 'materials':
        setMaterials(tempMaterials);
        setEditingMaterials(false);
        setTempMaterials([]);
        setNewMaterial('');
        notifyParent({ title, description, tags, materials: tempMaterials });
        break;
    }
  };

  const addTag = () => {
    if (newTag.trim() && tempTags.length < 13) {
      setTempTags([...tempTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setTempTags(tempTags.filter((_, i) => i !== index));
  };

  const addMaterial = () => {
    if (newMaterial.trim() && tempMaterials.length < 13) {
      setTempMaterials([...tempMaterials, newMaterial.trim()]);
      setNewMaterial('');
    }
  };

  const removeMaterial = (index: number) => {
    setTempMaterials(tempMaterials.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title || !description) {
      emitTopRightToast('Please generate a listing first', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          tags: tags || [],
          materials: materials || [],
          tone: 'Professional', // Default tone
          wordCount: description.split(' ').length
        }),
      });

      if (response.ok) {
        setIsSaved(true);
        emitTopRightToast('Listing saved successfully!', 'success');
        setTimeout(() => setIsSaved(false), 2000);
      } else {
        const errorData = await response.json();
        emitTopRightToast(errorData.error || 'Failed to save listing', 'error');
      }
    } catch (error) {
      console.error('Error saving listing:', error);
      emitTopRightToast('Failed to save listing', 'error');
    } finally {
      setIsSaving(false);
    }
  };
  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Generated Listing</h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Title</h4>
            <SkeletonTitle />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</h4>
            <SkeletonText lines={8} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Tags</h4>
            <SkeletonText lines={2} />
          </div>
        </div>
      </div>
    );
  }

  if (!title && !description && (!tags || tags.length === 0)) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Generated Listing</h3>
        <div className="text-center py-12">
          <p className="text-gray-500">Your generated listing will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Generated Listing</h3>
      
      <div className="space-y-6">
        {title && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Title</h4>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">{formatWordCount(title)}</span>
                {!editingTitle && (
                  <button
                    onClick={() => startEdit('title')}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit title"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              {editingTitle ? (
                <div className="space-y-3">
                  <textarea
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Enter your title..."
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => saveEdit('title')}
                      size="sm"
                      variant="primary"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      onClick={() => cancelEdit('title')}
                      size="sm"
                      variant="outline"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-lg font-medium text-gray-900">{title}</p>
              )}
            </div>
          </div>
        )}

        {description && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Description</h4>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">{formatWordCount(description)}</span>
                {!editingDescription && (
                  <button
                    onClick={() => startEdit('description')}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit description"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              {editingDescription ? (
                <div className="space-y-3">
                  <textarea
                    value={tempDescription}
                    onChange={(e) => setTempDescription(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={8}
                    placeholder="Enter your description..."
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => saveEdit('description')}
                      size="sm"
                      variant="primary"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      onClick={() => cancelEdit('description')}
                      size="sm"
                      variant="outline"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-700 space-y-3">
                  {description.split(/\n\n+/).map((paragraph, idx) => (
                    paragraph.trim() && (
                      <p key={idx} className="leading-relaxed">
                        {paragraph.trim()}
                      </p>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tags && tags.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tags</h4>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">{tags.length}/13 tags</span>
                {!editingTags && (
                  <button
                    onClick={() => startEdit('tags')}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit tags"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              {editingTags ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {tempTags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium border border-blue-200 flex items-center space-x-1"
                      >
                        <span>{tag}</span>
                        <button
                          onClick={() => removeTag(index)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {tempTags.length < 13 && (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add new tag..."
                      />
                      <Button
                        onClick={addTag}
                        size="sm"
                        variant="outline"
                        disabled={!newTag.trim()}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => saveEdit('tags')}
                      size="sm"
                      variant="primary"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      onClick={() => cancelEdit('tags')}
                      size="sm"
                      variant="outline"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium border border-blue-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {materials && materials.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Materials</h4>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">{materials.length}/13 materials</span>
                {!editingMaterials && (
                  <button
                    onClick={() => startEdit('materials')}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit materials"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              {editingMaterials ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {tempMaterials.map((material, index) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200 flex items-center space-x-1"
                      >
                        <span>{material}</span>
                        <button
                          onClick={() => removeMaterial(index)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {tempMaterials.length < 13 && (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMaterial}
                        onChange={(e) => setNewMaterial(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addMaterial()}
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add new material..."
                      />
                      <Button
                        onClick={addMaterial}
                        size="sm"
                        variant="outline"
                        disabled={!newMaterial.trim()}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => saveEdit('materials')}
                      size="sm"
                      variant="primary"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      onClick={() => cancelEdit('materials')}
                      size="sm"
                      variant="outline"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {materials.map((material, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200"
                    >
                      {material}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {pinterestCaption && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Pinterest Caption</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{pinterestCaption}</p>
            </div>
          </div>
        )}

        {etsyMessage && isEnabled('etsy') && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Etsy Thank You Message</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{etsyMessage}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Copy Content</h4>
          <CopyButtons
            title={title}
            description={description}
            tags={tags}
            materials={materials}
            pinterestCaption={pinterestCaption}
            etsyMessage={etsyMessage}
          />
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Save Generation</h4>
          <Button
            onClick={handleSave}
            loading={isSaving}
            disabled={isSaving || isSaved || !title || !description}
            className="w-full"
            variant="primary"
          >
            {isSaving ? (
              'Saving...'
            ) : isSaved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Generation
              </>
            )}
          </Button>
          <p className="mt-2 text-sm text-gray-500">
            Save this generation to access it later from your saved listings
          </p>
        </div>

        {isEnabled('etsy') && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Publish to Etsy</h4>
            <PublishToEtsyButton
              title={title || ''}
              description={description || ''}
              tags={tags || []}
              materials={materials}
              listingId={listingId}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export { OutputPanel };
