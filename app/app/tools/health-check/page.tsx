'use client';

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { HealthCheckTool } from '@/components/HealthCheckTool';

export default function HealthCheckPage() {
  return (
    <DashboardLayout>
      <HealthCheckTool />
    </DashboardLayout>
  );
}
