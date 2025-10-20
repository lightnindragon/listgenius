'use client';

import React, { useState } from 'react';
// Custom modal implementation (no Dialog component needed)
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { KeywordChips } from './KeywordChips';
import { ImageManager } from './ImageManager';
import { Plus, X, Upload } from 'lucide-react';
import { emitTopRightToast } from './TopRightToast';
import { getBaseUrl } from '@/lib/utils';
import { ListingOutput } from '@/types';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onListingCreated: () => void;
}

const toneOptions = [
  { value: 'Professional', description: 'Clear, authoritative, and business-focused' },
  { value: 'Friendly', description: 'Approachable, helpful, and conversational' },
  { value: 'Casual', description: 'Relaxed, informal, and easy-going' },
  { value: 'Formal', description: 'Sophisticated, structured, and polished' },
  { value: 'Enthusiastic', description: 'Excited, energetic, and passionate' },
  { value: 'Warm', description: 'Cozy, inviting, and personal' },
  { value: 'Creative', description: 'Artistic, imaginative, and unique' },
  { value: 'Luxury', description: 'Premium, elegant, and sophisticated' },
  { value: 'Playful', description: 'Fun, lighthearted, and cheerful' },
  { value: 'Minimalist', description: 'Clean, simple, and focused' },
  { value: 'Artistic', description: 'Expressive, creative, and aesthetic' },
  { value: 'Rustic', description: 'Natural, earthy, and handmade' }
];

export const CreateListingModal: React.FC<CreateListingModalProps> = ({ 
  isOpen, 
  onClose, 
  onListingCreated 
}) => {
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    keywords: [] as string[],
    tone: 'Professional',
    niche: '',
    audience: '',
    wordCount: 300
  });
  const [output, setOutput] = useState<ListingOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [images, setImages] = useState<any[]>([]);
  const [createdListingId, setCreatedListingId] = useState<number | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName.trim()) {
      emitTopRightToast('Please enter a product name', 'error');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        productName: formData.productName,
        keywords: formData.keywords.length > 0 ? formData.keywords : ['handmade', 'unique', 'artisan'],
        tone: formData.tone,
        niche: formData.niche || 'handmade',
        audience: formData.audience || 'customers',
        wordCount: formData.wordCount,
        extras: {
          pinterestCaption: true,
          etsyMessage: true
        }
      };
      
      console.log('Create listing request data:', requestData);
      
      const response = await fetch(`${getBaseUrl()}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      console.log('Create listing response:', result);

      if (response.ok && result.success) {
        setOutput(result.data);
        emitTopRightToast('Listing generated successfully!', 'success');
      } else {
        const errorMessage = result.error || 'Failed to generate listing';
        console.error('Create listing error:', errorMessage);
        emitTopRightToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Create listing error:', error);
      emitTopRightToast('An error occurred while generating the listing', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToEtsy = async () => {
    if (!output) return;

    setPublishing(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/etsy/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: output.title,
          description: output.description,
          tags: output.tags,
          materials: output.materials,
          price: 1999, // $19.99 default
          quantity: 1
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setCreatedListingId(result.data.listing_id);
        emitTopRightToast('Listing created successfully on Etsy!', 'success');
        // Don't close modal yet - let user manage images
      } else {
        const errorMessage = result.error || 'Failed to create listing on Etsy';
        emitTopRightToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Publish to Etsy error:', error);
      emitTopRightToast('An error occurred while publishing to Etsy', 'error');
    } finally {
      setPublishing(false);
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

  const handleClose = () => {
    setOutput(null);
    setImages([]);
    setCreatedListingId(null);
    setFormData({
      productName: '',
      description: '',
      keywords: [],
      tone: 'Professional',
      niche: '',
      audience: '',
      wordCount: 300
    });
    onListingCreated();
    onClose();
  };

  const handleImagesChange = (newImages: any[]) => {
    setImages(newImages);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Etsy Listing</h2>
            <p className="text-sm text-gray-600 mt-1">
              Generate and publish a new listing directly to your Etsy shop.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Section */}
            <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Listing Details</h3>
            
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <Input
                  value={formData.productName}
                  onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                  placeholder="Enter your product name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keywords
                </label>
                <KeywordChips
                  keywords={formData.keywords}
                  onAdd={handleKeywordAdd}
                  onRemove={handleKeywordRemove}
                  placeholder="Add keywords (e.g., handmade, unique, gift)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tone
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {toneOptions.map((tone) => (
                    <button
                      key={tone.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tone: tone.value }))}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        formData.tone === tone.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {tone.value}
                    </button>
                  ))}
                </div>
                {formData.tone && (
                  <p className="text-xs text-gray-500 mt-1">
                    {toneOptions.find(t => t.value === formData.tone)?.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Niche
                </label>
                <Input
                  value={formData.niche}
                  onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
                  placeholder="e.g., jewelry, home decor, art"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Audience
                </label>
                <Input
                  value={formData.audience}
                  onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value }))}
                  placeholder="e.g., coffee lovers, gift buyers"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description Length
                </label>
                <select
                  value={formData.wordCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, wordCount: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={200}>200 words (Short)</option>
                  <option value={300}>300 words (Medium)</option>
                  <option value={400}>400 words (Long)</option>
                  <option value={500}>500 words (Detailed)</option>
                  <option value={600}>600 words (Comprehensive)</option>
                </select>
              </div>

              <Button
                type="submit"
                disabled={loading || !formData.productName.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Listing
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Output Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Generated Listing</h3>
            
            {output ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-900">{output.title}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border max-h-32 overflow-y-auto">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{output.description}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {output.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {!createdListingId ? (
                  <Button
                    onClick={handlePublishToEtsy}
                    disabled={publishing}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {publishing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Publishing to Etsy...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Publish to Etsy
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">
                        ✓ Listing created successfully! Now add images to your listing.
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Manage Images
                      </label>
                      <ImageManager
                        listingId={createdListingId}
                        initialImages={images}
                        onImagesChange={handleImagesChange}
                      />
                    </div>
                    
                    <Button
                      onClick={handleClose}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Finish & Close
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No listing generated yet</h4>
                <p className="text-sm text-gray-600">
                  Fill in the form and click "Generate Listing" to create your Etsy listing
                </p>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
