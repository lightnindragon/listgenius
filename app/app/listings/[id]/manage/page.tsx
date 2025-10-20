'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { TopRightToast, emitTopRightToast } from '@/components/TopRightToast';
import { ImageManager } from '@/components/ImageManager';
import { getBaseUrl } from '@/lib/utils';
import { ArrowLeft, Save, Upload, Eye } from 'lucide-react';

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
  images?: Array<{
    listing_image_id: number;
    url_570xN: string;
    url_fullxfull: string;
    rank: number;
    alt_text?: string;
  }>;
  url: string;
  views: number;
  num_favorers: number;
  state: string;
  creation_tsz: number;
  last_modified_tsz: number;
}

interface RewriteOutput {
  title: string;
  description: string;
  tags: string[];
  materials: string[];
  pinterestCaption: string;
  etsyMessage: string;
}

export default function ManageListingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const listingId = params.id as string;

  const [listing, setListing] = useState<EtsyListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [rewriteOutput, setRewriteOutput] = useState<RewriteOutput | null>(null);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [images, setImages] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'images'>('content');

  // Form data for rewrite
  const [formData, setFormData] = useState({
    productName: '',
    keywords: [] as string[],
    tone: 'Professional',
    niche: '',
    audience: ''
  });

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

  useEffect(() => {
    if (isLoaded && listingId) {
      loadListing();
    }
  }, [isLoaded, listingId]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getBaseUrl()}/api/etsy/listings/${listingId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch listing');
      }

      const data = await response.json();
      if (data.success) {
        const listingData = data.data;
        setListing(listingData);
        setImages(listingData.images || []);
        setFormData({
          productName: listingData.title,
          keywords: listingData.tags || [],
          tone: 'Professional',
          niche: '',
          audience: ''
        });
      }
    } catch (error) {
      console.error('Error loading listing:', error);
      emitTopRightToast('Failed to load listing', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRewrite = async () => {
    if (!listing) return;

    setRewriteLoading(true);
    try {
      const requestData = {
        productName: formData.productName || listing.title,
        keywords: formData.keywords.length > 0 ? formData.keywords : listing.tags,
        tone: formData.tone,
        niche: formData.niche || 'handmade',
        audience: formData.audience || 'customers',
        wordCount: 300,
        extras: {
          pinterestCaption: true,
          etsyMessage: true
        }
      };

      const response = await fetch(`${getBaseUrl()}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setRewriteOutput(result.data);
        emitTopRightToast('Listing rewritten successfully!', 'success');
      } else {
        const errorMessage = result.error || 'Failed to rewrite listing';
        emitTopRightToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Rewrite error:', error);
      emitTopRightToast('An error occurred while rewriting the listing', 'error');
    } finally {
      setRewriteLoading(false);
    }
  };

  const handleSave = async () => {
    if (!listing || !rewriteOutput) return;

    setSaving(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/etsy/listings/${listingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: rewriteOutput.title,
          description: rewriteOutput.description,
          tags: rewriteOutput.tags,
          materials: rewriteOutput.materials
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        emitTopRightToast('Listing updated successfully!', 'success');
        // Refresh the listing data
        loadListing();
      } else {
        const errorMessage = result.error || 'Failed to update listing';
        emitTopRightToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Save error:', error);
      emitTopRightToast('An error occurred while saving the listing', 'error');
    } finally {
      setSaving(false);
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

  const handleImagesChange = (newImages: any[]) => {
    setImages(newImages);
  };

  const formatPrice = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US');
  };

  if (!isLoaded || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!listing) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Listing not found</h2>
          <p className="text-gray-600 mb-4">The listing you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/app/listings')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/app/listings')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Listings
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Manage Listing</h1>
                  <p className="text-gray-600">{listing.title}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  asChild
                >
                  <a
                    href={listing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View on Etsy
                  </a>
                </Button>
                {rewriteOutput && (
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Listing Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Price</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {formatPrice(listing.price.amount, listing.price.currency_code)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Views</h3>
                <p className="text-lg font-semibold text-gray-900">{listing.views}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Favorites</h3>
                <p className="text-lg font-semibold text-gray-900">{listing.num_favorers}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
                <p className="text-lg font-semibold text-gray-900">{formatDate(listing.creation_tsz)}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'content'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Content & SEO
                </button>
                <button
                  onClick={() => setActiveTab('images')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'images'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Images ({images.length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'content' && (
                <div className="space-y-6">
                  {/* Original Content */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Original Content</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Title</h4>
                        <p className="text-gray-700">{listing.title}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {listing.tags.map((tag, index) => (
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

                  {/* Rewrite Form */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Rewrite Settings</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product Name
                          </label>
                          <input
                            type="text"
                            value={formData.productName}
                            onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="What is this product called?"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Keywords
                          </label>
                          <div className="space-y-2">
                            <input
                              type="text"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleKeywordAdd(e.currentTarget.value);
                                  e.currentTarget.value = '';
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Add keywords (press Enter to add)"
                            />
                            <div className="flex flex-wrap gap-2">
                              {formData.keywords.map((keyword, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {keyword}
                                  <button
                                    onClick={() => handleKeywordRemove(keyword)}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tone
                          </label>
                          <select
                            value={formData.tone}
                            onChange={(e) => setFormData(prev => ({ ...prev, tone: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {toneOptions.map((tone) => (
                              <option key={tone.value} value={tone.value}>
                                {tone.value}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            {toneOptions.find(t => t.value === formData.tone)?.description}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Niche (Optional)
                          </label>
                          <input
                            type="text"
                            value={formData.niche}
                            onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Home Decor, Jewelry, Art"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Target Audience (Optional)
                          </label>
                          <input
                            type="text"
                            value={formData.audience}
                            onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Young professionals, Parents, Art collectors"
                          />
                        </div>

                        <Button
                          onClick={handleRewrite}
                          disabled={rewriteLoading}
                          className="w-full"
                        >
                          {rewriteLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Rewriting...
                            </>
                          ) : (
                            'Rewrite Listing'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Rewrite Output */}
                  {rewriteOutput && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimized Content</h3>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
                        <div>
                          <h4 className="font-medium text-green-900 mb-2">New Title</h4>
                          <p className="text-green-800">{rewriteOutput.title}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-green-900 mb-2">New Description</h4>
                          <p className="text-green-800 whitespace-pre-wrap">{rewriteOutput.description}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-green-900 mb-2">New Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {rewriteOutput.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'images' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Images</h3>
                  <p className="text-gray-600 mb-6">
                    Upload, reorder, and optimize your listing images. Generate AI alt text for better SEO.
                  </p>
                  
                  {listing && (
                    <ImageManager
                      listingId={parseInt(listingId)}
                      images={images || []}
                      onImagesChange={handleImagesChange}
                      listingTitle={listing.title}
                      listingTags={listing.tags}
                      listingDescription={listing.description}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
