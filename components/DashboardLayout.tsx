'use client';

import React from 'react';
import { Sidebar } from '@/components/ui/Sidebar';
import { isEnabled } from '@/lib/flags';

interface DashboardLayoutProps {
  children: React.ReactNode;
  onCreateListingClick?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, onCreateListingClick }) => {
  console.log('DashboardLayout - onCreateListingClick:', typeof onCreateListingClick);
  
  // Only pass onCreateListingClick if Etsy is enabled
  const handleCreateListingClick = isEnabled('etsy') ? onCreateListingClick : undefined;
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <Sidebar onCreateListingClick={handleCreateListingClick} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
