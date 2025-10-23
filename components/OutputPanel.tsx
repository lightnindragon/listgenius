'use client';

import React, { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { CopyButtons } from './CopyButtons';
import { PublishToEtsyButton } from './PublishToEtsyButton';
import { formatWordCount } from '@/lib/utils';
import { isEnabled } from '@/lib/flags';
import { SkeletonText, SkeletonTitle } from '@/components/ui/Skeleton';
import { Save, Check } from 'lucide-react';
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
}

const OutputPanel: React.FC<OutputPanelProps> = ({
  title,
  description,
  tags,
  materials,
  pinterestCaption,
  etsyMessage,
  loading = false,
  className,
  listingId
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

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
              <span className="text-xs text-gray-400">{formatWordCount(title)}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-lg font-medium text-gray-900">{title}</p>
            </div>
          </div>
        )}

        {description && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Description</h4>
              <span className="text-xs text-gray-400">{formatWordCount(description)}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{description}</p>
            </div>
          </div>
        )}

        {tags && tags.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tags</h4>
              <span className="text-xs text-gray-400">{tags.length}/13 tags</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
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
            </div>
          </div>
        )}

        {materials && materials.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Materials</h4>
              <span className="text-xs text-gray-400">{materials.length}/13 materials</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
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
