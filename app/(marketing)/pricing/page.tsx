"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Check, Star } from 'lucide-react';

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [pricing, setPricing] = useState<{pro: number, business: number}>({pro: 29, business: 79});

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    try {
      const response = await fetch('/api/pricing');
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

  const handleCheckout = async (plan: string) => {
    setLoadingPlan(plan);
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: plan.toLowerCase(),
          successUrl: `${window.location.origin}/settings?subscription=success`,
          cancelUrl: `${window.location.origin}/pricing?subscription=cancelled`,
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for testing and small shops',
      features: [
        '6 generations per month',
        'Professional tone only',
        '200 words max per listing',
        'Save generated listings',
        'AI-powered listing generation',
        'Standard support'
      ],
      limitations: [
        'Limited to 6 generations per month',
        'Professional tone only',
        '200 words maximum per listing'
      ],
      cta: 'Get Started Free',
      ctaLink: '/sign-up',
      ctaVariant: 'outline' as const,
      popular: false
    },
    {
      name: 'Pro',
      price: `$${pricing.pro}`,
      period: 'per month',
      description: 'For growing businesses',
      features: [
        '50 generations per day',
        'All 15 tone options',
        '200-600 words per listing',
        'Save generated listings',
        'AI-powered listing generation',
        'Priority support'
      ],
      limitations: [],
      cta: 'Upgrade to Pro',
      ctaLink: '/api/stripe/checkout?plan=pro',
      ctaVariant: 'primary' as const,
      popular: true
    },
    {
      name: 'Business',
      price: `$${pricing.business}`,
      period: 'per month',
      description: 'For established businesses',
      features: [
        '200 generations per day',
        'All 15 tone options',
        '200-600 words per listing',
        'Save generated listings',
        'AI-powered listing generation',
        'Priority support'
      ],
      limitations: [],
      cta: 'Upgrade to Business',
      ctaLink: '/api/stripe/checkout?plan=business',
      ctaVariant: 'primary' as const,
      popular: false
    }
  ];

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="py-20 bg-gradient-to-br from-brand-50 to-white">
        <Container>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Simple, transparent pricing
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Choose the plan that fits your business. Start free and upgrade anytime.
            </p>
          </div>
        </Container>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-lg border-2 p-8 ${
                  plan.popular
                    ? 'border-brand-500 shadow-lg scale-105'
                    : 'border-gray-200 shadow-sm'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-brand-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1">/{plan.period}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Features included:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.limitations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Limitations:</h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-500">
                            <span className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400">•</span>
                            {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  {plan.ctaLink.startsWith('/api/stripe/checkout') ? (
                    <Button
                      variant={plan.ctaVariant}
                      size="lg"
                      className="w-full"
                      onClick={() => handleCheckout(plan.name)}
                      disabled={loadingPlan === plan.name}
                    >
                      {loadingPlan === plan.name ? 'Processing...' : plan.cta}
                    </Button>
                  ) : (
                    <Link href={plan.ctaLink}>
                      <Button variant={plan.ctaVariant} size="lg" className="w-full">
                        {plan.cta}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 bg-gray-50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Compare all features
            </h2>
            <p className="text-xl text-gray-600">
              See exactly what's included in each plan
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Features</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Free</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Pro</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Business</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Agency</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6 text-gray-900">Generation limits</td>
                  <td className="text-center py-4 px-6 text-gray-600">6/month</td>
                  <td className="text-center py-4 px-6 text-green-600">50/day</td>
                  <td className="text-center py-4 px-6 text-green-600">200/day</td>
                  <td className="text-center py-4 px-6 text-green-600">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6 text-gray-900">Tone options</td>
                  <td className="text-center py-4 px-6 text-gray-600">Professional only</td>
                  <td className="text-center py-4 px-6 text-green-600">All 15 tones</td>
                  <td className="text-center py-4 px-6 text-green-600">All 15 tones</td>
                  <td className="text-center py-4 px-6 text-green-600">All 15 tones</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6 text-gray-900">Word count options</td>
                  <td className="text-center py-4 px-6 text-gray-600">200 words max</td>
                  <td className="text-center py-4 px-6 text-green-600">200-600 words</td>
                  <td className="text-center py-4 px-6 text-green-600">200-600 words</td>
                  <td className="text-center py-4 px-6 text-green-600">200-600 words</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6 text-gray-900">Save generated listings</td>
                  <td className="text-center py-4 px-6 text-green-600">✅</td>
                  <td className="text-center py-4 px-6 text-green-600">✅</td>
                  <td className="text-center py-4 px-6 text-green-600">✅</td>
                  <td className="text-center py-4 px-6 text-green-600">✅</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6 text-gray-900">Etsy publishing</td>
                  <td className="text-center py-4 px-6 text-red-500">❌</td>
                  <td className="text-center py-4 px-6 text-red-500">❌</td>
                  <td className="text-center py-4 px-6 text-red-500">❌</td>
                  <td className="text-center py-4 px-6 text-red-500">❌</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6 text-gray-900">Bulk generation</td>
                  <td className="text-center py-4 px-6 text-red-500">❌</td>
                  <td className="text-center py-4 px-6 text-red-500">❌</td>
                  <td className="text-center py-4 px-6 text-red-500">❌</td>
                  <td className="text-center py-4 px-6 text-red-500">❌</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-900">Support</td>
                  <td className="text-center py-4 px-6 text-gray-600">Community</td>
                  <td className="text-center py-4 px-6 text-gray-600">Priority</td>
                  <td className="text-center py-4 px-6 text-gray-600">Email</td>
                  <td className="text-center py-4 px-6 text-gray-600">Dedicated</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Billing FAQ
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes! All paid plans come with a 14-day free trial. No credit card required to start. Cancel anytime during the trial.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards (Visa, MasterCard, American Express) and PayPal. All payments are processed securely through Stripe.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Absolutely. You can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact us for a full refund.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-brand-50">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ready to get started?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of Etsy sellers who are already optimizing their listings with AI.
            </p>
            <Link href="/sign-up">
              <Button size="lg">
                Get Started for Free
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
