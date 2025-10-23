'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Container } from '@/components/ui/Container';
import { GeneratorForm } from '@/components/GeneratorForm';
import { OutputPanel } from '@/components/OutputPanel';
import { PlanGate } from '@/components/PlanGate';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { TopRightToast, emitTopRightToast } from '@/components/TopRightToast';
import { GenerationCounter } from '@/components/GenerationCounter';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ListingOutput, GenerateRequest, APIResponse } from '@/types';
import { Button } from '@/components/ui/Button';
import { Save, Download } from 'lucide-react';
import { useUserMetadata } from '@/contexts/UserMetadataContext';

export default function AppPage() {
  const { user, isLoaded } = useUser();
  const { toasts, toast, removeToast } = useToast();
  const [output, setOutput] = useState<ListingOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const { userMetadata, refreshUserMetadata } = useUserMetadata();
  const [userPreferences, setUserPreferences] = useState<{ tone?: string; niche?: string; audience?: string }>({});
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'business'>('free');
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [autoSaveInterval, setAutoSaveInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Load user preferences from context
  useEffect(() => {
    if (userMetadata) {
      setUserPreferences({
        tone: userMetadata.preferences?.tone || 'Professional',
        niche: userMetadata.preferences?.niche || '',
        audience: userMetadata.preferences?.audience || ''
      });
      
      // Set user plan
      const plan = userMetadata.plan || 'free';
      setUserPlan(plan === 'pro' || plan === 'business' ? 'pro' : 'free');
    }
  }, [userMetadata]);


  const handleSaveAsTemplate = async (formData: any) => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${formData.productName || 'Untitled'} Template`,
          category: 'custom',
          title: formData.productName || '',
          description: formData.description || '',
          tags: formData.keywords || [],
          price: formData.price,
          materials: formData.materials || [],
        }),
      });

      const result = await response.json();
      if (result.success) {
        emitTopRightToast('Template saved successfully!', 'success');
      } else {
        emitTopRightToast('Failed to save template', 'error');
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      emitTopRightToast('Failed to save template', 'error');
    }
  };

  const handleSaveAsDraft = async (formData: any) => {
    try {
      const response = await fetch('/api/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.productName || 'Untitled Draft',
          description: formData.description || '',
          tags: formData.keywords || [],
          tone: formData.tone || 'Professional',
          niche: formData.niche || '',
          audience: formData.audience || '',
          wordCount: formData.wordCount || 300,
          price: formData.price,
          materials: formData.materials || [],
          isAutoSaved: false,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setCurrentDraftId(result.data.id);
        setLastSaved(new Date());
        emitTopRightToast('Draft saved successfully!', 'success');
      } else {
        emitTopRightToast('Failed to save draft', 'error');
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      emitTopRightToast('Failed to save draft', 'error');
    }
  };

  const handleAutoSave = async (formData: any) => {
    if (!user || isAutoSaving) return;

    setIsAutoSaving(true);
    try {
      const response = await fetch('/api/drafts/auto-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingData: {
            title: formData.productName || 'Untitled Draft',
            description: formData.description || '',
            tags: formData.keywords || [],
            tone: formData.tone || 'Professional',
            niche: formData.niche || '',
            audience: formData.audience || '',
            wordCount: formData.wordCount || 300,
            price: formData.price,
            materials: formData.materials || [],
          },
          existingDraftId: currentDraftId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setCurrentDraftId(result.data.draftId);
        setLastSaved(new Date(result.data.lastSaved));
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  const handleGenerate = async (data: GenerateRequest) => {
    setLoading(true);
    setOutput(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: APIResponse<ListingOutput> = await response.json();

      if (result.success && result.data) {
        setOutput(result.data);
        emitTopRightToast('Listing generated successfully!', 'success');
        // Refresh user data to update generation count
        await refreshUserMetadata();
        // Emit event to notify GenerationCounter to refresh
        window.dispatchEvent(new CustomEvent('generationCompleted'));
        // Also use localStorage as backup
        localStorage.setItem('generationCountUpdated', Date.now().toString());
      } else {
        const errorMessage = result.error || 'Failed to generate listing';
        emitTopRightToast(errorMessage, 'error');
      }
    } catch (error) {
      emitTopRightToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <Container>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <Container>
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Sign in required
            </h1>
            <p className="text-gray-600 mb-6">
              Please sign in to access the listing generator.
            </p>
            <a
              href="/sign-in"
              className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
            >
              Sign In
            </a>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <DashboardLayout onCreateListingClick={() => {}}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AI Listing Generator
            </h1>
            <p className="text-gray-600">
              Create SEO-optimized Etsy listings with AI. Generate professional titles, descriptions, and tags.
            </p>
            {lastSaved && (
              <p className="text-sm text-gray-500 mt-1">
                Last saved: {lastSaved.toLocaleTimeString()}
                {isAutoSaving && <span className="ml-2 text-blue-600">Auto-saving...</span>}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <GenerationCounter />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Product Information
              </h2>
              <GeneratorForm
                onSubmit={handleGenerate}
                loading={loading}
                userPreferences={userPreferences}
                plan={userPlan}
              />
            </div>
          </div>

          {/* Output Column */}
          <div className="space-y-6">
            <OutputPanel
              title={output?.title}
              description={output?.description}
              tags={output?.tags}
              materials={output?.materials}
              pinterestCaption={output?.pinterestCaption}
              etsyMessage={output?.etsyMessage}
              loading={loading}
            />
          </div>
        </div>
      </div>


      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Top Right Toast Notifications */}
      <TopRightToast />
    </DashboardLayout>
  );
}
