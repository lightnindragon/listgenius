'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { isEnabled } from '@/lib/flags';
import { 
  FileText, 
  Calendar, 
  Zap,
  Clock
} from 'lucide-react';
import { CreateListingModal } from './CreateListingModal';
import { useUserMetadata } from '@/contexts/UserMetadataContext';

interface DashboardStatsProps {
  className?: string;
  createModalOpen: boolean;
  setCreateModalOpen: (open: boolean) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ className, createModalOpen, setCreateModalOpen }) => {
  const { user } = useUser();
  const { userMetadata, loading, refreshUserMetadata } = useUserMetadata();

  console.log('DashboardStats render - createModalOpen:', createModalOpen);

  const getPlanFeatures = (plan: string) => {
    switch (plan) {
      case 'free':
        return { monthlyGenerations: 6, name: 'Free' };
      case 'pro':
        return { monthlyGenerations: 'unlimited', name: 'Pro' };
      case 'business':
        return { monthlyGenerations: 'unlimited', name: 'Business' };
      case 'agency':
        return { monthlyGenerations: 'unlimited', name: 'Agency' };
      default:
        return { monthlyGenerations: 6, name: 'Free' };
    }
  };

  const handleListingCreated = () => {
    // Refresh user data to update any counters
    refreshUserMetadata();
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const features = getPlanFeatures(userMetadata?.plan || 'free');
  const today = new Date().toLocaleDateString();

  const stats = [
    {
      title: 'Generations This Month',
      value: features.monthlyGenerations === 'unlimited' 
        ? `${userMetadata?.monthlyGenCount || 0}/∞`
        : `${userMetadata?.monthlyGenCount || 0}/${features.monthlyGenerations}`,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'AI listings generated'
    },
    {
      title: 'Current Plan',
      value: features.name,
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Active subscription'
    },
    {
      title: 'Last Reset',
      value: userMetadata?.lastResetDate || today,
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Monthly counters reset'
    }
  ];

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600">Welcome back, {user?.firstName || 'User'}! Here's your activity overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* Create Listing Modal */}
      {isEnabled('etsy') && (
        <CreateListingModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onListingCreated={handleListingCreated}
        />
      )}
    </div>
  );
};
