'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Trash2, Copy, ExternalLink, ChevronDown, ChevronRight, Edit3, Check, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface SavedGeneration {
  id: string;
  title: string;
  description: string;
  tags: string[];
  materials: string[];
  tone?: string;
  wordCount?: number;
  createdAt: string;
}

export default function SavedGenerationsClient() {
  const [generations, setGenerations] = useState<SavedGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  // Edit state for each generation
  const [editingItems, setEditingItems] = useState<Set<string>>(new Set());
  const [tempData, setTempData] = useState<Record<string, {
    title: string;
    description: string;
    tags: string[];
    materials: string[];
    newTag: string;
    newMaterial: string;
  }>>({});

  useEffect(() => {
    fetchGenerations();
  }, []);

  const fetchGenerations = async () => {
    try {
      const response = await fetch('/api/saved');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      if (!text) {
        console.warn('Empty response from /api/saved');
        setGenerations([]);
        return;
      }
      
      const data = JSON.parse(text);
      if (data.success) {
        setGenerations(data.data || []);
      } else {
        console.error('API returned error:', data.error);
        toast.error(data.error || 'Failed to load saved generations');
      }
    } catch (error) {
      console.error('Failed to fetch saved generations:', error);
      toast.error('Failed to load saved generations');
      setGenerations([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteGeneration = async (id: string) => {
    try {
      const response = await fetch(`/api/saved/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setGenerations(prev => prev.filter(gen => gen.id !== id));
        toast.success('Generation deleted successfully');
      } else {
        toast.error('Failed to delete generation');
      }
    } catch (error) {
      console.error('Failed to delete generation:', error);
      toast.error('Failed to delete generation');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const startEdit = (generation: SavedGeneration) => {
    setEditingItems(prev => new Set(prev).add(generation.id));
    setTempData(prev => ({
      ...prev,
      [generation.id]: {
        title: generation.title,
        description: generation.description,
        tags: [...generation.tags],
        materials: [...generation.materials],
        newTag: '',
        newMaterial: ''
      }
    }));
  };

  const cancelEdit = (id: string) => {
    setEditingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    setTempData(prev => {
      const newData = { ...prev };
      delete newData[id];
      return newData;
    });
  };

  const saveEdit = async (id: string) => {
    const tempItem = tempData[id];
    if (!tempItem) return;

    try {
      const response = await fetch(`/api/saved/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: tempItem.title,
          description: tempItem.description,
          tags: tempItem.tags,
          materials: tempItem.materials,
          tone: generations.find(g => g.id === id)?.tone,
          wordCount: tempItem.description.split(' ').length
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setGenerations(prev => prev.map(gen => 
          gen.id === id ? { ...gen, ...result.data } : gen
        ));
        cancelEdit(id);
        toast.success('Generation updated successfully');
      } else {
        toast.error('Failed to update generation');
      }
    } catch (error) {
      console.error('Failed to update generation:', error);
      toast.error('Failed to update generation');
    }
  };

  const updateTempData = (id: string, field: string, value: any) => {
    setTempData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const addTag = (id: string) => {
    const tempItem = tempData[id];
    if (tempItem && tempItem.newTag.trim() && tempItem.tags.length < 13) {
      updateTempData(id, 'tags', [...tempItem.tags, tempItem.newTag.trim()]);
      updateTempData(id, 'newTag', '');
    }
  };

  const removeTag = (id: string, index: number) => {
    const tempItem = tempData[id];
    if (tempItem) {
      updateTempData(id, 'tags', tempItem.tags.filter((_, i) => i !== index));
    }
  };

  const addMaterial = (id: string) => {
    const tempItem = tempData[id];
    if (tempItem && tempItem.newMaterial.trim() && tempItem.materials.length < 13) {
      updateTempData(id, 'materials', [...tempItem.materials, tempItem.newMaterial.trim()]);
      updateTempData(id, 'newMaterial', '');
    }
  };

  const removeMaterial = (id: string, index: number) => {
    const tempItem = tempData[id];
    if (tempItem) {
      updateTempData(id, 'materials', tempItem.materials.filter((_, i) => i !== index));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading saved generations...</div>
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Saved Generations</h2>
        <p className="text-gray-600 mb-4">
          Your saved generations will appear here. Generate some listings and save them to get started.
        </p>
        <Button asChild>
          <a href="/app/generator">Generate New Listing</a>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Saved Generations</h1>
        <Button 
          asChild 
          size="sm"
          className="bg-blue-600 text-white hover:bg-blue-700 md:size-md"
        >
          <a href="/app/generator">Generate New</a>
        </Button>
      </div>

      <div className="space-y-4">
        {generations.map((generation) => {
          const isExpanded = expandedItems.has(generation.id);
          
          return (
            <Card key={generation.id} className="overflow-hidden">
              {/* Accordion Header */}
              <div
                onClick={() => toggleExpanded(generation.id)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {editingItems.has(generation.id) ? (
                      <div className="mb-2">
                        <input
                          type="text"
                          value={tempData[generation.id]?.title || ''}
                          onChange={(e) => updateTempData(generation.id, 'title', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                          placeholder="Enter title..."
                        />
                      </div>
                    ) : (
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                        {generation.title}
                      </h3>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {generation.tone && (
                        <span>Tone: {generation.tone}</span>
                      )}
                      {generation.wordCount && (
                        <span>Words: {generation.wordCount}</span>
                      )}
                      <span>Saved: {new Date(generation.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!editingItems.has(generation.id) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(generation);
                        }}
                        className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        title="Edit generation"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(generation.description);
                      }}
                      className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGeneration(generation.id);
                      }}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="pt-4 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Description</h4>
                        {!editingItems.has(generation.id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(generation.description)}
                            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {editingItems.has(generation.id) ? (
                        <div className="space-y-3">
                          <textarea
                            value={tempData[generation.id]?.description || ''}
                            onChange={(e) => updateTempData(generation.id, 'description', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={6}
                            placeholder="Enter description..."
                          />
                        </div>
                      ) : (
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {generation.description}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Tags</h4>
                        {!editingItems.has(generation.id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(generation.tags.join(', '))}
                            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {editingItems.has(generation.id) ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {tempData[generation.id]?.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md flex items-center space-x-1"
                              >
                                <span>{tag}</span>
                                <button
                                  onClick={() => removeTag(generation.id, index)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                          {tempData[generation.id]?.tags.length < 13 && (
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={tempData[generation.id]?.newTag || ''}
                                onChange={(e) => updateTempData(generation.id, 'newTag', e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addTag(generation.id)}
                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Add new tag..."
                              />
                              <Button
                                onClick={() => addTag(generation.id)}
                                size="sm"
                                variant="outline"
                                disabled={!tempData[generation.id]?.newTag.trim()}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {generation.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Materials</h4>
                        {!editingItems.has(generation.id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(generation.materials.join(', '))}
                            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {editingItems.has(generation.id) ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {tempData[generation.id]?.materials.map((material, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md flex items-center space-x-1"
                              >
                                <span>{material}</span>
                                <button
                                  onClick={() => removeMaterial(generation.id, index)}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                          {tempData[generation.id]?.materials.length < 13 && (
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={tempData[generation.id]?.newMaterial || ''}
                                onChange={(e) => updateTempData(generation.id, 'newMaterial', e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addMaterial(generation.id)}
                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Add new material..."
                              />
                              <Button
                                onClick={() => addMaterial(generation.id)}
                                size="sm"
                                variant="outline"
                                disabled={!tempData[generation.id]?.newMaterial.trim()}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {generation.materials.map((material, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md"
                            >
                              {material}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Save/Cancel buttons when editing */}
                    {editingItems.has(generation.id) && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => saveEdit(generation.id)}
                            size="sm"
                            variant="primary"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Save Changes
                          </Button>
                          <Button
                            onClick={() => cancelEdit(generation.id)}
                            size="sm"
                            variant="outline"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
