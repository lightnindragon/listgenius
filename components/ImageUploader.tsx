'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/Button';
import { emitTopRightToast } from './TopRightToast';
import { getBaseUrl } from '@/lib/utils';

interface UploadedImage {
  id: string;
  filename: string;
  altText: string;
  url: string;
  width: number;
  height: number;
  quality: 'poor' | 'high';
  needsUpscale?: boolean;
  expiresAt: string;
}

interface ImageUploaderProps {
  onUploadSuccess?: (images: UploadedImage[]) => void;
  maxImages?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploadSuccess,
  maxImages = 20,
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Filter only image files
    const imageFiles = newFiles.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      emitTopRightToast('Please select image files only', 'error');
      return;
    }

    // Check file size (max 100MB per file - reasonable limit, can be increased)
    const maxFileSize = 100 * 1024 * 1024; // 100MB max per file (can handle large 4000x4000 images)
    const oversizedFiles = imageFiles.filter(file => file.size > maxFileSize);
    
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => f.name).join(', ');
      const maxMB = (maxFileSize / 1024 / 1024).toFixed(0);
      emitTopRightToast(
        `${oversizedFiles.length} file(s) exceed ${maxMB}MB limit: ${fileNames.substring(0, 50)}... Please compress these images before uploading.`,
        'error'
      );
      return;
    }

    // Check total count
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

    // Check file size limit (100MB max per file)
    const maxFileSize = 100 * 1024 * 1024; // 100MB max per file
    const oversizedFiles = files.filter(file => file.size > maxFileSize);
    
    if (oversizedFiles.length > 0) {
      const fileSizes = oversizedFiles.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)}MB)`).join(', ');
      emitTopRightToast(
        `Some files are too large (>100MB): ${fileSizes.substring(0, 100)}... Please compress these images.`,
        'error'
      );
      return;
    }

    setUploading(true);
    
    try {
      // Upload images sequentially using direct Vercel Blob upload
      const uploadedImages: UploadedImage[] = [];
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          // Upload directly using Vercel Blob client with multipart support
          // This bypasses serverless function payload limits
          const { upload } = await import('@vercel/blob/client');
          
          const blob = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: `${getBaseUrl()}/api/images/upload-url`,
            multipart: true, // Enable multipart for large files
          });

          const blobUrl = blob.url;
          const blobKey = blob.pathname;

          // Get image dimensions from the file
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

          // Step 3: Complete the upload by processing metadata (AI generation, moderation, etc.)
          const completeResponse = await fetch(`${getBaseUrl()}/api/images/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
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
            const errorText = await completeResponse.text();
            let errorMessage = `Failed to process ${file.name}`;
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error || errorMessage;
            } catch (e) {
              errorMessage = errorText || errorMessage;
            }
            console.error(`Processing failed for ${file.name}:`, errorMessage);
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
          emitTopRightToast(`Failed to upload ${file.name}: ${(error as Error).message}`, 'error');
          failedCount++;
        }
      }

      if (successCount > 0) {
        emitTopRightToast(
          `Successfully uploaded ${successCount} of ${files.length} image(s)`,
          successCount === files.length ? 'success' : 'error'
        );
        setFiles([]);
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

      {/* Selected Files */}
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

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">About Image Uploader</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Upload up to {maxImages} images at once</li>
          <li>• Maximum 100MB per file (supports large 4000x4000 images)</li>
          <li>• Direct multipart upload - bypasses server limits</li>
          <li>• AI automatically generates SEO-friendly filenames and alt text</li>
          <li>• Images are checked for quality (Etsy prefers 2000x2000px or higher)</li>
          <li>• Images are automatically deleted after 24 hours</li>
          <li>• Inappropriate content is automatically detected and blocked</li>
        </ul>
      </div>
    </div>
  );
};

