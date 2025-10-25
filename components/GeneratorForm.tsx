'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { KeywordChips } from './KeywordChips';
import { Plus, X } from 'lucide-react';
import { PLAN_CONFIG } from '@/lib/entitlements';

interface GeneratorFormProps {
  onSubmit: (data: GenerateRequest) => void;
  loading: boolean;
  userPreferences?: { tone?: string; niche?: string; audience?: string };
  plan: 'free' | 'pro' | 'business';
  className?: string;
}

interface GenerateRequest {
  productName: string;
  niche?: string;
  audience?: string;
  keywords: string[];
  tone?: string;
  wordCount?: number;
  extras?: {
    pinterestCaption?: boolean;
    etsyMessage?: boolean;
  };
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

const wordCountOptions = [
  { value: 200, label: '200 words (Concise)' },
  { value: 250, label: '250 words (Standard)' },
  { value: 300, label: '300 words (Detailed)' },
  { value: 400, label: '400 words (Comprehensive)' },
  { value: 500, label: '500 words (In-depth)' },
  { value: 600, label: '600 words (Maximum)' }
];

const GeneratorForm: React.FC<GeneratorFormProps> = ({
  onSubmit,
  loading,
  userPreferences,
  plan,
  className
}) => {
  const [formData, setFormData] = useState<GenerateRequest>({
    productName: '',
    niche: userPreferences?.niche || '',
    audience: userPreferences?.audience || '',
    keywords: [],
    tone: userPreferences?.tone || 'Professional',
    wordCount: 300,
    extras: {
      pinterestCaption: false,
      etsyMessage: false
    }
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter options based on plan
  const allowedTones = PLAN_CONFIG[plan].allowedTones;
  const allowedWords = PLAN_CONFIG[plan].allowedWordCounts;
  
  const filteredToneOptions = toneOptions.filter(tone => allowedTones.includes(tone.value));
  const filteredWordCountOptions = wordCountOptions.filter(option => allowedWords.includes(option.value));

  useEffect(() => {
    if (userPreferences) {
      setFormData(prev => ({
        ...prev,
        niche: userPreferences.niche || prev.niche,
        tone: userPreferences.tone || prev.tone,
        audience: userPreferences.audience || prev.audience
      }));
    }
  }, [userPreferences, plan]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required';
    }

    if (formData.keywords.length === 0) {
      newErrors.keywords = 'At least one keyword is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const addKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !formData.keywords.includes(keyword)) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword]
      }));
      setKeywordInput('');
      setErrors(prev => ({ ...prev, keywords: '' }));
    }
  };

  const removeKeyword = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index)
    }));
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
        <div className="space-y-4">
          <Input
            label="Product Name *"
            value={formData.productName}
            onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
            placeholder="e.g., Printable Wedding Planner Template"
            error={errors.productName}
            maxLength={100}
          />

          <Input
            label="Niche"
            value={formData.niche}
            onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
            placeholder="e.g., Wedding Planning, Digital Art, Printables"
            helperText="Optional: Helps AI understand your product category"
            maxLength={50}
          />

          <Input
            label="Target Audience"
            value={formData.audience}
            onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value }))}
            placeholder="e.g., Brides-to-be, Small business owners, Crafters"
            helperText="Optional: Helps AI tailor the tone and language"
            maxLength={200}
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Keywords</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keywords *
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="e.g., wedding planner, digital download"
                onKeyPress={handleKeywordKeyPress}
                maxLength={50}
              />
              <Button
                type="button"
                onClick={addKeyword}
                disabled={!keywordInput.trim()}
                size="md"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <KeywordChips
              keywords={formData.keywords}
              onRemove={removeKeyword}
            />
            {errors.keywords && (
              <p className="mt-1 text-sm text-red-600">{errors.keywords}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Add 2+ word phrases for better SEO (e.g., "wedding planner template")
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Style</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tone
            </label>
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {toneOptions.map((tone) => {
                  const enabled = allowedTones.includes(tone.value);
                  const isSelected = formData.tone === tone.value;
                  const isLocked = !enabled;
                  
                  return (
                    <button
                      key={tone.value}
                      type="button"
                      disabled={isLocked}
                      onClick={() => {
                        if (enabled) {
                          setFormData(prev => ({ ...prev, tone: tone.value }));
                        }
                      }}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors relative ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : isLocked
                            ? 'bg-gray-100 border-2 border-dashed border-gray-300 text-gray-400 cursor-not-allowed'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                      title={isLocked ? 'Pro feature - Upgrade to unlock' : tone.description}
                    >
                      {tone.value}
                      {isLocked && (
                        <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1 rounded-full">
                          Pro
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {formData.tone && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">{formData.tone}:</span>{' '}
                    {toneOptions.find(t => t.value === formData.tone)?.description}
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-500">
                Optional: Choose a tone for your listing
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description Length
            </label>
            <select
              value={formData.wordCount || 300}
              onChange={(e) => setFormData(prev => ({ ...prev, wordCount: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
            >
              {filteredWordCountOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Choose the length of your product description
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Options</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.extras?.pinterestCaption || false}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                extras: { ...prev.extras, pinterestCaption: e.target.checked }
              }))}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Pinterest caption
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.extras?.etsyMessage || false}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                extras: { ...prev.extras, etsyMessage: e.target.checked }
              }))}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Etsy thank you message 🤖
            </span>
          </label>
        </div>
      </div>

      <Button
        type="submit"
        loading={loading}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? 'Generating...' : 'Generate Listing'}
      </Button>
    </form>
  );
};

export { GeneratorForm };
