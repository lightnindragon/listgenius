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
import { ListingOutput, GenerateRequest, APIResponse } from '@/types';

export default function AppPage() {
  const { user, isLoaded } = useUser();
  const { toasts, toast, removeToast } = useToast();
  const [output, setOutput] = useState<ListingOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [userPreferences, setUserPreferences] = useState<{ tone?: string; niche?: string; audience?: string }>({});

  // Load user preferences on mount
  useEffect(() => {
    if (user && isLoaded) {
      loadUserPreferences();
    }
  }, [user, isLoaded]);

  // Refresh preferences when page becomes visible (e.g., coming back from settings)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && isLoaded) {
        loadUserPreferences();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, isLoaded]);

  const loadUserPreferences = async () => {
    try {
      const response = await fetch('/api/user/metadata');
      if (response.ok) {
        const data = await response.json();
        setUserPreferences({
          tone: data.preferences?.tone || 'Professional',
          niche: data.preferences?.niche || '',
          audience: data.preferences?.audience || ''
        });
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
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
        loadUserPreferences();
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
    <div className="min-h-screen bg-gray-50 py-12">
      <Container>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                AI Listing Generator
              </h1>
              <p className="text-gray-600">
                Create SEO-optimized Etsy listings with AI. Generate professional titles, descriptions, and tags.
              </p>
            </div>
            <GenerationCounter />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Column */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Product Information
                </h2>
                <GeneratorForm
                  onSubmit={handleGenerate}
                  loading={loading}
                  userPreferences={userPreferences}
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
      </Container>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Top Right Toast Notifications */}
      <TopRightToast />
    </div>
  );
}
