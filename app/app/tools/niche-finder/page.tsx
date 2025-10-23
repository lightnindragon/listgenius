/**
 * Niche Finder Tool Page
 */

'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/DashboardLayout';
import { NicheFinderTool } from '@/components/NicheFinderTool';
import { TopRightToast } from '@/components/TopRightToast';

export default function NicheFinderPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading niche finder...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <NicheFinderTool />
      <TopRightToast />
    </DashboardLayout>
  );
}
