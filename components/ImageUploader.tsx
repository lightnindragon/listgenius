'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Upload, X, CheckCircle, AlertCircle, Loader2, Image as ImageIcon, 
  Download, Star, StarOff, Maximize2, Minimize2, Search, Filter,
  Settings2, ZoomIn, RefreshCw, Tag, FolderOpen, Trash2,
  ImageUp, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { emitTopRightToast } from './TopRightToast';
import { getBaseUrl } from '@/lib/utils';

interface UploadedImage {
  id: string;
  filename: string;
  originalFilename: string;
  altText: string;
  url: string;
  width: number;
  height: number;
  quality: 'poor' | 'high';
  needsUpscale?: boolean;
  expiresAt: string;
  createdAt: string;
  fileSize: number;
  mimeType: string;
  tags?: string[];
  category?: string;
  isFavorite?: boolean;
  downloadCount?: number;
  moderationStatus?: 'approved' | 'rejected' | 'pending';
  originalWidth?: number;
  originalHeight?: number;
  upscaledAt?: string;
}

interface ImageUploaderProps {
  onUploadSuccess?: (images: UploadedImage[]) => void;
  maxImages?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploadSuccess,
  maxImages = 20,
}) => {
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gallery state
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  // Filtering/Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [qualityFilter, setQualityFilter] = useState<'all' | 'poor' | 'high'>('all');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<{from?: string, to?: string}>({});
  const [fileSizeFilter, setFileSizeFilter] = useState<{min?: number, max?: number}>({});
  const [sortBy, setSortBy] = useState<'createdAt' | 'size' | 'quality' | 'filename'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Usage statistics
  const [usageStats, setUsageStats] = useState<{
    dailyCount: number;
    dailyLimit: number | 'unlimited';
    lifetimeCount: number;
    plan: string;
  } | null>(null);

  // Modal state
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(null);
  const [editingImage, setEditingImage] = useState<UploadedImage | null>(null);
  const [optimizingImage, setOptimizingImage] = useState<UploadedImage | null>(null);
  const [editForm, setEditForm] = useState({
    filename: '',
    altText: '',
    tags: [] as string[],
    category: '',
    isFavorite: false,
  });
  const [optimizeForm, setOptimizeForm] = useState({
    width: '',
    height: '',
    format: 'jpeg' as 'jpeg' | 'png' | 'webp',
    quality: 85,
  });

  // Processing state
  const [processingImage, setProcessingImage] = useState<string | null>(null);
  const [bulkOperation, setBulkOperation] = useState<'convert' | 'export' | null>(null);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<{
    hasDuplicates: boolean;
    duplicates: Array<{id: string; filename: string; createdAt: string}>;
  } | null>(null);

  // Load images when filters change
  useEffect(() => {
    loadImages();
  }, [qualityFilter, sortBy, sortOrder, searchQuery, tagFilter, dateRangeFilter.from, dateRangeFilter.to, fileSizeFilter.min, fileSizeFilter.max]);
  
  // Load stats on mount only (not dependent on filters)
  useEffect(() => {
    loadUsageStats();
  }, []);
  
  const loadUsageStats = async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/user/metadata`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const plan = result.data.plan || 'free';
          const dailyCount = result.data.dailyImageUploadCount || 0;
          const lifetimeCount = result.data.lifetimeImageUploads || 0;
          
          // Get limit based on plan
          let dailyLimit: number | 'unlimited' = 20;
          if (plan === 'pro') dailyLimit = 1000;
          else if (plan === 'business') dailyLimit = 4000;
          else if (plan === 'agency') dailyLimit = 'unlimited';
          
          setUsageStats({
            dailyCount,
            dailyLimit,
            lifetimeCount,
            plan,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  };

  const loadImages = async () => {
    setLoadingImages(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        sortBy,
        sortOrder,
      });
      
      if (qualityFilter !== 'all') {
        params.append('quality', qualityFilter);
      }
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (tagFilter) {
        params.append('tags', tagFilter);
      }

      const response = await fetch(`${getBaseUrl()}/api/images?${params}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          let images = result.data.images || [];
          
          // Apply client-side filters (date range, file size)
          if (dateRangeFilter.from || dateRangeFilter.to) {
            images = images.filter((img: UploadedImage) => {
              // Note: Using expiresAt as createdAt might not be in response
              // In production, ensure createdAt is included in API response
              // Use createdAt if available, otherwise calculate from expiresAt
              const imgDate = img.createdAt ? new Date(img.createdAt) : (img.expiresAt ? new Date(new Date(img.expiresAt).getTime() - 24 * 60 * 60 * 1000) : new Date());
              if (dateRangeFilter.from) {
                const fromDate = new Date(dateRangeFilter.from);
                fromDate.setHours(0, 0, 0, 0);
                if (imgDate < fromDate) return false;
              }
              if (dateRangeFilter.to) {
                const toDate = new Date(dateRangeFilter.to);
                toDate.setHours(23, 59, 59, 999);
                if (imgDate > toDate) return false;
              }
              return true;
            });
          }
          
          if (fileSizeFilter.min || fileSizeFilter.max) {
            images = images.filter((img: UploadedImage) => {
              const sizeMB = img.fileSize / 1024 / 1024;
              if (fileSizeFilter.min && sizeMB < fileSizeFilter.min) return false;
              if (fileSizeFilter.max && sizeMB > fileSizeFilter.max) return false;
              return true;
            });
          }
          
          setUploadedImages(images);
        }
      }
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  }, []);

  const handleFiles = (newFiles: File[]) => {
    const imageFiles = newFiles.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      emitTopRightToast('Please select image files only', 'error');
      return;
    }

    const maxFileSize = 100 * 1024 * 1024;
    const oversizedFiles = imageFiles.filter(file => file.size > maxFileSize);
    
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => f.name).join(', ');
      const maxMB = (maxFileSize / 1024 / 1024).toFixed(0);
      emitTopRightToast(
        `${oversizedFiles.length} file(s) exceed ${maxMB}MB limit: ${fileNames.substring(0, 50)}...`,
        'error'
      );
      return;
    }

    const totalFiles = files.length + imageFiles.length;
    if (totalFiles > maxImages) {
      emitTopRightToast(`Maximum ${maxImages} images allowed`, 'error');
      const allowed = maxImages - files.length;
      setFiles([...files, ...imageFiles.slice(0, allowed)]);
    } else {
      setFiles([...files, ...imageFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      emitTopRightToast('Please select at least one image', 'error');
      return;
    }

    const maxFileSize = 100 * 1024 * 1024;
    const oversizedFiles = files.filter(file => file.size > maxFileSize);
    
    if (oversizedFiles.length > 0) {
      emitTopRightToast('Some files are too large (>100MB). Please compress these images.', 'error');
      return;
    }

    setUploading(true);
    
    try {
      const uploadedImages: UploadedImage[] = [];
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const { upload } = await import('@vercel/blob/client');
          
          const blob = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: `${getBaseUrl()}/api/images/upload-url`,
            multipart: true,
          });

          const blobUrl = blob.url;
          const blobKey = blob.pathname;

          const dimensions = await new Promise<{width: number, height: number}>((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
              resolve({ width: img.width, height: img.height });
              URL.revokeObjectURL(url);
            };
            img.onerror = () => resolve({ width: 0, height: 0 });
            img.src = url;
          });

          const completeResponse = await fetch(`${getBaseUrl()}/api/images/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              blobUrl,
              blobKey,
              originalFilename: file.name,
              width: dimensions.width,
              height: dimensions.height,
              fileSize: file.size,
              mimeType: file.type,
            }),
          });

          if (!completeResponse.ok) {
            failedCount++;
            continue;
          }

          const result = await completeResponse.json();

          if (result.success && result.data) {
            uploadedImages.push(result.data);
            successCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          console.error(`Upload error for ${file.name}:`, error);
          failedCount++;
        }
      }

      if (successCount > 0) {
        emitTopRightToast(
          `Successfully uploaded ${successCount} of ${files.length} image(s)`,
          successCount === files.length ? 'success' : 'error'
        );
        setFiles([]);
        loadImages();
        loadUsageStats(); // Refresh usage stats after upload
        if (onUploadSuccess) {
          onUploadSuccess(uploadedImages);
        }
      } else {
        emitTopRightToast('Failed to upload all images. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      emitTopRightToast(`Failed to upload images: ${(error as Error).message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  // Image actions
  const handleUpscale = async (imageId: string) => {
    setProcessingImage(imageId);
    try {
      const response = await fetch(`${getBaseUrl()}/api/images/${imageId}/upscale`, {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        emitTopRightToast('Image upscaled successfully!', 'success');
        loadImages();
      } else {
        emitTopRightToast(result.error || 'Failed to upscale image', 'error');
      }
    } catch (error) {
      emitTopRightToast('Failed to upscale image', 'error');
    } finally {
      setProcessingImage(null);
    }
  };

  const handleCompress = async (imageId: string, quality: number = 85) => {
    setProcessingImage(imageId);
    try {
      const response = await fetch(`${getBaseUrl()}/api/images/${imageId}/compress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quality }),
      });
      const result = await response.json();
      
      if (result.success) {
        emitTopRightToast(
          `Image compressed! Size reduced by ${result.data.compressionRatio.toFixed(1)}%`,
          'success'
        );
        loadImages();
      } else {
        emitTopRightToast(result.error || 'Failed to compress image', 'error');
      }
    } catch (error) {
      emitTopRightToast('Failed to compress image', 'error');
    } finally {
      setProcessingImage(null);
    }
  };

  const handleOptimize = async (
    imageId: string,
    options: { width?: number; height?: number; format?: 'jpeg' | 'png' | 'webp'; quality?: number }
  ) => {
    setProcessingImage(imageId);
    try {
      const response = await fetch(`${getBaseUrl()}/api/images/${imageId}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      const result = await response.json();
      
      if (result.success) {
        emitTopRightToast('Image optimized successfully!', 'success');
        loadImages();
        if (previewImage?.id === imageId) {
          setPreviewImage(result.data);
        }
      } else {
        emitTopRightToast(result.error || 'Failed to optimize image', 'error');
      }
    } catch (error) {
      emitTopRightToast('Failed to optimize image', 'error');
    } finally {
      setProcessingImage(null);
    }
  };

  const handleDownload = async (imageId: string, filename: string) => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/images/${imageId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        emitTopRightToast('Image downloaded', 'success');
        loadImages();
      }
    } catch (error) {
      emitTopRightToast('Failed to download image', 'error');
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    try {
      const response = await fetch(`${getBaseUrl()}/api/images/${imageId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        emitTopRightToast('Image deleted', 'success');
        loadImages();
      } else {
        emitTopRightToast(result.error || 'Failed to delete image', 'error');
      }
    } catch (error) {
      emitTopRightToast('Failed to delete image', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) return;
    if (!confirm(`Delete ${selectedImages.size} image(s)?`)) return;

    const promises = Array.from(selectedImages).map(id => 
      fetch(`${getBaseUrl()}/api/images/${id}`, { method: 'DELETE' })
    );
    
    await Promise.all(promises);
    emitTopRightToast(`Deleted ${selectedImages.size} image(s)`, 'success');
    setSelectedImages(new Set());
    loadImages();
  };

  const handleToggleFavorite = async (imageId: string, currentValue: boolean) => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/images/${imageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !currentValue }),
      });
      
      if (response.ok) {
        loadImages();
      }
    } catch (error) {
      emitTopRightToast('Failed to update favorite status', 'error');
    }
  };

  const handleEdit = (image: UploadedImage) => {
    setEditingImage(image);
    setEditForm({
      filename: image.filename,
      altText: image.altText,
      tags: image.tags || [],
      category: image.category || '',
      isFavorite: image.isFavorite || false,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingImage) return;

    try {
      const response = await fetch(`${getBaseUrl()}/api/images/${editingImage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      
      const result = await response.json();
      
      if (result.success) {
        emitTopRightToast('Image updated successfully', 'success');
        setEditingImage(null);
        loadImages();
      } else {
        emitTopRightToast(result.error || 'Failed to update image', 'error');
      }
    } catch (error) {
      emitTopRightToast('Failed to update image', 'error');
    }
  };

  const toggleImageSelection = (imageId: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  const handleBulkConvert = async (format: 'jpeg' | 'png' | 'webp', quality: number) => {
    if (selectedImages.size === 0) return;
    
    setProcessingImage('bulk');
    try {
      const promises = Array.from(selectedImages).map(id =>
        fetch(`${getBaseUrl()}/api/images/${id}/optimize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format, quality }),
        })
      );
      
      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.ok).length;
      
      emitTopRightToast(
        `Converted ${successCount} of ${selectedImages.size} image(s) to ${format.toUpperCase()}`,
        successCount === selectedImages.size ? 'success' : 'error'
      );
      
      setSelectedImages(new Set());
      setBulkOperation(null);
      loadImages();
      loadUsageStats();
    } catch (error) {
      emitTopRightToast('Failed to convert images', 'error');
    } finally {
      setProcessingImage(null);
    }
  };

  const handleBulkExport = async () => {
    if (selectedImages.size === 0) return;
    
    setProcessingImage('bulk');
    try {
      const response = await fetch(`${getBaseUrl()}/api/images/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageIds: Array.from(selectedImages),
        }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `images-export-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        emitTopRightToast(`Exported ${selectedImages.size} image(s)`, 'success');
        setSelectedImages(new Set());
        setBulkOperation(null);
      } else {
        emitTopRightToast('Failed to export images', 'error');
      }
    } catch (error) {
      emitTopRightToast('Failed to export images', 'error');
    } finally {
      setProcessingImage(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          Drag and drop images here
        </p>
        <p className="text-sm text-gray-500 mb-4">
          or click to select files
        </p>
        <input
          ref={fileInputRef}
          type="file"
          id="file-upload"
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileInput}
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          Select Images
        </Button>
        <p className="text-xs text-gray-400 mt-4">
          Maximum {maxImages} images • JPEG, PNG, WebP, GIF • Max 100MB per file
        </p>
      </div>

      {/* Selected Files Preview */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Selected Files ({files.length}/{maxImages})
            </h3>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload {files.length} Image{files.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="relative border rounded-lg p-2 bg-white group"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-32 object-cover rounded"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-xs text-gray-600 mt-2 truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Statistics */}
      {usageStats && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Upload Usage</h4>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-gray-600">Today: </span>
                  <span className="font-semibold text-gray-900">
                    {usageStats.dailyCount} / {usageStats.dailyLimit === 'unlimited' ? '∞' : usageStats.dailyLimit}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Lifetime: </span>
                  <span className="font-semibold text-gray-900">{usageStats.lifetimeCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Plan: </span>
                  <span className="font-semibold text-gray-900 capitalize">{usageStats.plan}</span>
                </div>
              </div>
            </div>
            {usageStats.dailyLimit !== 'unlimited' && usageStats.dailyCount >= usageStats.dailyLimit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/app/upgrade'}
              >
                Upgrade Plan
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Gallery Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Image Library</h3>
          <div className="flex items-center gap-2">
            {selectedImages.size > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkOperation('convert')}
                  className="flex items-center gap-2"
                >
                  <Settings2 className="w-4 h-4" />
                  Convert Format ({selectedImages.size})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkOperation('export')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export ({selectedImages.size})
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedImages.size})
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadImages}
              disabled={loadingImages}
            >
              <RefreshCw className={`w-4 h-4 ${loadingImages ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="space-y-3">
          {/* Basic Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">All Quality</option>
              <option value="high">High Quality</option>
              <option value="poor">Poor Quality</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="createdAt">Date</option>
              <option value="filename">Filename</option>
              <option value="size">Size</option>
              <option value="quality">Quality</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
          
          {/* Advanced Filters */}
          <details className="group">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Advanced Filters
            </summary>
            <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                  <Input
                    placeholder="e.g. product, lifestyle"
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date From</label>
                  <Input
                    type="date"
                    value={dateRangeFilter.from || ''}
                    onChange={(e) => setDateRangeFilter({...dateRangeFilter, from: e.target.value})}
                    className="w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date To</label>
                  <Input
                    type="date"
                    value={dateRangeFilter.to || ''}
                    onChange={(e) => setDateRangeFilter({...dateRangeFilter, to: e.target.value})}
                    className="w-full text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Min Size (MB)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={fileSizeFilter.min || ''}
                    onChange={(e) => setFileSizeFilter({...fileSizeFilter, min: e.target.value ? parseFloat(e.target.value) : undefined})}
                    className="w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Size (MB)</label>
                  <Input
                    type="number"
                    placeholder="∞"
                    value={fileSizeFilter.max || ''}
                    onChange={(e) => setFileSizeFilter({...fileSizeFilter, max: e.target.value ? parseFloat(e.target.value) : undefined})}
                    className="w-full text-sm"
                  />
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* Image Grid */}
        {loadingImages ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : uploadedImages.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-12 text-center">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No images uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {uploadedImages.map((image) => (
              <div
                key={image.id}
                className="relative border rounded-lg p-2 bg-white group cursor-pointer"
              >
                {/* Selection Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedImages.has(image.id)}
                  onChange={() => toggleImageSelection(image.id)}
                  className="absolute top-2 left-2 z-10 w-4 h-4"
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Image */}
                <img
                  src={image.url}
                  alt={image.altText}
                  className="w-full h-32 object-cover rounded"
                  onClick={() => setPreviewImage(image)}
                />

                {/* Quality Badge */}
                {image.quality === 'poor' && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                    Low Quality
                  </div>
                )}

                {/* Favorite Icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(image.id, image.isFavorite || false);
                  }}
                  className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {image.isFavorite ? (
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ) : (
                    <Star className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {/* Actions Menu */}
                <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(image.id, image.filename);
                    }}
                    className="bg-blue-500 text-white p-1 rounded"
                    title="Download"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(image);
                    }}
                    className="bg-gray-500 text-white p-1 rounded"
                    title="Edit"
                  >
                    <Settings2 className="w-3 h-3" />
                  </button>
                  {image.quality === 'poor' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpscale(image.id);
                      }}
                      className="bg-green-500 text-white p-1 rounded"
                      title="Upscale"
                      disabled={processingImage === image.id}
                    >
                      {processingImage === image.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ZoomIn className="w-3 h-3" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompress(image.id);
                    }}
                    className="bg-purple-500 text-white p-1 rounded"
                    title="Compress"
                    disabled={processingImage === image.id}
                  >
                    {processingImage === image.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Minimize2 className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(image.id);
                    }}
                    className="bg-red-500 text-white p-1 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Image Info */}
                <div className="mt-2">
                  <p className="text-xs text-gray-600 truncate" title={image.filename}>
                    {image.filename}
                  </p>
                  <p className="text-xs text-gray-400">
                    {image.width}×{image.height}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{previewImage.filename}</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(previewImage)}
                >
                  <Settings2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(previewImage.id, previewImage.filename)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                {previewImage.quality === 'poor' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpscale(previewImage.id)}
                    disabled={processingImage === previewImage.id}
                  >
                    {processingImage === previewImage.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <ZoomIn className="w-4 h-4 mr-2" />
                    )}
                    Upscale
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCompress(previewImage.id)}
                  disabled={processingImage === previewImage.id}
                >
                  {processingImage === previewImage.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Minimize2 className="w-4 h-4 mr-2" />
                  )}
                  Compress
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOptimizingImage(previewImage);
                    setOptimizeForm({
                      width: previewImage.width.toString(),
                      height: previewImage.height.toString(),
                      format: previewImage.mimeType.includes('png') ? 'png' : previewImage.mimeType.includes('webp') ? 'webp' : 'jpeg',
                      quality: 85,
                    });
                  }}
                >
                  <Settings2 className="w-4 h-4 mr-2" />
                  Optimize
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch(`${getBaseUrl()}/api/images/check-duplicates`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imageId: previewImage.id }),
                      });
                      const result = await response.json();
                      if (result.success) {
                        setDuplicateCheckResult(result.data);
                      }
                    } catch (error) {
                      emitTopRightToast('Failed to check duplicates', 'error');
                    }
                  }}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Check Duplicates
                </Button>
                <button
                  onClick={() => {
                    setPreviewImage(null);
                    setDuplicateCheckResult(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <img
                src={previewImage.url}
                alt={previewImage.altText}
                className="w-full h-auto rounded mb-4"
              />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold">Dimensions:</p>
                  <p>{previewImage.width} × {previewImage.height}px</p>
                  {previewImage.originalWidth && (
                    <p className="text-xs text-gray-500">
                      Original: {previewImage.originalWidth} × {previewImage.originalHeight}px
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-semibold">File Size:</p>
                  <p>{(previewImage.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div>
                  <p className="font-semibold">Quality:</p>
                  <p className={previewImage.quality === 'high' ? 'text-green-600' : 'text-yellow-600'}>
                    {previewImage.quality === 'high' ? 'High' : 'Poor'}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Format:</p>
                  <p>{previewImage.mimeType}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="font-semibold mb-2">Alt Text:</p>
                <p className="text-sm text-gray-600">{previewImage.altText}</p>
              </div>
              {previewImage.tags && previewImage.tags.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold mb-2">Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {previewImage.tags.map((tag, i) => (
                      <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Duplicate Check Results */}
              {duplicateCheckResult && (
                <div className={`mt-4 p-4 rounded-lg border ${
                  duplicateCheckResult.hasDuplicates 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <p className="font-semibold mb-2 flex items-center gap-2">
                    {duplicateCheckResult.hasDuplicates ? (
                      <>
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <span className="text-yellow-900">Duplicates Found</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-900">No Duplicates</span>
                      </>
                    )}
                  </p>
                  {duplicateCheckResult.hasDuplicates && duplicateCheckResult.duplicates.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-yellow-800">
                        Found {duplicateCheckResult.duplicates.length} duplicate image(s):
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                        {duplicateCheckResult.duplicates.map((dup) => (
                          <li key={dup.id}>{dup.filename} (uploaded {new Date(dup.createdAt).toLocaleDateString()})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Optimize Modal */}
      {optimizingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Optimize Image</h3>
              <button
                onClick={() => setOptimizingImage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Width (px)"
                  type="number"
                  value={optimizeForm.width}
                  onChange={(e) => setOptimizeForm({ ...optimizeForm, width: e.target.value })}
                  placeholder="Auto"
                />
                <Input
                  label="Height (px)"
                  type="number"
                  value={optimizeForm.height}
                  onChange={(e) => setOptimizeForm({ ...optimizeForm, height: e.target.value })}
                  placeholder="Auto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Format</label>
                <select
                  value={optimizeForm.format}
                  onChange={(e) => setOptimizeForm({ ...optimizeForm, format: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Quality: {optimizeForm.quality}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={optimizeForm.quality}
                  onChange={(e) => setOptimizeForm({ ...optimizeForm, quality: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower quality = smaller file size
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOptimizingImage(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleOptimize(optimizingImage.id, {
                      width: optimizeForm.width ? parseInt(optimizeForm.width) : undefined,
                      height: optimizeForm.height ? parseInt(optimizeForm.height) : undefined,
                      format: optimizeForm.format,
                      quality: optimizeForm.quality,
                    });
                    setOptimizingImage(null);
                  }}
                  disabled={processingImage === optimizingImage.id}
                >
                  {processingImage === optimizingImage.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Optimizing...
                    </>
                  ) : (
                    'Optimize'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Edit Image</h3>
              <button
                onClick={() => setEditingImage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <Input
                label="Filename"
                value={editForm.filename}
                onChange={(e) => setEditForm({ ...editForm, filename: e.target.value })}
              />
              <Textarea
                label="Alt Text"
                value={editForm.altText}
                onChange={(e) => setEditForm({ ...editForm, altText: e.target.value })}
                rows={4}
                helperText={`${editForm.altText.length}/500 characters (minimum 100)`}
              />
              <Input
                label="Tags (comma-separated)"
                value={editForm.tags.join(', ')}
                onChange={(e) => setEditForm({ 
                  ...editForm, 
                  tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                })}
              />
              <Input
                label="Category"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="favorite"
                  checked={editForm.isFavorite}
                  onChange={(e) => setEditForm({ ...editForm, isFavorite: e.target.checked })}
                />
                <label htmlFor="favorite">Mark as favorite</label>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingImage(null)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Convert Modal */}
      {bulkOperation === 'convert' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Bulk Format Conversion</h3>
              <button
                onClick={() => setBulkOperation(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Format</label>
                <select
                  value={optimizeForm.format}
                  onChange={(e) => setOptimizeForm({ ...optimizeForm, format: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Quality: {optimizeForm.quality}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={optimizeForm.quality}
                  onChange={(e) => setOptimizeForm({ ...optimizeForm, quality: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setBulkOperation(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleBulkConvert(optimizeForm.format, optimizeForm.quality)}
                  disabled={processingImage === 'bulk'}
                >
                  {processingImage === 'bulk' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Converting...
                    </>
                  ) : (
                    `Convert ${selectedImages.size} Images`
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Export Modal */}
      {bulkOperation === 'export' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Export Images</h3>
              <button
                onClick={() => setBulkOperation(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                This will download {selectedImages.size} selected image(s) as a ZIP file.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setBulkOperation(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkExport}
                  disabled={processingImage === 'bulk'}
                >
                  {processingImage === 'bulk' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export ZIP
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">About Image Uploader</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Upload up to {maxImages} images at once</li>
          <li>• Maximum 100MB per file (supports large 4000x4000 images)</li>
          <li>• Direct multipart upload - bypasses server limits</li>
          <li>• AI automatically generates SEO-friendly filenames and alt text</li>
          <li>• Images are checked for quality (Etsy prefers 2000x2000px or higher)</li>
          <li>• Upscale low-quality images with one click</li>
          <li>• Edit metadata: filename, alt text, tags, category</li>
          <li>• Filter, search, and sort your image library</li>
          <li>• Advanced filters: tags, date range, file size</li>
          <li>• Bulk operations: convert format, export ZIP, delete multiple images</li>
          <li>• Usage statistics: track daily and lifetime uploads</li>
          <li>• Duplicate detection: identify duplicate images</li>
          <li>• Images are automatically deleted after 24 hours</li>
          <li>• Inappropriate content is automatically detected and blocked</li>
        </ul>
      </div>
    </div>
  );
};
