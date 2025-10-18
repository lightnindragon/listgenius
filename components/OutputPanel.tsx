'use client';

import React from 'react';
import { Container } from '@/components/ui/Container';
import { CopyButtons } from './CopyButtons';
import { formatWordCount } from '@/lib/utils';
import { SkeletonText, SkeletonTitle } from '@/components/ui/Skeleton';

interface OutputPanelProps {
  title?: string;
  description?: string;
  tags?: string[];
  materials?: string[];
  pinterestCaption?: string;
  etsyMessage?: string;
  loading?: boolean;
  className?: string;
}

const OutputPanel: React.FC<OutputPanelProps> = ({
  title,
  description,
  tags,
  materials,
  pinterestCaption,
  etsyMessage,
  loading = false,
  className
}) => {
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
                    className="bg-brand-100 text-brand-800 px-3 py-1 rounded-full text-sm"
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
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
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

        {etsyMessage && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Etsy Thank You Message</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{etsyMessage}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
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
    </div>
  );
};

export { OutputPanel };
