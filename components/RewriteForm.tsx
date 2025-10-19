'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { KeywordChips } from './KeywordChips';
import { RefreshCw, X } from 'lucide-react';

interface RewriteFormProps {
  onSubmit: (data: RewriteRequest) => void;
  loading: boolean;
  userPreferences?: { tone?: string; niche?: string; audience?: string };
  className?: string;
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

export const RewriteForm: React.FC<RewriteFormProps> = ({ 
  onSubmit, 
  loading, 
  userPreferences = {},
  className = ''
}) => {
  const [formData, setFormData] = useState<RewriteRequest>({
    originalTitle: '',
    originalDescription: '',
    originalTags: [],
    productName: '',
    niche: userPreferences.niche || '',
    audience: userPreferences.audience || '',
    keywords: [],
    tone: userPreferences.tone || 'Professional'
  });

  const [selectedTone, setSelectedTone] = useState(
    toneOptions.find(t => t.value === (userPreferences.tone || 'Professional'))
  );
  const [tagInput, setTagInput] = useState('');

  // Update form when preferences change
  useEffect(() => {
    if (userPreferences.tone || userPreferences.niche || userPreferences.audience) {
      setFormData(prev => ({
        ...prev,
        tone: userPreferences.tone || prev.tone,
        niche: userPreferences.niche || prev.niche,
        audience: userPreferences.audience || prev.audience
      }));
      if (userPreferences.tone) {
        setSelectedTone(toneOptions.find(t => t.value === userPreferences.tone));
      }
    }
  }, [userPreferences]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.originalTitle.trim() || !formData.originalDescription.trim() || !formData.productName.trim() || formData.keywords.length === 0) {
      return;
    }
    onSubmit(formData);
  };

  const addKeyword = (keyword: string) => {
    const trimmed = keyword.trim();
    if (trimmed && !formData.keywords.includes(trimmed) && formData.keywords.length < 20) {
      setFormData(prev => ({ ...prev, keywords: [...prev.keywords, trimmed] }));
    }
  };

  const removeKeyword = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index)
    }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) {
        const newTag = tagInput.trim().substring(0, 20);
        if (!formData.originalTags.includes(newTag) && formData.originalTags.length < 20) {
          setFormData(prev => ({ ...prev, originalTags: [...prev.originalTags, newTag] }));
        }
        setTagInput('');
      }
    } else if (e.key === 'Backspace' && !tagInput && formData.originalTags.length > 0) {
      e.preventDefault();
      setFormData(prev => ({ ...prev, originalTags: prev.originalTags.slice(0, -1) }));
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      originalTags: prev.originalTags.filter((_, i) => i !== index)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Original Listing Content */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Original Listing</h3>
        
        <div>
          <label htmlFor="originalTitle" className="block text-sm font-medium text-gray-700 mb-1">
            Original Title <span className="text-red-500">*</span>
          </label>
          <Input
            id="originalTitle"
            value={formData.originalTitle}
            onChange={(e) => setFormData(prev => ({ ...prev, originalTitle: e.target.value }))}
            placeholder="Paste your current listing title here..."
            required
            disabled={loading}
            maxLength={200}
          />
        </div>

        <div>
          <label htmlFor="originalDescription" className="block text-sm font-medium text-gray-700 mb-1">
            Original Description <span className="text-red-500">*</span>
          </label>
          <Textarea
            id="originalDescription"
            value={formData.originalDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, originalDescription: e.target.value }))}
            placeholder="Paste your current listing description here..."
            rows={8}
            required
            disabled={loading}
            maxLength={10000}
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.originalDescription.length} / 10,000 characters
          </p>
        </div>

        <div>
          <label htmlFor="originalTags" className="block text-sm font-medium text-gray-700 mb-1">
            Original Tags (Optional)
          </label>
          <div className="flex flex-wrap gap-2 p-3 bg-white border border-gray-200 rounded-md min-h-[42px]">
            {formData.originalTags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-1.5 inline-flex items-center justify-center text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={formData.originalTags.length === 0 ? "Type tags and press Enter..." : ""}
              className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
              disabled={loading}
              maxLength={20}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Press Enter or comma to add tags. {formData.originalTags.length}/20 tags
          </p>
        </div>
      </div>

      {/* Product Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Optimization Details</h3>
        
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="productName"
            value={formData.productName}
            onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
            placeholder="What are you selling?"
            required
            disabled={loading}
            maxLength={100}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="niche" className="block text-sm font-medium text-gray-700 mb-1">
              Niche (Optional)
            </label>
            <Input
              id="niche"
              value={formData.niche}
              onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
              placeholder="e.g., Wedding Invitations"
              disabled={loading}
              maxLength={50}
            />
          </div>

          <div>
            <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-1">
              Target Audience (Optional)
            </label>
            <Input
              id="audience"
              value={formData.audience}
              onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value }))}
              placeholder="e.g., Brides, Small business owners"
              disabled={loading}
              maxLength={200}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Keywords <span className="text-red-500">*</span>
          </label>
          <KeywordChips
            keywords={formData.keywords}
            onAdd={addKeyword}
            onRemove={removeKeyword}
            disabled={loading}
            maxKeywords={20}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tone
          </label>
          {selectedTone && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-900">
                <strong>{selectedTone.value}:</strong> {selectedTone.description}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {toneOptions.map((tone) => (
              <button
                key={tone.value}
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, tone: tone.value }));
                  setSelectedTone(tone);
                }}
                disabled={loading}
                className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                  formData.tone === tone.value
                    ? 'bg-brand-600 text-white border-brand-600 hover:bg-brand-700'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={tone.description}
              >
                {tone.value}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading || !formData.originalTitle.trim() || !formData.originalDescription.trim() || !formData.productName.trim() || formData.keywords.length === 0}
        className="w-full"
      >
        {loading ? (
          <>
            <RefreshCw className="animate-spin h-4 w-4 mr-2" />
            Rewriting...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Rewrite Listing
          </>
        )}
      </Button>
    </form>
  );
};

