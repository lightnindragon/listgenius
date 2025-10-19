'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { AlertCircle, Clock, Zap } from 'lucide-react';
import { getBaseUrl } from '@/lib/utils';

interface GenerationCounterProps {
  className?: string;
}

interface UserMetadata {
  plan: 'free' | 'pro' | 'business' | 'agency';
  dailyGenCount: number;
  dailyRewriteCount: number;
  lastResetDate: string;
}

export function GenerationCounter({ className }: GenerationCounterProps) {
  const { user, isSignedIn } = useUser();
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user metadata
  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    const loadUserData = async () => {
      try {
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/api/user/metadata`);
        if (response.ok) {
          const data = await response.json();
          setUserMetadata(data);
        } else {
          console.error('Failed to load user metadata:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Failed to load user metadata:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();

    // Set up periodic refresh every 5 seconds to catch any missed updates
    const refreshInterval = setInterval(() => {
      loadUserData();
    }, 5000);

    // Listen for generation events to refresh data
    const handleGenerationEvent = () => {
      console.log('GenerationCompleted event received, refreshing data...');
      loadUserData();
    };

    // Listen for reset events
    const handleResetEvent = () => {
      console.log('ResetCompleted event received, refreshing data...');
      loadUserData();
    };

    // Listen for page visibility changes (when user comes back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadUserData();
      }
    };

    // Listen for storage events (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'generationCountUpdated' || e.key === 'resetCompleted') {
        loadUserData();
      }
    };

    window.addEventListener('generationCompleted', handleGenerationEvent);
    window.addEventListener('resetCompleted', handleResetEvent);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('generationCompleted', handleGenerationEvent);
      window.removeEventListener('resetCompleted', handleResetEvent);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isSignedIn]);

  // Don't show anything if not signed in or loading
  if (!isSignedIn || loading) {
    return null;
  }

  const plan = userMetadata?.plan || 'free';
  const dailyGenCount = userMetadata?.dailyGenCount || 0;
  const dailyRewriteCount = userMetadata?.dailyRewriteCount || 0;

  // Determine status based on plan and usage
  const getStatusInfo = () => {
    if (plan === 'free') {
      if (dailyGenCount >= 3) {
        return {
          icon: AlertCircle,
          message: 'Daily limit reached (3/3)',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          showUpgrade: true
        };
      } else {
        return {
          icon: Clock,
          message: `${dailyGenCount}/3 generations today`,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          showUpgrade: false
        };
      }
    } else {
      return {
        icon: Zap,
        message: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - Unlimited`,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        showUpgrade: false
      };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Generation Status */}
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm font-medium ${statusInfo.bgColor} ${statusInfo.borderColor} ${statusInfo.color}`}>
        <StatusIcon className="h-4 w-4" />
        <span>{statusInfo.message}</span>
      </div>

      {/* Upgrade Button for Free Plan Users */}
      {statusInfo.showUpgrade && (
        <a
          href="/app/upgrade"
          className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Upgrade
        </a>
      )}
    </div>
  );
}
