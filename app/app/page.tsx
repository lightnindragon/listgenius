'use client';

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { DashboardStats } from '@/components/DashboardStats';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardStats />
    </DashboardLayout>
  );
}