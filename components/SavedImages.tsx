'use client';

import React, { useState, useEffect } from 'react';
import { Download, Edit, Trash2, Upload as UploadIcon, Search, Filter, Grid, List as ListIcon, Maximize2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { emitTopRightToast } from './TopRightToast';
import { getBaseUrl } from '@/lib/utils';

interface SavedImage {
  id: string;
  filename: string;
  altText: string;
  url: string;
  width: number;
  height: number;
  quality: 'poor' | 'high';
  fileSize: number;
  createdAt: string;
  expiresAt: string;
  upscaledAt?: string;
}

interface SavedImagesProps {
  onRefresh?: () => void;
}

export const SavedImages: React.FC<SavedImagesProps> = ({ onRefresh }) => {
  const [images, setImages] = useState<SavedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterQuality, setFilterQuality] = useState<'all' | 'poor' | 'high'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/images`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setImages(result.data.images);
        }
      }
    } catch (error) {
      console.error('Failed to load images:', error);
      emitTopRightToast('Failed to load images', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`${getBaseUrl()}/api/images/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        emitTopRightToast('Image deleted successfully', 'success');
        loadImages();
        if (onRefresh) onRefresh();
      } else {
        emitTopRightToast('Failed to delete image', 'error');
      }
    } catch (error) {
      console.error('Delete error:', error);
      emitTopRightToast('Failed to delete image', 'error');
    }
  };

  const handleDownload = async (image: SavedImage) => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/images/${image.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = image.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        emitTopRightToast('Image downloaded', 'success');
      }
    } catch (error) {
      console.error('Download error:', error);
      emitTopRightToast('Failed to download image', 'error');
    }
  };

  const handleUpscale = async (id: string) => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/images/${id}/upscale`, {
        method: 'POST',
      });

      const result = await response.json();
      if (response.ok && result.success) {
        emitTopRightToast('Image upscaled successfully', 'success');
        loadImages();
        if (onRefresh) onRefresh();
      } else {
        emitTopRightToast(result.error || 'Failed to upscale image', 'error');
      }
    } catch (error) {
      console.error('Upscale error:', error);
      emitTopRightToast('Failed to upscale image', 'error');
    }
  };

  const filteredImages = images.filter(img => {
    const matchesSearch = search === '' || 
      img.filename.toLowerCase().includes(search.toLowerCase()) ||
      img.altText.toLowerCase().includes(search.toLowerCase());
    const matchesQuality = filterQuality === 'all' || img.quality === filterQuality;
    return matchesSearch && matchesQuality;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading images...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Saved Images ({images.length})</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <ListIcon className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search images..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterQuality}
          onChange={(e) => setFilterQuality(e.target.value as any)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Quality</option>
          <option value="high">High Quality</option>
          <option value="poor">Poor Quality</option>
        </select>
      </div>

      {/* Images Grid/List */}
      {filteredImages.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {images.length === 0 ? 'No images uploaded yet' : 'No images match your filters'}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
          : 'space-y-4'
        }>
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className={`border rounded-lg overflow-hidden bg-white ${
                viewMode === 'grid' ? '' : 'flex'
              }`}
            >
              <div className={viewMode === 'grid' ? 'relative' : 'w-32 h-32 flex-shrink-0'}>
                <img
                  src={image.url}
                  alt={image.altText}
                  className={`w-full ${
                    viewMode === 'grid' ? 'h-48' : 'h-full'
                  } object-cover`}
                />
                <div className="absolute top-2 left-2">
                  {image.quality === 'high' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  )}
                </div>
              </div>
              <div className="p-4 flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm truncate">{image.filename}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {image.width}x{image.height}px
                    </p>
                    {image.quality === 'poor' && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ Etsy prefers images ≥2000x2000px for better SEO
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{image.altText}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(image)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {image.quality === 'poor' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpscale(image.id)}
                    >
                      <Maximize2 className="w-4 h-4" />
                      Upscale
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(image.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

