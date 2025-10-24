'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { TopRightToast, emitTopRightToast } from '@/components/TopRightToast';
import { DashboardLayout } from '@/components/DashboardLayout';
import { getBaseUrl } from '@/lib/utils';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { 
  Check, 
  X, 
  Crown, 
  Zap, 
  Building, 
  Users,
  ArrowRight,
  Star,
  CreditCard,
  ExternalLink
} from 'lucide-react';

interface UserMetadata {
  plan: 'free' | 'pro' | 'business' | 'agency';
  dailyGenCount: number;
  dailyRewriteCount: number;
  lastResetDate: string;
}

interface Plan {
  id: 'free' | 'pro' | 'business' | 'agency';
  name: string;
  description: string;
  price: number;
  period: string;
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  popular?: boolean;
  stripePriceId?: string;
}


export default function UpgradePage() {
  const { user } = useUser();
  const analytics = useAnalytics();
  const { toast, toasts, removeToast } = useToast();
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [pricing, setPricing] = useState<{pro: number, business: number}>({pro: 29, business: 79});

  useEffect(() => {
    loadUserData();
    loadPricing();
  }, []);

  const loadUserData = async () => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/user/metadata`);
      if (response.ok) {
        const data = await response.json();
        setUserMetadata(data);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPricing = async () => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/pricing`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPricing({
            pro: data.data.pro.price,
            business: data.data.business.price
          });
        }
      }
    } catch (error) {
      console.error('Error loading pricing:', error);
    }
  };

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      price: 0,
      period: 'forever',
      features: [
        '6 generations per month',
        'Professional tone only',
        '200 words max per listing',
        'Save generated listings',
        'AI-powered listing generation',
        'Standard support'
      ],
      icon: Star,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For growing businesses',
      price: pricing.pro,
      period: 'month',
      features: [
        '50 generations per day',
        'All 15 tone options',
        '200-600 words per listing',
        'Save generated listings',
        'AI-powered listing generation',
        'Priority support'
      ],
      icon: Zap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO
    },
    {
      id: 'business',
      name: 'Business',
      description: 'For established businesses',
      price: pricing.business,
      period: 'month',
      features: [
        '200 generations per day',
        'All 15 tone options',
        '200-600 words per listing',
        'Save generated listings',
        'AI-powered listing generation',
        'Priority support'
      ],
      icon: Building,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      popular: true,
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS
    }
  ];

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    
    // Track upgrade attempt
    const currentPlan = userMetadata?.plan || 'free';
    analytics.trackPlanUpgrade(currentPlan, planId);
    
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/stripe/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId })
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to start checkout');
        emitTopRightToast(error.message || 'Failed to start checkout', 'error');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      emitTopRightToast('Network error. Please try again.', 'error');
    } finally {
      setUpgrading(null);
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
        toast.error('Failed to open billing portal');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
  };

  if (loading || !pricing.pro || !pricing.business) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const currentPlan = userMetadata?.plan || 'free';
  const currentPlanData = plans.find(plan => plan.id === currentPlan);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Unlock the full potential of ListGenius with our flexible pricing plans
            </p>
            
            {/* Current Plan Status */}
            {currentPlanData && (
              <div className={`inline-flex items-center px-6 py-3 rounded-lg border ${currentPlanData.bgColor} ${currentPlanData.borderColor} ${currentPlanData.color}`}>
                <currentPlanData.icon className="h-5 w-5 mr-2" />
                <span className="font-medium">Current Plan: {currentPlanData.name}</span>
              </div>
            )}
          </div>

          {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {plans.map((plan) => {
              const isCurrentPlan = plan.id === currentPlan;
              const Icon = plan.icon;
              
              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-xl border-2 p-8 transition-all duration-200 hover:shadow-lg ${
                    plan.popular 
                      ? 'border-purple-500 ring-2 ring-purple-500 ring-opacity-50' 
                      : isCurrentPlan 
                        ? `${plan.borderColor} ring-2 ${plan.color.replace('text-', 'ring-')} ring-opacity-50`
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Current Plan
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${plan.bgColor} ${plan.color} mb-4`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-600">/{plan.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  <div className="mt-auto">
                    {(() => {
                      if (plan.id === 'free') {
                        return (
                          <Button
                            disabled
                            variant="outline"
                            className="w-full opacity-50 cursor-not-allowed"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            No Billing (Free Plan)
                          </Button>
                        );
                      } else if (isCurrentPlan) {
                        return (
                          <Button
                            onClick={() => window.location.href = '/app/billing'}
                            variant="outline"
                            className="w-full"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Manage Billing
                          </Button>
                        );
                      } else {
                        return (
                          <Button
                            onClick={() => handleUpgrade(plan.id)}
                            disabled={upgrading === plan.id}
                            className={`w-full ${
                              plan.popular 
                                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {upgrading === plan.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                Upgrade
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </>
                            )}
                          </Button>
                        );
                      }
                    })()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Usage Statistics */}
          {userMetadata && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Your Current Usage
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {userMetadata.dailyGenCount}
                  </div>
                  <div className="text-gray-600">Generations Today</div>
                  <div className="text-sm text-gray-500 mt-1">
                    of {currentPlan === 'free' ? '6' : '∞'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {userMetadata.dailyRewriteCount}
                  </div>
                  <div className="text-gray-600">Rewrites Today</div>
                  <div className="text-sm text-gray-500 mt-1">
                    of {currentPlan === 'free' ? '1' : '∞'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                  </div>
                  <div className="text-gray-600">Current Plan</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {currentPlan === 'free' ? 'Basic features' : 'Premium features'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FAQ Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Frequently Asked Questions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h4>
                <p className="text-gray-600">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What happens to unused generations?</h4>
                <p className="text-gray-600">Daily limits reset at midnight UTC. Unused generations don't roll over to the next day.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h4>
                <p className="text-gray-600">Our free plan gives you 6 generations per month to try out all features. No credit card required.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h4>
                <p className="text-gray-600">Absolutely! You can cancel your subscription at any time with no cancellation fees.</p>
              </div>
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
