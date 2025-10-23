'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Trash2, Copy, ExternalLink } from 'lucide-react';
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Saved Generations</h1>
        <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
          <a href="/app/generator">Generate New</a>
        </Button>
      </div>

      <div className="grid gap-6">
        {generations.map((generation) => (
          <Card key={generation.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generation.description)}
                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteGeneration(generation.id)}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {generation.description}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
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
                <h4 className="font-medium text-gray-900 mb-2">Materials</h4>
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
          </Card>
        ))}
      </div>
    </div>
  );
}
