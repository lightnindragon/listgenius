'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Trash2, Copy, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
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
              <button
                onClick={() => toggleExpanded(generation.id)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                      {generation.title}
                    </h3>
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
              </button>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="pt-4 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Description</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generation.description)}
                          className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {generation.description}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Tags</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generation.tags.join(', '))}
                          className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
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
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Materials</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generation.materials.join(', '))}
                          className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
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
                    </div>
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
