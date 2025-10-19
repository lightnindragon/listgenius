'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { DashboardStats } from '@/components/DashboardStats';

export default function DashboardPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const handleCreateListingClick = () => {
    console.log('Create listing button clicked');
    setCreateModalOpen(true);
  };

  return (
    <DashboardLayout onCreateListingClick={handleCreateListingClick}>
      <DashboardStats 
        createModalOpen={createModalOpen}
        setCreateModalOpen={setCreateModalOpen}
      />
    </DashboardLayout>
  );
}