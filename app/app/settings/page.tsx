'use client';

import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Container } from '@/components/ui/Container';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { 
  User, 
  CreditCard, 
  Link, 
  Palette, 
  Target, 
  Bell, 
  Shield,
  Check,
  X,
  ExternalLink,
  Settings as SettingsIcon
} from 'lucide-react';

interface UserPreferences {
  tone: string;
  niche: string;
  audience: string;
}

interface UserMetadata {
  plan: string;
  dailyGenCount: number;
  dailyRewriteCount: number;
  preferences?: UserPreferences;
  etsyConnection?: {
    shopId: string;
    shopName: string;
    connected: boolean;
  };
}

export default function SettingsPage() {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const { toast, toasts, removeToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    tone: 'Professional',
    niche: '',
    audience: ''
  });
  const [etsyConnection, setEtsyConnection] = useState<{
    connected: boolean;
    shopName?: string;
    loading: boolean;
  }>({
    connected: false,
    loading: true
  });

  const toneOptions = ['Professional', 'Friendly', 'Casual', 'Formal', 'Enthusiastic'];
  const planFeatures = {
    free: { generations: 3, rewrites: 5, etsyConnection: false },
    pro: { generations: 'Unlimited', rewrites: 'Unlimited', etsyConnection: true },
    business: { generations: 'Unlimited', rewrites: 'Unlimited', etsyConnection: true },
    agency: { generations: 'Unlimited', rewrites: 'Unlimited', etsyConnection: true }
  };

  useEffect(() => {
    loadUserData();
    checkEtsyConnection();
  }, []);

  const loadUserData = async () => {
    try {
      console.log('Loading user data...');
      const response = await fetch('/api/user/metadata');
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('User data loaded:', data);
        setUserMetadata(data);
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      } else {
        console.error('Failed to load user data:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const checkEtsyConnection = async () => {
    try {
      const response = await fetch('/api/etsy/me');
      if (response.ok) {
        const data = await response.json();
        setEtsyConnection({
          connected: data.connected,
          shopName: data.shopName,
          loading: false
        });
      } else {
        setEtsyConnection(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      setEtsyConnection(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        toast.success('Preferences saved successfully!');
        loadUserData();
      } else {
        toast.error('Failed to save preferences');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectEtsy = async () => {
    try {
      const response = await fetch('/api/etsy/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.authUrl;
      } else {
        toast.error('Failed to initiate Etsy connection');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
  };

  const handleDisconnectEtsy = async () => {
    try {
      const response = await fetch('/api/etsy/me', {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Etsy account disconnected');
        checkEtsyConnection();
      } else {
        toast.error('Failed to disconnect Etsy account');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        toast.error('Failed to open billing portal');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
  };

  if (!userMetadata) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <SettingsIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </Container>
    );
  }

  const currentPlan = userMetadata.plan || 'free';
  const features = planFeatures[currentPlan as keyof typeof planFeatures];

  return (
    <Container className="py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account preferences and connections</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-8">
            {/* Account Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <p className="text-gray-900">{user?.emailAddresses[0]?.emailAddress}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <p className="text-gray-900">{user?.fullName}</p>
                </div>

                <Button
                  variant="outline"
                  onClick={() => openUserProfile()}
                  className="w-full sm:w-auto"
                >
                  <User className="h-4 w-4 mr-2" />
                  Manage Profile
                </Button>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Palette className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Default Preferences</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Tone
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {toneOptions.map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setPreferences(prev => ({ ...prev, tone }))}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          preferences.tone === tone
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Niche
                  </label>
                  <Input
                    value={preferences.niche}
                    onChange={(e) => setPreferences(prev => ({ ...prev, niche: e.target.value }))}
                    placeholder="e.g., Digital Art, Printables, Templates"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <Input
                    value={preferences.audience}
                    onChange={(e) => setPreferences(prev => ({ ...prev, audience: e.target.value }))}
                    placeholder="e.g., Small business owners, Students, Parents"
                    className="w-full"
                  />
                </div>

                <Button
                  onClick={handleSavePreferences}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </div>

            {/* Etsy Connection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Link className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Etsy Connection</h2>
              </div>
              
              {etsyConnection.loading ? (
                <div className="text-center py-4">
                  <p className="text-gray-600">Checking connection...</p>
                </div>
              ) : etsyConnection.connected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <Check className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Connected to Etsy</p>
                      {etsyConnection.shopName && (
                        <p className="text-sm text-green-700">{etsyConnection.shopName}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleDisconnectEtsy}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <X className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Not Connected</p>
                      <p className="text-sm text-gray-600">Connect your Etsy shop to publish listings directly</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleConnectEtsy}
                    className="w-full"
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Connect Etsy Shop
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Plan Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
              </div>
              
              <div className="space-y-3">
                <div className="text-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    currentPlan === 'free' 
                      ? 'bg-gray-100 text-gray-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Daily Generations:</span>
                    <span className="font-medium">{features.generations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Daily Rewrites:</span>
                    <span className="font-medium">{features.rewrites}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Etsy Connection:</span>
                    <span className="font-medium">{features.etsyConnection ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-2">Usage Today:</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Generations:</span>
                      <span>{userMetadata.dailyGenCount}/{typeof features.generations === 'number' ? features.generations : '∞'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Rewrites:</span>
                      <span>{userMetadata.dailyRewriteCount}/{typeof features.rewrites === 'number' ? features.rewrites : '∞'}</span>
                    </div>
                  </div>
                </div>

                {currentPlan !== 'free' && (
                  <Button
                    onClick={handleManageBilling}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage Billing
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/app'}
                  className="w-full justify-start"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Go to Generator
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/pricing'}
                  className="w-full justify-start"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  View Plans
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </Container>
  );
}
