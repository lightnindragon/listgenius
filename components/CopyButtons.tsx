'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Copy, Check } from 'lucide-react';

interface CopyButtonsProps {
  title?: string;
  description?: string;
  tags?: string[];
  materials?: string[];
  pinterestCaption?: string;
  etsyMessage?: string;
  className?: string;
}

const CopyButtons: React.FC<CopyButtonsProps> = ({
  title,
  description,
  tags,
  materials,
  pinterestCaption,
  etsyMessage,
  className
}) => {
  const { toast } = useToast();
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [label]: true }));
      toast.success(`${label} copied to clipboard!`);
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [label]: false }));
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const copyAll = async () => {
    const allContent = [
      title && `Title: ${title}`,
      description && `Description: ${description}`,
      tags && tags.length > 0 && `Tags: ${tags.join(', ')}`,
      materials && materials.length > 0 && `Materials: ${materials.join(', ')}`,
      pinterestCaption && `Pinterest Caption: ${pinterestCaption}`,
      etsyMessage && `Etsy Message: ${etsyMessage}`
    ].filter(Boolean).join('\n\n');

    if (allContent) {
      await copyToClipboard(allContent, 'All content');
    }
  };

  const hasContent = title || description || (tags && tags.length > 0) || (materials && materials.length > 0);

  if (!hasContent) {
    return null;
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        {title && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Title</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(title, 'Title')}
            >
              {copiedStates['Title'] ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {description && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Description</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(description, 'Description')}
            >
              {copiedStates['Description'] ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {tags && tags.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Tags</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(tags.join(', '), 'Tags')}
            >
              {copiedStates['Tags'] ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {materials && materials.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Materials</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(materials.join(', '), 'Materials')}
            >
              {copiedStates['Materials'] ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {pinterestCaption && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Pinterest Caption</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(pinterestCaption, 'Pinterest Caption')}
            >
              {copiedStates['Pinterest Caption'] ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {etsyMessage && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Etsy Message</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(etsyMessage, 'Etsy Message')}
            >
              {copiedStates['Etsy Message'] ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        <div className="pt-3 border-t">
          <Button
            variant="primary"
            size="sm"
            onClick={copyAll}
            className="w-full"
          >
            Copy All Content
          </Button>
        </div>
      </div>
    </div>
  );
};

export { CopyButtons };
