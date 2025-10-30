'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Container } from '@/components/ui/Container';
import { DashboardLayout } from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import { Copy, Check, DollarSign, Users, TrendingUp, ExternalLink } from 'lucide-react';

export default function AffiliatePage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [affiliate, setAffiliate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payoutEmail, setPayoutEmail] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [updatingSlug, setUpdatingSlug] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  const MIN_PAYOUT = 10;
  const EARLY_THRESHOLD = 50;
  const COOKIE_DAYS = 60;

  useEffect(() => {
    if (!isLoaded) return;
    const adminToken = searchParams.get('adminToken');
    if (!isSignedIn && !adminToken) {
      router.push('/sign-in');
      return;
    }
    fetchAffiliate();
  }, [isLoaded, isSignedIn, router, searchParams]);

  async function fetchAffiliate() {
    try {
      const adminToken = searchParams.get('adminToken');
      const res = adminToken
        ? await fetch(`/api/adm1n796/affiliate/view?token=${encodeURIComponent(adminToken)}`)
        : await fetch('/api/affiliate/dashboard');
      if (res.ok) {
        const data = await res.json();
        setAffiliate(data.affiliate);
        setPayoutEmail(data.affiliate.payoutEmail || '');
        setCustomSlug(data.affiliate.customSlug || '');
      }
    } catch (error) {
      toast.error('Failed to load affiliate data');
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!affiliate) return;
    const link = `${window.location.origin}/?ref=${affiliate.code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  }

  async function updatePayoutEmail() {
    if (!payoutEmail) {
      toast.error('Please enter a valid email');
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch('/api/affiliate/update-payout-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutEmail }),
      });

      if (res.ok) {
        toast.success('Payout email updated');
        fetchAffiliate();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Update failed');
      }
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setUpdating(false);
    }
  }

  async function requestEarlyPayout() {
    setRequesting(true);
    try {
      const res = await fetch('/api/affiliate/request-early-payout', {
        method: 'POST',
      });

      if (res.ok) {
        toast.success('Early payout requested! Admin will process it soon.');
        fetchAffiliate();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Request failed');
      }
    } catch (error) {
      toast.error('Request failed');
    } finally {
      setRequesting(false);
    }
  }

  async function updateCustomSlug() {
    if (!customSlug.trim()) {
      toast.error('Please enter a custom slug');
      return;
    }

    setUpdatingSlug(true);
    try {
      const res = await fetch('/api/affiliate/update-custom-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customSlug: customSlug.trim() }),
      });

      if (res.ok) {
        toast.success('Custom slug updated successfully!');
        fetchAffiliate();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Update failed');
      }
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setUpdatingSlug(false);
    }
  }

  async function checkSlugAvailability() {
    if (!customSlug.trim()) {
      setSlugAvailable(null);
      return;
    }

    setCheckingSlug(true);
    try {
      const res = await fetch('/api/affiliate/check-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: customSlug.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setSlugAvailable(data.available);
        if (!data.available) {
          toast.error(data.message || 'Slug not available');
        }
      } else {
        const data = await res.json();
        setSlugAvailable(false);
        toast.error(data.error || 'Failed to check slug');
      }
    } catch (error) {
      setSlugAvailable(false);
      toast.error('Failed to check slug');
    } finally {
      setCheckingSlug(false);
    }
  }

  // Show loading while Clerk is loading or while fetching affiliate data
  if (!isLoaded || loading) {
    return (
      <DashboardLayout>
        <Container size="lg">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Container>
      </DashboardLayout>
    );
  }

  // If not signed in, don't render anything (redirect will happen)
  // If admin viewing without sign-in, allow render
  if (!isSignedIn && !searchParams.get('adminToken')) return null;

  if (!affiliate) {
    return (
      <DashboardLayout>
        <Container size="lg">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Failed to load affiliate data</p>
            </CardContent>
          </Card>
        </Container>
      </DashboardLayout>
    );
  }

  // Show different content based on affiliate status
  if (affiliate.status === 'PENDING') {
    return (
      <DashboardLayout>
        <Container size="lg">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Affiliate Application</h1>
              <p className="text-muted-foreground">Your application is under review</p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Application Pending</h2>
                  <p className="text-muted-foreground mb-4">
                    Your affiliate application is currently under review. We'll notify you once it's been processed.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Application submitted: {new Date(affiliate.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </DashboardLayout>
    );
  }

  if (affiliate.status === 'REJECTED') {
    return (
      <DashboardLayout>
        <Container size="lg">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Affiliate Application</h1>
              <p className="text-muted-foreground">Your application was not approved</p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Application Rejected</h2>
                  <p className="text-muted-foreground mb-4">
                    {affiliate.rejectionReason || 'Your affiliate application was not approved at this time.'}
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/affiliate-program'}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Apply Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </DashboardLayout>
    );
  }

  if (affiliate.status === 'SUSPENDED') {
    return (
      <DashboardLayout>
        <Container size="lg">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Affiliate Account</h1>
              <p className="text-muted-foreground">Your account has been suspended</p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Account Suspended</h2>
                  <p className="text-muted-foreground mb-4">
                    {affiliate.rejectionReason || 'Your affiliate account has been suspended.'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please contact support if you believe this is an error.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </DashboardLayout>
    );
  }

  // Only show the full dashboard if status is APPROVED
  if (affiliate.status !== 'APPROVED') {
    return (
      <DashboardLayout>
        <Container size="lg">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Invalid affiliate status</p>
            </CardContent>
          </Card>
        </Container>
      </DashboardLayout>
    );
  }

  const standardLink = `${window.location.origin}/?ref=${affiliate.code}`;
  const customLink = affiliate.customSlug 
    ? `${window.location.origin}/${affiliate.customSlug}`
    : null;
  const pending = Number(affiliate.pendingEarnings);
  const total = Number(affiliate.totalEarnings);
  const canRequestEarly = pending >= EARLY_THRESHOLD && affiliate.payoutEmail;

  return (
    <DashboardLayout>
      <Container size="lg">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Affiliate Program</h1>
            <p className="text-muted-foreground">
              Earn 30% commission on every referral for life
            </p>
          </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Referrals</p>
                <p className="text-2xl font-bold">{affiliate.referralCount}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Earnings</p>
                <p className="text-2xl font-bold">${pending.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">${total.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Statistics</CardTitle>
          <CardDescription>
            Breakdown of your performance and earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Commission Summary */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Commission Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Commissions Earned:</span>
                  <span className="font-semibold">${Number(affiliate.totalCommissions || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Revenue Generated:</span>
                  <span className="font-semibold">${Number(affiliate.totalRevenue || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-gray-600">Commission Rate:</span>
                  <span className="font-semibold text-green-600">30%</span>
                </div>
              </div>
            </div>

            {/* Referral Breakdown by Plan */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Referrals by Plan</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pro Plan Referrals:</span>
                  <span className="font-semibold">{affiliate.proReferrals || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Business Plan Referrals:</span>
                  <span className="font-semibold">{affiliate.businessReferrals || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Agency Plan Referrals:</span>
                  <span className="font-semibold">{affiliate.agencyReferrals || 0}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-gray-600">Total Referrals:</span>
                  <span className="font-semibold">{affiliate.referralCount}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Links */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Links</CardTitle>
          <CardDescription>
            Share these links. Signups and purchases within {COOKIE_DAYS} days are credited to you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Custom Endpoint Link */}
          {customLink && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Link (Recommended)
              </label>
              <div className="flex gap-2">
                <Input
                  value={customLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(customLink);
                    toast.success('Custom link copied!');
                  }} 
                  variant="outline"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Clean, branded link: {customLink}
              </p>
            </div>
          )}
          
          {/* Standard Referral Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {affiliate.customSlug ? 'Standard Link (Backup)' : 'Your Referral Link'}
            </label>
            <div className="flex gap-2">
              <Input
                value={standardLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={copyLink} variant="outline">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {!affiliate.customSlug && (
              <p className="text-xs text-gray-500 mt-1">
                You can request a custom link during your application process
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Slug Management */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Referral Link</CardTitle>
          <CardDescription>
            Create a branded referral link like yoursite.com/aslmarketing instead of the standard link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Custom Slug
            </label>
            <div className="flex gap-2">
              <span className="text-sm text-gray-500 flex items-center">yoursite.com/</span>
              <Input
                type="text"
                value={customSlug}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  setCustomSlug(value);
                  setSlugAvailable(null); // Reset availability when typing
                }}
                placeholder="aslmarketing"
                className="flex-1"
              />
              <Button
                onClick={checkSlugAvailability}
                disabled={!customSlug.trim() || checkingSlug}
                loading={checkingSlug}
                variant="outline"
              >
                {checkingSlug ? 'Checking...' : 'Check'}
              </Button>
              <Button
                onClick={updateCustomSlug}
                disabled={!customSlug.trim() || customSlug === (affiliate?.customSlug || '') || slugAvailable === false}
                loading={updatingSlug}
              >
                {updatingSlug ? 'Updating...' : 'Update'}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Only letters, numbers, and hyphens allowed. 3-50 characters.
            </p>
            
            {/* Availability Status */}
            {customSlug && slugAvailable !== null && (
              <div className="flex items-center gap-2">
                {slugAvailable ? (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Available
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Not available
                  </div>
                )}
              </div>
            )}
            
            {customSlug && (
              <p className="text-xs text-blue-600">
                Your custom link: {window.location.origin}/{customSlug}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payout Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Settings</CardTitle>
          <CardDescription>
            Payouts are automatic on the 1st of each month for balances over ${MIN_PAYOUT}.
            Balances under the minimum roll forward.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Payout Email (PayPal)
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={payoutEmail}
                onChange={(e) => setPayoutEmail(e.target.value)}
                placeholder="your@email.com"
              />
              <Button
                onClick={updatePayoutEmail}
                disabled={updating || !payoutEmail}
                loading={updating}
              >
                {updating ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {canRequestEarly && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-3">
                You have ${pending.toFixed(2)} pending. Request an early payout (${EARLY_THRESHOLD}+ threshold).
              </p>
              <Button
                onClick={requestEarlyPayout}
                disabled={requesting}
                loading={requesting}
                variant="secondary"
              >
                {requesting ? 'Requesting...' : 'Request Early Payout'}
              </Button>
            </div>
          )}

          {!affiliate.payoutEmail && (
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
              ⚠️ Add your payout email to receive payments
            </p>
          )}
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <div>
            <p>• 30% commission on all payments</p>
            <p>• ${MIN_PAYOUT} minimum monthly payout</p>
            <p>• ${EARLY_THRESHOLD}+ for early payout requests</p>
            <p>• <a href="/affiliate-terms" className="underline text-primary hover:text-primary/80 inline-flex items-center gap-1">View terms <ExternalLink className="h-3 w-3" /></a></p>
          </div>
        </CardFooter>
      </Card>
        </div>
      </Container>
    </DashboardLayout>
  );
}
