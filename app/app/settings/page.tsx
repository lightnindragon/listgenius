'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Container } from '@/components/ui/Container';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { TopRightToast, emitTopRightToast } from '@/components/TopRightToast';
import { getBaseUrl } from '@/lib/utils';
import { 
  Palette, 
  Link, 
  Bell, 
  Shield,
  Target,
  CreditCard,
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
  preferences?: UserPreferences;
  etsyConnection?: {
    shopId: string;
    shopName: string;
    connected: boolean;
  };
}

export default function SettingsPage() {
  const { user } = useUser();
  const { toast, toasts, removeToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    tone: 'Professional',
    niche: '',
    audience: ''
  });
  const [etsyConnection, setEtsyConnection] = useState({
    connected: false,
    shopName: '',
    loading: true
  });

  const toneOptions = [
    { value: 'Professional', description: 'Clear, authoritative, and business-focused' },
    { value: 'Friendly', description: 'Approachable, helpful, and conversational' },
    { value: 'Casual', description: 'Relaxed, informal, and easy-going' },
    { value: 'Formal', description: 'Sophisticated, structured, and polished' },
    { value: 'Enthusiastic', description: 'Excited, energetic, and passionate' },
    { value: 'Warm', description: 'Cozy, comforting, and inviting' },
    { value: 'Creative', description: 'Imaginative, unique, and expressive' },
    { value: 'Luxury', description: 'Premium, exclusive, and high-end' },
    { value: 'Playful', description: 'Fun, whimsical, and lighthearted' },
    { value: 'Minimalist', description: 'Clean, simple, and focused' },
    { value: 'Artistic', description: 'Aesthetic, expressive, and creative' },
    { value: 'Rustic', description: 'Natural, earthy, and handcrafted' },
    { value: 'Modern', description: 'Contemporary, sleek, and current' },
    { value: 'Vintage', description: 'Retro, nostalgic, and timeless' },
    { value: 'Elegant', description: 'Refined, sophisticated, and graceful' }
  ];

  const planFeatures = {
    free: { generations: 3, etsyConnection: false },
    pro: { generations: 50, etsyConnection: true },
    business: { generations: 200, etsyConnection: true },
    agency: { generations: '∞', etsyConnection: true }
  };

  useEffect(() => {
    loadUserData();
    checkEtsyConnection();
  }, []);

  // Refresh data when the page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadUserData();
        checkEtsyConnection();
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
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/etsy/me`);
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
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/user/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        toast.success('Preferences saved successfully!');
        emitTopRightToast('Preferences saved successfully!', 'success');
        loadUserData();
      } else {
        emitTopRightToast('Failed to save preferences', 'error');
      }
    } catch (error) {
      emitTopRightToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectEtsy = async () => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/etsy/oauth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.authUrl;
      } else {
        emitTopRightToast('Failed to initiate Etsy connection', 'error');
      }
    } catch (error) {
      emitTopRightToast('Network error. Please try again.', 'error');
    }
  };

  const handleDisconnectEtsy = async () => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/etsy/me`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Etsy account disconnected');
        checkEtsyConnection();
      } else {
        emitTopRightToast('Failed to disconnect Etsy account', 'error');
      }
    } catch (error) {
      emitTopRightToast('Network error. Please try again.', 'error');
    }
  };

  const handleManageBilling = async () => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/stripe/portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        emitTopRightToast('Failed to open billing portal', 'error');
      }
    } catch (error) {
      emitTopRightToast('Network error. Please try again.', 'error');
    }
  };

  if (!userMetadata) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <Container>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <SettingsIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Loading settings...</p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const currentPlan = userMetadata?.plan || 'free';
  const features = planFeatures[currentPlan as keyof typeof planFeatures];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Container>
        <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your preferences and integrations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-8">
            {/* Default Preferences */}
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
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {toneOptions.map((tone) => (
                        <button
                          key={tone.value}
                          onClick={() => setPreferences(prev => ({ ...prev, tone: tone.value }))}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            preferences.tone === tone.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title={tone.description}
                        >
                          {tone.value}
                        </button>
                      ))}
                    </div>
                    {preferences.tone && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">{preferences.tone}:</span>{' '}
                          {toneOptions.find(t => t.value === preferences.tone)?.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Niche
                  </label>
                  <Input
                    value={preferences.niche}
                    onChange={(e) => setPreferences(prev => ({ ...prev, niche: e.target.value }))}
                    placeholder="e.g., Digital Art, Wedding Planning, Home Decor"
                    className="w-full"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Helps AI understand your product category
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Target Audience
                  </label>
                  <Input
                    value={preferences.audience}
                    onChange={(e) => setPreferences(prev => ({ ...prev, audience: e.target.value }))}
                    placeholder="e.g., Small business owners, Creative professionals"
                    className="w-full"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Helps AI tailor the tone and language
                  </p>
                </div>

                <Button
                  onClick={handleSavePreferences}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </div>

            {/* Etsy Integration */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Link className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Etsy Integration</h2>
              </div>
              
              {etsyConnection.loading ? (
                <div className="text-center py-4">
                  <p className="text-gray-600">Checking Etsy connection...</p>
                </div>
              ) : etsyConnection.connected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-green-800">Connected to Etsy</p>
                        <p className="text-sm text-green-600">{etsyConnection.shopName}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleDisconnectEtsy}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">Connect your Etsy shop to publish listings directly</p>
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
                    <span className="text-gray-800">Daily Generations:</span>
                    <span className="font-medium text-gray-900">{features.generations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-800">Etsy Connection:</span>
                    <span className="font-medium text-gray-900">{features.etsyConnection ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-700 mb-2 font-medium">Usage Today:</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-800">Generations:</span>
                      <span className="font-medium text-gray-900">{userMetadata?.dailyGenCount || 0}/{typeof features.generations === 'number' ? features.generations : '∞'}</span>
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
                  onClick={() => window.location.href = '/app/profile'}
                  className="w-full justify-start"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
                
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
                  onClick={() => window.location.href = '/app/upgrade'}
                  className="w-full justify-start"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  View Plans
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/app/billing'}
                  className="w-full justify-start"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage Billing
                </Button>
              </div>
            </div>
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