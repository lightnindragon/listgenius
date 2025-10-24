'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import { getBaseUrl } from '@/lib/utils';

interface UserMetadata {
  plan: 'free' | 'pro' | 'business' | 'agency';
  dailyGenCount: number;
  dailyRewriteCount: number;
  monthlyGenCount?: number;
  lastResetDate: string;
  preferences?: {
    tone: string;
    niche: string;
    audience: string;
  };
  etsyConnection?: {
    connected: boolean;
    shopId: string;
    shopName: string;
  };
}

interface UserMetadataContextType {
  userMetadata: UserMetadata | null;
  loading: boolean;
  error: string | null;
  refreshUserMetadata: () => Promise<void>;
}

const UserMetadataContext = createContext<UserMetadataContextType | undefined>(undefined);

interface UserMetadataProviderProps {
  children: ReactNode;
}

export function UserMetadataProvider({ children }: UserMetadataProviderProps) {
  const { user, isSignedIn } = useUser();
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const fetchUserMetadata = async (force = false) => {
    if (!isSignedIn) {
      setUserMetadata(null);
      setLoading(false);
      return;
    }

    // Don't fetch if we've fetched within the last 30 seconds unless forced
    const now = Date.now();
    if (!force && now - lastFetch < 30000) {
      return;
    }

    try {
      setError(null);
      const baseUrl = getBaseUrl();
      console.log('UserMetadataContext: Fetching from:', `${baseUrl}/api/user/metadata`);
      const response = await fetch(`${baseUrl}/api/user/metadata`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('UserMetadataContext: Received data:', data);
        setUserMetadata(data);
        setLastFetch(now);
      } else {
        setError(`Failed to load user metadata: ${response.status}`);
        console.error('Failed to load user metadata:', response.status, response.statusText);
      }
    } catch (err) {
      setError('Failed to load user metadata');
      console.error('Failed to load user metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserMetadata = async () => {
    await fetchUserMetadata(true);
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchUserMetadata();
    } else {
      setUserMetadata(null);
      setLoading(false);
    }
  }, [isSignedIn]);

  // Listen for generation events to refresh data
  useEffect(() => {
    const handleGenerationEvent = () => {
      console.log('UserMetadataContext: GenerationCompleted event received, refreshing data...');
      fetchUserMetadata(true);
    };

    const handleResetEvent = () => {
      console.log('UserMetadataContext: ResetCompleted event received, refreshing data...');
      fetchUserMetadata(true);
    };

        const handlePlanUpdateEvent = () => {
          console.log('UserMetadataContext: PlanUpdated event received, refreshing data...');
          console.log('UserMetadataContext: Current plan before refresh:', userMetadata?.plan);
          fetchUserMetadata(true);
        };

    // Listen for page visibility changes (when user comes back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUserMetadata(true);
      }
    };

    // Listen for storage events (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'generationCountUpdated' || e.key === 'resetCompleted' || e.key === 'planUpdated') {
        fetchUserMetadata(true);
      }
    };

    window.addEventListener('generationCompleted', handleGenerationEvent);
    window.addEventListener('resetCompleted', handleResetEvent);
    window.addEventListener('planUpdated', handlePlanUpdateEvent);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('generationCompleted', handleGenerationEvent);
      window.removeEventListener('resetCompleted', handleResetEvent);
      window.removeEventListener('planUpdated', handlePlanUpdateEvent);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const value: UserMetadataContextType = {
    userMetadata,
    loading,
    error,
    refreshUserMetadata,
  };

  return (
    <UserMetadataContext.Provider value={value}>
      {children}
    </UserMetadataContext.Provider>
  );
}

export function useUserMetadata() {
  const context = useContext(UserMetadataContext);
  if (context === undefined) {
    throw new Error('useUserMetadata must be used within a UserMetadataProvider');
  }
  return context;
}
