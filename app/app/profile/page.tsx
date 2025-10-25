'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { TopRightToast, emitTopRightToast } from '@/components/TopRightToast';
import { DashboardLayout } from '@/components/DashboardLayout';
import { UserMetadata } from '@/types';
import { getBaseUrl } from '@/lib/utils';
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const { toast, toasts, removeToast } = useToast();
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{[key: string]: string}>({});

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

  const validatePassword = (password: string) => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    return errors;
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Validate new password in real-time
    if (field === 'newPassword' && value) {
      const errors = validatePassword(value);
      if (errors.length > 0) {
        setPasswordErrors(prev => ({ ...prev, newPassword: errors[0] }));
      }
    }

    // Check password confirmation
    if (field === 'confirmPassword' && value && passwordData.newPassword) {
      if (value !== passwordData.newPassword) {
        setPasswordErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      }
    }
  };

  const handlePasswordSubmit = async () => {
    setPasswordLoading(true);
    setPasswordErrors({});

    // Validation
    const errors: {[key: string]: string} = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else {
      const passwordErrors = validatePassword(passwordData.newPassword);
      if (passwordErrors.length > 0) {
        errors.newPassword = passwordErrors[0];
      }
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      setPasswordLoading(false);
      return;
    }

    try {
      // Use Clerk's password change functionality
      await user?.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      toast.success('Password Updated', 'Your password has been successfully changed.');

      emitTopRightToast('Password updated successfully!', 'success');

    } catch (error: any) {
      console.error('Password change error:', error);
      
      let errorMessage = 'Failed to update password. Please try again.';
      
      if (error.errors && error.errors.length > 0) {
        const firstError = error.errors[0];
        if (firstError.code === 'form_password_incorrect') {
          errorMessage = 'Current password is incorrect';
          setPasswordErrors({ currentPassword: errorMessage });
        } else {
          errorMessage = firstError.message || errorMessage;
        }
      }

      toast.error('Password Update Failed', errorMessage);

      emitTopRightToast(errorMessage, 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
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

          {/* Change Password */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <Input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    placeholder="Enter your current password"
                    className={`pr-10 ${passwordErrors.currentPassword ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    {passwordErrors.currentPassword}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    placeholder="Enter your new password"
                    className={`pr-10 ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    {passwordErrors.newPassword}
                  </p>
                )}
                {passwordData.newPassword && !passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Password meets requirements
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    placeholder="Confirm your new password"
                    className={`pr-10 ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    {passwordErrors.confirmPassword}
                  </p>
                )}
                {passwordData.confirmPassword && !passwordErrors.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Passwords match
                  </p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Password Requirements:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• At least 8 characters long</li>
                  <li>• Contains at least one lowercase letter</li>
                  <li>• Contains at least one uppercase letter</li>
                  <li>• Contains at least one number</li>
                  <li>• Contains at least one special character (@$!%*?&)</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handlePasswordSubmit}
                  disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || Object.keys(passwordErrors).length > 0}
                  className="min-w-[120px]"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </Button>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Monthly Generations</h4>
                <div className="text-2xl font-bold text-gray-900">
                  {typeof userMetadata?.monthlyGenCount === 'number' ? userMetadata.monthlyGenCount : 0}/
                  {(userMetadata?.plan || 'free') === 'free' ? '6' : '∞'}
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
      </DashboardLayout>
    );
  }
