'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { KeywordChips } from './KeywordChips';
import { OutputPanel } from './OutputPanel';
import { PublishToEtsyButton } from './PublishToEtsyButton';
import { emitTopRightToast } from '@/components/TopRightToast';
import { getBaseUrl } from '@/lib/utils';
import { X, RefreshCw } from 'lucide-react';

interface EtsyListing {
  listing_id: number;
  title: string;
  description: string;
  tags: string[];
  materials: string[];
  price: {
    amount: number;
    currency_code: string;
  };
}

interface RewriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: EtsyListing | null;
  onListingUpdated?: () => void;
}

interface RewriteRequest {
  originalTitle: string;
  originalDescription: string;
  originalTags: string[];
  productName: string;
  niche?: string;
  audience?: string;
  keywords: string[];
  tone?: string;
}

interface RewriteOutput {
  title: string;
  description: string;
  tags: string[];
  materials: string[];
  pinterestCaption: string;
  etsyMessage: string;
}

const toneOptions = [
  { value: 'Professional', description: 'Clear, authoritative, and business-focused' },
  { value: 'Friendly', description: 'Approachable, helpful, and conversational' },
  { value: 'Casual', description: 'Relaxed, informal, and easy-going' },
  { value: 'Formal', description: 'Sophisticated, structured, and polished' },
  { value: 'Enthusiastic', description: 'Excited, energetic, and passionate' },
  { value: 'Warm', description: 'Cozy, comforting, and inviting' },
  { value: 'Creative', description: 'Imaginative, unique, and expressive' },
  { value: 'Luxury', description: 'Premium, exclusive, and high-end' },
  { value: 'Playful', description: 'Fun, whimsical, and lighthearted' },
  { value: 'Minimalist', description: 'Clean, simple, and focused' },
  { value: 'Artistic', description: 'Aesthetic, expressive, and creative' },
  { value: 'Rustic', description: 'Natural, earthy, and handcrafted' },
  { value: 'Modern', description: 'Contemporary, sleek, and current' },
  { value: 'Vintage', description: 'Retro, nostalgic, and timeless' },
  { value: 'Elegant', description: 'Refined, sophisticated, and graceful' }
];

export const RewriteModal: React.FC<RewriteModalProps> = ({
  isOpen,
  onClose,
  listing,
  onListingUpdated
}) => {
  const [formData, setFormData] = useState<RewriteRequest>({
    originalTitle: '',
    originalDescription: '',
    originalTags: [],
    productName: '',
    niche: '',
    audience: '',
    keywords: [],
    tone: 'Professional'
  });
  const [output, setOutput] = useState<RewriteOutput | null>(null);
  const [loading, setLoading] = useState(false);

  // Populate form when listing changes
  useEffect(() => {
    if (listing) {
      setFormData({
        originalTitle: listing.title,
        originalDescription: listing.description,
        originalTags: listing.tags,
        productName: listing.title,
        niche: '',
        audience: '',
        keywords: [],
        tone: 'Professional'
      });
      setOutput(null);
    }
  }, [listing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.originalTitle.trim() || !formData.originalDescription.trim()) {
      emitTopRightToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: formData.productName,
          description: formData.originalDescription,
          keywords: formData.keywords,
          tone: formData.tone,
          niche: formData.niche,
          audience: formData.audience,
          wordCount: 300,
          extras: true
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setOutput(result.data);
        emitTopRightToast('Listing rewritten successfully!', 'success');
      } else {
        const errorMessage = result.error || 'Failed to rewrite listing';
        emitTopRightToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Rewrite error:', error);
      emitTopRightToast('An error occurred while rewriting the listing', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordAdd = (keyword: string) => {
    if (keyword.trim() && !formData.keywords.includes(keyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword.trim()]
      }));
    }
  };

  const handleKeywordRemove = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  if (!isOpen || !listing) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Rewrite Listing</h2>
            <p className="text-gray-600 mt-1">Optimize your existing listing with AI</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row h-[calc(90vh-120px)]">
          {/* Form */}
          <div className="lg:w-1/2 p-6 overflow-y-auto border-r border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Original Content */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Original Content</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Title
                    </label>
                    <Input
                      value={formData.originalTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, originalTitle: e.target.value }))}
                      placeholder="Enter the original listing title"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Description
                    </label>
                    <Textarea
                      value={formData.originalDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, originalDescription: e.target.value }))}
                      placeholder="Enter the original listing description"
                      rows={6}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {formData.originalTags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Optimization Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name
                    </label>
                    <Input
                      value={formData.productName}
                      onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                      placeholder="What is this product called?"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Keywords
                    </label>
                    <KeywordChips
                      keywords={formData.keywords}
                      onAdd={handleKeywordAdd}
                      onRemove={handleKeywordRemove}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tone
                    </label>
                    <select
                      value={formData.tone}
                      onChange={(e) => setFormData(prev => ({ ...prev, tone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    >
                      {toneOptions.map((tone) => (
                        <option key={tone.value} value={tone.value}>
                          {tone.value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Niche (Optional)
                    </label>
                    <Input
                      value={formData.niche}
                      onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
                      placeholder="e.g., Home Decor, Jewelry, Art"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Audience (Optional)
                    </label>
                    <Input
                      value={formData.audience}
                      onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value }))}
                      placeholder="e.g., Young professionals, Parents, Art collectors"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Rewriting...
                  </>
                ) : (
                  'Rewrite Listing'
                )}
              </Button>
            </form>
          </div>

          {/* Output */}
          <div className="lg:w-1/2 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimized Listing</h3>
            {output ? (
              <div className="space-y-6">
                <OutputPanel
                  title={output.title}
                  description={output.description}
                  tags={output.tags}
                  materials={output.materials}
                  pinterestCaption={output.pinterestCaption}
                  etsyMessage={output.etsyMessage}
                  loading={false}
                  listingId={listing.listing_id}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No listing rewritten yet</h4>
                <p className="text-gray-600">Fill in the form and click 'Rewrite Listing' to optimize your content</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
