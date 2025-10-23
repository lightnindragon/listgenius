/**
 * Analytics Page
 */

'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AdvancedAnalyticsDashboard } from '@/components/AdvancedAnalyticsDashboard';
import { TopRightToast } from '@/components/TopRightToast';

export default function AnalyticsPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AdvancedAnalyticsDashboard />
      <TopRightToast />
    </DashboardLayout>
  );
}
