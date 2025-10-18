'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { KeywordChips } from './KeywordChips';
import { Plus, X } from 'lucide-react';

interface GeneratorFormProps {
  onSubmit: (data: GenerateRequest) => void;
  loading: boolean;
  userPreferences?: { tone?: string; niche?: string };
  className?: string;
}

interface GenerateRequest {
  productName: string;
  niche?: string;
  audience?: string;
  keywords: string[];
  tone?: string;
  extras?: {
    pinterestCaption?: boolean;
    etsyMessage?: boolean;
  };
}

const toneOptions = [
  'Professional',
  'Casual',
  'Luxury',
  'Playful',
  'Friendly',
  'Minimalist',
  'Creative'
];

const GeneratorForm: React.FC<GeneratorFormProps> = ({
  onSubmit,
  loading,
  userPreferences,
  className
}) => {
  const [formData, setFormData] = useState<GenerateRequest>({
    productName: '',
    niche: userPreferences?.niche || '',
    audience: '',
    keywords: [],
    tone: userPreferences?.tone || '',
    extras: {
      pinterestCaption: false,
      etsyMessage: false
    }
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userPreferences) {
      setFormData(prev => ({
        ...prev,
        niche: userPreferences.niche || prev.niche,
        tone: userPreferences.tone || prev.tone
      }));
    }
  }, [userPreferences]);

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
      <div>
        <Input
          label="Product Name *"
          value={formData.productName}
          onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
          placeholder="e.g., Printable Wedding Planner Template"
          error={errors.productName}
          maxLength={100}
        />
      </div>

      <div>
        <Input
          label="Niche"
          value={formData.niche}
          onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
          placeholder="e.g., Wedding Planning, Digital Art, Printables"
          helperText="Optional: Helps AI understand your product category"
          maxLength={50}
        />
      </div>

      <div>
        <Input
          label="Target Audience"
          value={formData.audience}
          onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value }))}
          placeholder="e.g., Brides-to-be, Small business owners, Crafters"
          helperText="Optional: Helps AI tailor the tone and language"
          maxLength={200}
        />
      </div>

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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tone
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {toneOptions.map((tone) => (
            <button
              key={tone}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, tone }))}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                formData.tone === tone
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              {tone}
            </button>
          ))}
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Optional: Choose a tone for your listing
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Extras
        </label>
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
