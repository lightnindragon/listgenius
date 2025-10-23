'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { TopRightToast, emitTopRightToast } from '@/components/TopRightToast';
import { UserMetadata } from '@/types';
import { getBaseUrl } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const { toast, toasts, removeToast } = useToast();
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  // Refresh data when the page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadUserData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const loadUserData = async () => {
    try {
      console.log('Loading user data...');
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/user/metadata`);
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('User data loaded:', JSON.stringify(data, null, 2));
        setUserMetadata(data);
      } else {
        console.error('Failed to load user data:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    openUserProfile();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Container>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
            <p className="text-gray-600">
              Manage your account information and preferences.
            </p>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
              <Button onClick={handleEditProfile} variant="outline">
                Edit Profile
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <Input
                  value={user?.fullName || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  value={user?.emailAddresses[0]?.emailAddress || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <Input
                  value={user?.id || ''}
                  disabled
                  className="bg-gray-50 text-xs"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member Since
                </label>
                <Input
                  value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Current Plan */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Plan</h2>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 capitalize">
                  {userMetadata?.plan || 'Free'} Plan
                </h3>
                <p className="text-gray-600">
                  {userMetadata?.plan === 'free' && '6 generations per month, Professional tone only'}
                  {userMetadata?.plan === 'pro' && 'Unlimited generations, all tones, saved generations'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Daily Generations</h4>
                <div className="text-2xl font-bold text-gray-900">
                  {typeof userMetadata?.dailyGenCount === 'number' ? userMetadata.dailyGenCount : 0}/
                  {userMetadata?.plan === 'free' ? '3' : 
                   userMetadata?.plan === 'pro' ? '50' :
                   userMetadata?.plan === 'business' ? '200' : '∞'}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Daily Rewrites</h4>
                <div className="text-2xl font-bold text-gray-900">
                  {typeof userMetadata?.dailyRewriteCount === 'number' ? userMetadata.dailyRewriteCount : 0}/
                  {userMetadata?.plan === 'free' ? '3' : 
                   userMetadata?.plan === 'pro' ? '25' :
                   userMetadata?.plan === 'business' ? '100' : '∞'}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Last Reset</h4>
                <div className="text-sm text-gray-600">
                  {userMetadata?.lastResetDate ? new Date(userMetadata.lastResetDate).toLocaleDateString() : 'Never'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => window.location.href = '/app/upgrade'}
                className="w-full"
              >
                Upgrade Plan
              </Button>
              
              <Button
                onClick={() => window.location.href = '/app/settings'}
                variant="outline"
                className="w-full"
              >
                Go to Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Toast Container */}
        <ToastContainer toasts={toasts} onClose={removeToast} />

        {/* Top Right Toast Notifications */}
        <TopRightToast />
      </Container>
    </div>
  );
}
