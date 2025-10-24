'use client';

import React, { useState } from 'react';
import { Wand2, Loader2, Copy, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { emitTopRightToast } from './TopRightToast';
import { getBaseUrl } from '@/lib/utils';

interface AIAltTextGeneratorProps {
  imageUrl: string;
  imageBase64?: string;
  listingTitle?: string;
  listingTags?: string[];
  listingDescription?: string;
  currentAltText?: string;
  onAltTextGenerated: (altText: string) => void;
  className?: string;
}

export const AIAltTextGenerator: React.FC<AIAltTextGeneratorProps> = ({
  imageUrl,
  imageBase64,
  listingTitle = '',
  listingTags = [],
  listingDescription = '',
  currentAltText = '',
  onAltTextGenerated,
  className = ''
}) => {
  const [altText, setAltText] = useState(currentAltText);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);

    try {
      const response = await fetch(`${getBaseUrl()}/api/generate-alt-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          imageBase64,
          title: listingTitle,
          tags: listingTags,
          descriptionExcerpt: listingDescription.substring(0, 200)
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const generatedText = result.data.altText;
        setAltText(generatedText);
        onAltTextGenerated(generatedText);
        emitTopRightToast(`Alt text generated! (${result.data.length} chars)`, 'success');
      } else {
        emitTopRightToast(result.error || 'Failed to generate alt text', 'error');
      }
    } catch (error) {
      console.error('Failed to generate alt text:', error);
      emitTopRightToast('Failed to generate alt text', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(altText);
    setCopied(true);
    emitTopRightToast('Alt text copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value.substring(0, 250);
    setAltText(newText);
    onAltTextGenerated(newText);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Alt Text
          <span className="text-xs text-gray-500 ml-2">
            ({altText.length}/250 characters)
          </span>
        </label>
        <div className="flex gap-2">
          {altText && (
            <Button
              onClick={handleCopy}
              variant="ghost"
              size="sm"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            onClick={handleGenerate}
            disabled={generating}
            variant="outline"
            size="sm"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate AI Alt Text
              </>
            )}
          </Button>
        </div>
      </div>

      <Textarea
        value={altText}
        onChange={handleChange}
        placeholder="Alt text for image accessibility and SEO (max 250 characters)"
        rows={3}
        maxLength={250}
        className="resize-none"
      />

      <div className="flex items-start gap-2 text-xs text-gray-600">
        <div className="flex-1">
          <p className="mb-1">
            <strong>Tips for great alt text:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-500">
            <li>Describe what's actually in the image</li>
            <li>Include relevant keywords naturally</li>
            <li>Mention colors, materials, or unique features</li>
            <li>Keep it under 250 characters (Etsy's limit)</li>
          </ul>
        </div>
      </div>

      {altText.length >= 240 && (
        <p className="text-xs text-amber-600">
          ⚠️ Approaching character limit ({altText.length}/250)
        </p>
      )}
      
      {altText.length === 250 && (
        <p className="text-xs text-red-600">
          ⛔ Maximum character limit reached
        </p>
      )}
    </div>
  );
};

