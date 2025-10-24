'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { AlertCircle, CheckCircle, Clock, Zap, RotateCcw } from 'lucide-react';
import { getBaseUrl } from '@/lib/utils';
import { isEnabled } from '@/lib/flags';
import { useUserMetadata } from '@/contexts/UserMetadataContext';

interface StatusIndicatorProps {
  className?: string;
}

export function StatusIndicator({ className }: StatusIndicatorProps) {
  const { user, isSignedIn } = useUser();
  const { userMetadata, loading, refreshUserMetadata } = useUserMetadata();
  const [isResetting, setIsResetting] = useState(false);

  // Reset daily counters (development only)
  const handleResetCounters = async () => {
    setIsResetting(true);
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/dev/reset-counter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        // Refresh user data using context
        await refreshUserMetadata();
        // Emit event to notify other components
        window.dispatchEvent(new CustomEvent('resetCompleted'));
        // Also use localStorage as backup
        localStorage.setItem('resetCompleted', Date.now().toString());
      }
    } catch (error) {
      console.error('Failed to reset counters:', error);
    } finally {
      setIsResetting(false);
    }
  };

  // Don't show anything if not signed in or loading
  if (!isSignedIn || loading) {
    return null;
  }

  const plan = userMetadata?.plan || 'free';
  const dailyGenCount = userMetadata?.dailyGenCount || 0;
  const dailyRewriteCount = userMetadata?.dailyRewriteCount || 0;
  
  console.log('StatusIndicator: Current plan:', plan, 'userMetadata:', userMetadata);

  // Only show plan status in header, not generation count
  const getPlanStatus = () => {
    if (plan === 'free') {
      return {
        icon: Clock,
        message: 'Free Plan',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        showUpgrade: dailyGenCount >= 3
      };
    } else {
      return {
        icon: Zap,
        message: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        showUpgrade: false
      };
    }
  };

  const planStatus = getPlanStatus();
  const StatusIcon = planStatus.icon;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Plan Status Only */}
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm font-medium ${planStatus.bgColor} ${planStatus.borderColor} ${planStatus.color}`}>
        <StatusIcon className="h-4 w-4" />
        <span>{planStatus.message}</span>
      </div>

      {/* Upgrade Button for Free Plan Users */}
      {planStatus.showUpgrade && (
        <a
          href="/app/upgrade"
          className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Upgrade
        </a>
      )}

      {/* Development Reset Button */}
      {isEnabled('developerMode') && (
        <button
          onClick={handleResetCounters}
          disabled={isResetting}
          className="px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
        >
          <RotateCcw className="h-4 w-4" />
          <span>{isResetting ? 'Resetting...' : 'Reset'}</span>
        </button>
      )}
    </div>
  );
}

