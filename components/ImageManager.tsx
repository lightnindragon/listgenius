'use client';

import React, { useState, useCallback } from 'react';
import { Upload, X, GripVertical, Wand2, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { emitTopRightToast } from './TopRightToast';
import { getBaseUrl } from '@/lib/utils';

interface ImageData {
  listing_image_id: number;
  url_fullxfull: string;
  url_170x135: string;
  alt_text?: string;
  rank: number;
}

interface ImageManagerProps {
  listingId: number;
  images: ImageData[];
  onImagesChange: (images: ImageData[]) => void;
  listingTitle?: string;
  listingTags?: string[];
  listingDescription?: string;
  className?: string;
}

export const ImageManager: React.FC<ImageManagerProps> = ({
  listingId,
  images,
  onImagesChange,
  listingTitle = '',
  listingTags = [],
  listingDescription = '',
  className = ''
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [generatingAltText, setGeneratingAltText] = useState<{ [key: number]: boolean }>({});
  const [uploading, setUploading] = useState(false);
  const [editingAltText, setEditingAltText] = useState<{ [key: number]: string }>({});

  // Handle drag start
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];
    
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);
    
    // Update ranks
    newImages.forEach((img, idx) => {
      img.rank = idx + 1;
    });
    
    setDraggedIndex(index);
    onImagesChange(newImages);
  };

  // Handle drag end
  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    try {
      const imageIds = images.map(img => img.listing_image_id);
      
      const response = await fetch(`${getBaseUrl()}/api/etsy/listings/${listingId}/images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_ids: imageIds })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        emitTopRightToast('Images reordered successfully', 'success');
      } else {
        emitTopRightToast(result.error || 'Failed to reorder images', 'error');
      }
    } catch (error) {
      console.error('Failed to reorder images:', error);
      emitTopRightToast('Failed to reorder images', 'error');
    }

    setDraggedIndex(null);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${getBaseUrl()}/api/etsy/listings/${listingId}/images`, {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
          const newImage = result.data.image;
          onImagesChange([...images, newImage]);
        } else {
          emitTopRightToast(result.error || 'Failed to upload image', 'error');
        }
      }
      
      if (files.length > 0) {
        emitTopRightToast(`${files.length} image(s) uploaded successfully`, 'success');
      }
    } catch (error) {
      console.error('Failed to upload images:', error);
      emitTopRightToast('Failed to upload images', 'error');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  // Handle image deletion
  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`${getBaseUrl()}/api/etsy/listings/${listingId}/images/${imageId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        onImagesChange(images.filter(img => img.listing_image_id !== imageId));
        emitTopRightToast('Image deleted successfully', 'success');
      } else {
        emitTopRightToast(result.error || 'Failed to delete image', 'error');
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      emitTopRightToast('Failed to delete image', 'error');
    }
  };

  // Generate AI alt text
  const handleGenerateAltText = async (imageId: number, imageUrl: string) => {
    setGeneratingAltText({ ...generatingAltText, [imageId]: true });

    try {
      const response = await fetch(`${getBaseUrl()}/api/generate-alt-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          title: listingTitle,
          tags: listingTags,
          descriptionExcerpt: listingDescription.substring(0, 200)
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const altText = result.data.altText;
        setEditingAltText({ ...editingAltText, [imageId]: altText });
        emitTopRightToast('Alt text generated!', 'success');
      } else {
        emitTopRightToast(result.error || 'Failed to generate alt text', 'error');
      }
    } catch (error) {
      console.error('Failed to generate alt text:', error);
      emitTopRightToast('Failed to generate alt text', 'error');
    } finally {
      setGeneratingAltText({ ...generatingAltText, [imageId]: false });
    }
  };

  // Save alt text
  const handleSaveAltText = async (imageId: number) => {
    const altText = editingAltText[imageId];
    if (altText === undefined) return;

    try {
      const response = await fetch(`${getBaseUrl()}/api/etsy/listings/${listingId}/images/${imageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alt_text: altText })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update local state
        const updatedImages = images.map(img =>
          img.listing_image_id === imageId ? { ...img, alt_text: altText } : img
        );
        onImagesChange(updatedImages);
        
        // Remove from editing state
        const newEditing = { ...editingAltText };
        delete newEditing[imageId];
        setEditingAltText(newEditing);
        
        emitTopRightToast('Alt text saved!', 'success');
      } else {
        emitTopRightToast(result.error || 'Failed to save alt text', 'error');
      }
    } catch (error) {
      console.error('Failed to save alt text:', error);
      emitTopRightToast('Failed to save alt text', 'error');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Images ({images.length})
        </h3>
        <div>
          <input
            type="file"
            id="image-upload"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={uploading}
          />
          <Button
            onClick={() => document.getElementById('image-upload')?.click()}
            disabled={uploading}
            variant="outline"
            size="sm"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Images
              </>
            )}
          </Button>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No images yet</p>
          <p className="text-sm text-gray-500 mb-4">
            Upload images to make your listing more attractive
          </p>
          <Button
            onClick={() => document.getElementById('image-upload')?.click()}
            disabled={uploading}
          >
            Upload First Image
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {images.map((image, index) => (
            <div
              key={image.listing_image_id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex gap-4 p-4 bg-white border border-gray-200 rounded-lg transition-all ${
                draggedIndex === index ? 'opacity-50 scale-95' : ''
              } hover:border-gray-300 cursor-move`}
            >
              <div className="flex items-center">
                <GripVertical className="h-5 w-5 text-gray-400" />
              </div>

              <div className="flex-shrink-0">
                <img
                  src={image.url_170x135}
                  alt={image.alt_text || `Image ${index + 1}`}
                  className="w-24 h-24 object-cover rounded border border-gray-200"
                />
                <div className="mt-1 text-xs text-center text-gray-500">
                  #{image.rank}
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={editingAltText[image.listing_image_id] ?? image.alt_text ?? ''}
                    onChange={(e) => setEditingAltText({ ...editingAltText, [image.listing_image_id]: e.target.value })}
                    placeholder="Alt text (max 250 characters)"
                    maxLength={250}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleGenerateAltText(image.listing_image_id, image.url_fullxfull)}
                    disabled={generatingAltText[image.listing_image_id]}
                    variant="outline"
                    size="sm"
                    title="Generate AI alt text"
                  >
                    {generatingAltText[image.listing_image_id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {(editingAltText[image.listing_image_id] ?? image.alt_text ?? '').length}/250
                  </span>
                  {editingAltText[image.listing_image_id] !== undefined && 
                   editingAltText[image.listing_image_id] !== image.alt_text && (
                    <Button
                      onClick={() => handleSaveAltText(image.listing_image_id)}
                      variant="primary"
                      size="sm"
                    >
                      Save Alt Text
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-start">
                <Button
                  onClick={() => handleDeleteImage(image.listing_image_id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Drag images to reorder. The first image will be your listing's main photo.
      </p>
    </div>
  );
};

