'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Container } from '@/components/ui/Container';
import { RewriteForm } from '@/components/RewriteForm';
import { OutputPanel } from '@/components/OutputPanel';
import { EmptyState } from '@/components/EmptyState';
import { RewriteCounter } from '@/components/RewriteCounter';
import { TopRightToast, emitTopRightToast } from '@/components/TopRightToast';
import { DashboardLayout } from '@/components/DashboardLayout';
import { RefreshCw } from 'lucide-react';
import { getBaseUrl } from '@/lib/utils';

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
}

export default function RewritePage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<RewriteOutput | null>(null);
  const [userPreferences, setUserPreferences] = useState<{ tone?: string; niche?: string; audience?: string }>({});

  // Load user preferences
  useEffect(() => {
    if (user && isLoaded) {
      loadUserPreferences();
    }
  }, [user, isLoaded]);

  // Auto-refresh on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && isLoaded) {
        loadUserPreferences();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, isLoaded]);

  const loadUserPreferences = async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/user/metadata`);
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.success && data.preferences) {
        setUserPreferences({
          tone: data.preferences.tone,
          niche: data.preferences.niche,
          audience: data.preferences.audience
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleRewrite = async (data: RewriteRequest) => {
    setLoading(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setOutput(result.data);
        emitTopRightToast('Listing rewritten successfully!', 'success');
        
        // Dispatch custom event for counter update
        window.dispatchEvent(new CustomEvent('rewriteCompleted'));
        
        // Update localStorage for cross-tab communication
        localStorage.setItem('rewriteCountUpdated', Date.now().toString());
        
        // Refresh preferences in case they changed
        loadUserPreferences();
      } else {
        const errorMessage = result.error || 'Failed to rewrite listing';
        
        if (result.type === 'RATE_LIMIT_ERROR') {
          emitTopRightToast(errorMessage, 'error');
        } else {
          emitTopRightToast(errorMessage, 'error');
        }
      }
    } catch (error) {
      console.error('Rewrite error:', error);
      emitTopRightToast('An error occurred while rewriting the listing', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rewrite Existing Listing</h1>
          <p className="text-gray-600">
            Paste in your current Etsy listing and get back an SEO-optimized version with better keywords and improved copy.
          </p>
        </div>

        {/* Counter - only on rewrite page */}
        <div className="mb-6">
          <RewriteCounter />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Listing Details</h2>
            <RewriteForm
              onSubmit={handleRewrite}
              loading={loading}
              userPreferences={userPreferences}
            />
          </div>

          {/* Output */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:sticky lg:top-8 lg:self-start">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Rewritten Listing</h2>
            {output ? (
              <OutputPanel output={output} />
            ) : (
              <EmptyState
                icon={<RefreshCw className="w-full h-full" />}
                title="No listing rewritten yet"
                description="Fill in the form and click 'Rewrite Listing' to optimize your existing content"
              />
            )}
          </div>
        </div>
      </div>
      
      <TopRightToast />
    </DashboardLayout>
  );
}

