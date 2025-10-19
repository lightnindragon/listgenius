'use client';

import React from 'react';
import { Sidebar } from '@/components/ui/Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  onCreateListingClick?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, onCreateListingClick }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <Sidebar onCreateListingClick={onCreateListingClick} />
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
