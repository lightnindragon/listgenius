'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { AlertCircle, Clock, Zap } from 'lucide-react';
import { useUserMetadata } from '@/contexts/UserMetadataContext';

interface GenerationCounterProps {
  className?: string;
}

export function GenerationCounter({ className }: GenerationCounterProps) {
  const { user, isSignedIn } = useUser();
  const { userMetadata, loading } = useUserMetadata();

  // Don't show anything if not signed in or loading
  if (!isSignedIn || loading) {
    return null;
  }

  const plan = userMetadata?.plan || 'free';
  const dailyGenCount = userMetadata?.dailyGenCount || 0;
  const monthlyGenCount = userMetadata?.monthlyGenCount || 0;

  // Determine status based on plan and usage
  const getStatusInfo = () => {
    if (plan === 'free') {
      if (monthlyGenCount >= 6) {
        return {
          icon: AlertCircle,
          message: 'Monthly limit reached (6/6)',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          showUpgrade: true
        };
      } else {
        return {
          icon: Clock,
          message: `${monthlyGenCount}/6 monthly generations`,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          showUpgrade: false
        };
      }
    } else if (plan === 'pro') {
      if (dailyGenCount >= 50) {
        return {
          icon: AlertCircle,
          message: 'Daily limit reached (50/50)',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          showUpgrade: false
        };
      } else {
        return {
          icon: Zap,
          message: `${dailyGenCount}/50 daily generations`,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          showUpgrade: false
        };
      }
    } else if (plan === 'business') {
      if (dailyGenCount >= 200) {
        return {
          icon: AlertCircle,
          message: 'Daily limit reached (200/200)',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          showUpgrade: false
        };
      } else {
        return {
          icon: Zap,
          message: `${dailyGenCount}/200 daily generations`,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
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
          Upgrade to Pro (50/day)
        </a>
      )}
    </div>
  );
}
