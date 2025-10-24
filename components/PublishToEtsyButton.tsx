'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Upload, Check, X, ExternalLink } from 'lucide-react';
import { emitTopRightToast } from '@/components/TopRightToast';
import { getBaseUrl } from '@/lib/utils';

interface PublishToEtsyButtonProps {
  title: string;
  description: string;
  tags: string[];
  materials?: string[];
  listingId?: number; // If provided, this is an update to existing listing
  disabled?: boolean;
  className?: string;
}

export const PublishToEtsyButton: React.FC<PublishToEtsyButtonProps> = ({
  title,
  description,
  tags,
  materials = [],
  listingId,
  disabled = false,
  className = ''
}) => {
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const handlePublish = async () => {
    if (!title.trim() || !description.trim() || tags.length === 0) {
      emitTopRightToast('Please ensure all fields are filled before publishing', 'error');
      return;
    }

    setPublishing(true);
    try {
      const endpoint = listingId 
        ? `${getBaseUrl()}/api/etsy/listings/${listingId}`
        : `${getBaseUrl()}/api/etsy/listings`;

      const method = listingId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          tags,
          materials
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setPublished(true);
        const action = listingId ? 'updated' : 'published';
        emitTopRightToast(`Listing ${action} successfully!`, 'success');
        
        // Reset published state after 3 seconds
        setTimeout(() => setPublished(false), 3000);
      } else {
        throw new Error(result.error || 'Failed to publish listing');
      }
    } catch (error: any) {
      console.error('Publish error:', error);
      emitTopRightToast(error.message || 'Failed to publish listing', 'error');
    } finally {
      setPublishing(false);
    }
  };

  if (published) {
    return (
      <Button
        disabled
        className={`bg-green-600 hover:bg-green-700 ${className}`}
      >
        <Check className="h-4 w-4 mr-2" />
        Published!
      </Button>
    );
  }

  return (
    <Button
      onClick={handlePublish}
      disabled={disabled || publishing || !title.trim() || !description.trim() || tags.length === 0}
      className={className}
    >
      {publishing ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          {listingId ? 'Updating...' : 'Publishing...'}
        </>
      ) : (
        <>
          <Upload className="h-4 w-4 mr-2" />
          {listingId ? 'Update on Etsy' : 'Publish to Etsy'}
        </>
      )}
    </Button>
  );
};
