'use client';

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { BulkTagsTool } from '@/components/BulkTagsTool';

export default function BulkTagsPage() {
  return (
    <DashboardLayout>
      <BulkTagsTool />
    </DashboardLayout>
  );
}

