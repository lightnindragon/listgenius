'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { getBaseUrl } from '@/lib/utils';

export const RewriteCounter: React.FC = () => {
  const [usage, setUsage] = useState<{ rewrites: number; plan: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/user/metadata`);
      if (!response.ok) {
        console.error('Failed to load user metadata:', response.status);
        return;
      }
      const data = await response.json();
      if (data.success) {
        setUsage({
          rewrites: data.dailyRewriteCount || 0,
          plan: data.plan || 'free'
        });
      }
    } catch (error) {
      console.error('Error loading user metadata:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();

    // Listen for rewrite completion event
    const handleRewriteCompleted = () => {
      console.log('RewriteCounter: rewriteCompleted event received');
      loadUserData();
    };

    // Listen for reset event
    const handleResetCompleted = () => {
      console.log('RewriteCounter: resetCompleted event received');
      loadUserData();
    };

    // Listen for visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('RewriteCounter: Page became visible, refreshing data');
        loadUserData();
      }
    };

    // Listen for localStorage changes (cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rewriteCountUpdated' || e.key === 'resetCompleted') {
        console.log('RewriteCounter: localStorage change detected');
        loadUserData();
      }
    };

    window.addEventListener('rewriteCompleted', handleRewriteCompleted);
    window.addEventListener('resetCompleted', handleResetCompleted);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    // Periodic refresh every 5 seconds
    const refreshInterval = setInterval(() => {
      console.log('RewriteCounter: Periodic refresh');
      loadUserData();
    }, 5000);

    return () => {
      window.removeEventListener('rewriteCompleted', handleRewriteCompleted);
      window.removeEventListener('resetCompleted', handleResetCompleted);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(refreshInterval);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-brand-500" />
          <span className="text-sm font-medium text-gray-700">Loading...</span>
        </div>
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  const isPaidPlan = usage.plan !== 'free';
  const limit = isPaidPlan ? 'Unlimited' : '1';
  const count = usage.rewrites;
  const isLimitReached = !isPaidPlan && count >= 1;

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center space-x-2">
        <Zap className={`h-5 w-5 ${isLimitReached ? 'text-red-500' : 'text-brand-500'}`} />
        <span className="text-sm font-medium text-gray-700">
          Rewrites Today: <span className={isLimitReached ? 'text-red-600' : 'text-brand-600'}>{count}</span>
          {!isPaidPlan && <span className="text-gray-500"> / {limit}</span>}
          {isPaidPlan && <span className="text-gray-500"> (Unlimited)</span>}
        </span>
      </div>
      
      {isLimitReached && (
        <Link
          href="/app/upgrade"
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors"
        >
          <Zap className="h-3 w-3 mr-1" />
          Upgrade
        </Link>
      )}
    </div>
  );
};

