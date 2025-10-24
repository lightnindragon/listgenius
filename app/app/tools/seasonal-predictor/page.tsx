'use client';

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SeasonalPredictorTool } from '@/components/SeasonalPredictorTool';

export default function SeasonalPredictorPage() {
  return (
    <DashboardLayout>
      <SeasonalPredictorTool />
    </DashboardLayout>
  );
}

