'use client';

import React, { useState, useEffect } from 'react';
import { Download, Edit, Trash2, Upload as UploadIcon, Search, Filter, Grid, List as ListIcon, Maximize2, AlertCircle, CheckCircle, X, Copy, Wand2, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
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
  originalFilename?: string;
  mimeType?: string;
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
  const [selectedImage, setSelectedImage] = useState<SavedImage | null>(null);
  const [editingAltText, setEditingAltText] = useState('');
  const [editingFilename, setEditingFilename] = useState('');
  const [saving, setSaving] = useState(false);
  const [generatingAltText, setGeneratingAltText] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Set<string>>(new Set());
  const [upscalingImages, setUpscalingImages] = useState<Set<string>>(new Set());

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

  const handleUpscale = async (id: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    // Prevent double-clicking
    if (upscalingImages.has(id)) {
      return;
    }

    setUpscalingImages(prev => new Set(prev).add(id));
    
    try {
      const response = await fetch(`${getBaseUrl()}/api/images/${id}/upscale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Check if response is OK and has JSON content
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Handle non-JSON responses (like HTML error pages)
        const text = await response.text();
        console.error('Non-JSON response from upscale API:', {
          status: response.status,
          statusText: response.statusText,
          body: text.substring(0, 200),
        });
        
        if (response.status === 405) {
          emitTopRightToast('Upscale endpoint not found. Please check server configuration.', 'error');
        } else {
          emitTopRightToast(`Upscale failed: ${response.statusText} (${response.status})`, 'error');
        }
        return;
      }

      const result = await response.json();
      if (response.ok && result.success) {
        emitTopRightToast('Image upscaled successfully', 'success');
        await loadImages();
        if (onRefresh) onRefresh();
      } else {
        emitTopRightToast(result.error || 'Failed to upscale image', 'error');
      }
    } catch (error: any) {
      console.error('Upscale error:', error);
      if (error.message && error.message.includes('JSON')) {
        emitTopRightToast('Invalid response from server. The upscale endpoint may not be configured correctly.', 'error');
      } else {
        emitTopRightToast(`Failed to upscale image: ${error.message || 'Unknown error'}`, 'error');
      }
    } finally {
      setUpscalingImages(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleImageClick = (image: SavedImage) => {
    setSelectedImage(image);
    setEditingAltText(image.altText);
    setEditingFilename(image.filename);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
    setEditingAltText('');
    setEditingFilename('');
  };

  const handleSaveChanges = async () => {
    if (!selectedImage) return;

    // Validate alt text length (100-500 characters)
    if (editingAltText.length < 100) {
      emitTopRightToast('Alt text must be at least 100 characters', 'error');
      return;
    }
    if (editingAltText.length > 500) {
      emitTopRightToast('Alt text must be 500 characters or less', 'error');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/images/${selectedImage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          altText: editingAltText,
          filename: editingFilename,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        emitTopRightToast('Image updated successfully', 'success');
        loadImages();
        if (onRefresh) onRefresh();
        handleCloseModal();
      } else {
        emitTopRightToast(result.error || 'Failed to update image', 'error');
      }
    } catch (error) {
      console.error('Update error:', error);
      emitTopRightToast('Failed to update image', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAltText = async () => {
    if (!selectedImage) return;

    setGeneratingAltText(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/generate-alt-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: selectedImage.url,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setEditingAltText(result.data.altText);
        emitTopRightToast('Alt text generated!', 'success');
      } else {
        emitTopRightToast(result.error || 'Failed to generate alt text', 'error');
      }
    } catch (error) {
      console.error('Generate alt text error:', error);
      emitTopRightToast('Failed to generate alt text', 'error');
    } finally {
      setGeneratingAltText(false);
    }
  };

  const handleCopyAltText = () => {
    navigator.clipboard.writeText(editingAltText);
    emitTopRightToast('Alt text copied to clipboard!', 'success');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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
              className={`border rounded-lg overflow-hidden bg-white cursor-pointer hover:shadow-lg transition-shadow ${
                viewMode === 'grid' ? '' : 'flex'
              }`}
              onClick={() => handleImageClick(image)}
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
                <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(image)}
                    title="Download image"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(image.altText);
                      setCopiedStates(new Set([image.id]));
                      setTimeout(() => {
                        setCopiedStates(new Set());
                      }, 2000);
                    }}
                    title="Copy alt text to clipboard"
                  >
                    {copiedStates.has(image.id) ? (
                      <span className="text-xs">Copied!</span>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  {image.quality === 'poor' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleUpscale(image.id, e)}
                      disabled={upscalingImages.has(image.id)}
                      title="Upscale image"
                    >
                      {upscalingImages.has(image.id) ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="ml-1">Upscaling...</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-4 h-4" />
                          Upscale
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(image.id)}
                    title="Delete image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Detail Modal */}
      {selectedImage ? (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col min-h-[400px]"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: 'white' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white" style={{ backgroundColor: 'white' }}>
              <div>
                <h2 className="text-xl font-semibold text-gray-900" style={{ color: '#111827' }}>Image Details</h2>
                <p className="text-sm text-gray-600 mt-1" style={{ color: '#4B5563' }}>
                  View and edit image information, alt text, and metadata.
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1" style={{ backgroundColor: 'white', color: '#111827' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Preview */}
                <div>
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.altText}
                      className="w-full rounded-lg border border-gray-200"
                    />
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dimensions:</span>
                        <span className="font-medium">{selectedImage.width}×{selectedImage.height}px</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">File Size:</span>
                        <span className="font-medium">{formatFileSize(selectedImage.fileSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quality:</span>
                        <span className={`font-medium ${selectedImage.quality === 'high' ? 'text-green-600' : 'text-orange-600'}`}>
                          {selectedImage.quality === 'high' ? 'High' : 'Low (needs upscale)'}
                        </span>
                      </div>
                      {selectedImage.mimeType && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium">{selectedImage.mimeType}</span>
                        </div>
                      )}
                    </div>
                  </div>

                {/* Edit Form */}
                <div className="space-y-4">
                  {/* Filename */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filename
                    </label>
                    <Input
                      value={editingFilename}
                      onChange={(e) => setEditingFilename(e.target.value)}
                      placeholder="Enter filename"
                    />
                  </div>

                  {/* Alt Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alt Text <span className="text-gray-500 text-xs">(100-500 characters)</span>
                    </label>
                    <Textarea
                      value={editingAltText}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow up to 500 characters
                        if (value.length <= 500) {
                          setEditingAltText(value);
                        }
                      }}
                      placeholder="Enter descriptive alt text (100-500 characters)"
                      rows={4}
                      maxLength={500}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-xs ${
                        editingAltText.length < 100 
                          ? 'text-orange-600' 
                          : editingAltText.length > 500 
                          ? 'text-red-600' 
                          : 'text-gray-500'
                      }`}>
                        {editingAltText.length}/500 characters {editingAltText.length < 100 && '(Minimum 100 required)'}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateAltText}
                          disabled={generatingAltText}
                        >
                          {generatingAltText ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Wand2 className="w-4 h-4" />
                          )}
                          Generate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyAltText}
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSaveChanges}
                      disabled={saving || editingAltText.length < 100 || editingAltText.length > 500}
                      className="flex-1"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCloseModal}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

