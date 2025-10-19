'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { TopRightToast, emitTopRightToast } from '@/components/TopRightToast';
import { getBaseUrl } from '@/lib/utils';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Download, 
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface BillingData {
  subscription: {
    id: string;
    status: string;
    current_period_end: number;
    current_period_start: number;
    plan: {
      id: string;
      name: string;
      amount: number;
      currency: string;
      interval: string;
    };
    cancel_at_period_end: boolean;
    canceled_at: number | null;
  } | null;
  upcomingInvoice: {
    amount_due: number;
    currency: string;
    due_date: number;
  } | null;
  paymentMethod: {
    id: string;
    type: string;
    card: {
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
    };
  } | null;
  invoices: Array<{
    id: string;
    amount_paid: number;
    currency: string;
    status: string;
    created: number;
    invoice_pdf: string;
    hosted_invoice_url: string;
  }>;
}

export default function BillingPage() {
  const { user, isLoaded } = useUser();
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      loadBillingData();
    }
  }, [isLoaded, user]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/billing/data`);
      
      if (!response.ok) {
        throw new Error('Failed to load billing data');
      }
      
      const data = await response.json();
      setBillingData(data);
    } catch (error) {
      console.error('Failed to load billing data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load billing data');
      emitTopRightToast('Failed to load billing data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/stripe/portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      emitTopRightToast('Failed to open billing portal', 'error');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'past_due':
        return 'text-red-600 bg-red-50';
      case 'canceled':
        return 'text-gray-600 bg-gray-50';
      case 'unpaid':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'past_due':
        return <AlertCircle className="h-4 w-4" />;
      case 'canceled':
        return <Clock className="h-4 w-4" />;
      case 'unpaid':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <Container>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
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
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/app/settings"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
            <p className="text-gray-600 mt-1">Manage your subscription and billing information</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <h3 className="text-red-800 font-medium">Error Loading Billing Data</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
        ) : billingData ? (
          <div className="space-y-6">
            {/* Current Subscription */}
            {billingData.subscription ? (
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Current Subscription</h2>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(billingData.subscription.status)}`}>
                    {getStatusIcon(billingData.subscription.status)}
                    <span className="ml-2 capitalize">{billingData.subscription.status.replace('_', ' ')}</span>
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Plan Details</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Plan:</span>
                        <span className="font-medium">{billingData.subscription.plan.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-medium">{formatCurrency(billingData.subscription.plan.amount, billingData.subscription.plan.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Billing:</span>
                        <span className="font-medium capitalize">{billingData.subscription.plan.interval}ly</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Billing Cycle</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Current Period:</span>
                        <span className="font-medium">{formatDate(billingData.subscription.current_period_start)} - {formatDate(billingData.subscription.current_period_end)}</span>
                      </div>
                      {billingData.subscription.cancel_at_period_end && (
                        <div className="flex items-center text-orange-600">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm">Cancels at period end</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <Button onClick={handleManageSubscription} className="w-full md:w-auto">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage Subscription
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border p-6">
                <div className="text-center">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
                  <p className="text-gray-600 mb-4">You're currently on the free plan.</p>
                  <Link href="/app/upgrade">
                    <Button>
                      Upgrade Plan
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Next Payment */}
            {billingData.upcomingInvoice && (
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Next Payment</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center text-2xl font-bold text-gray-900">
                      <DollarSign className="h-6 w-6 mr-2" />
                      {formatCurrency(billingData.upcomingInvoice.amount_due, billingData.upcomingInvoice.currency)}
                    </div>
                    <div className="flex items-center text-gray-600 mt-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      Due {formatDate(billingData.upcomingInvoice.due_date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Auto-charged to</div>
                    {billingData.paymentMethod ? (
                      <div className="font-medium">
                        {billingData.paymentMethod.card.brand.toUpperCase()} •••• {billingData.paymentMethod.card.last4}
                      </div>
                    ) : (
                      <div className="text-red-600 text-sm">No payment method</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method */}
            {billingData.paymentMethod && (
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard className="h-8 w-8 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium">
                        {billingData.paymentMethod.card.brand.toUpperCase()} •••• {billingData.paymentMethod.card.last4}
                      </div>
                      <div className="text-sm text-gray-600">
                        Expires {billingData.paymentMethod.card.exp_month}/{billingData.paymentMethod.card.exp_year}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleManageSubscription}>
                    Update
                  </Button>
                </div>
              </div>
            )}

            {/* Billing History */}
            {billingData.invoices && billingData.invoices.length > 0 && (
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing History</h2>
                <div className="space-y-3">
                  {billingData.invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium">
                            {formatCurrency(invoice.amount_paid, invoice.currency)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(invoice.created)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          <span className="ml-1 capitalize">{invoice.status}</span>
                        </span>
                        {invoice.invoice_pdf && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(invoice.hosted_invoice_url, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Billing Data</h3>
              <p className="text-gray-600 mb-4">There was an error loading your billing information.</p>
              <Button onClick={loadBillingData}>
                Try Again
              </Button>
            </div>
          </div>
        )}
        </div>
      </Container>
      
      <TopRightToast />
    </div>
  );
}
