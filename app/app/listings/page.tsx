'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { TopRightToast, emitTopRightToast } from '@/components/TopRightToast';
import { DashboardLayout } from '@/components/DashboardLayout';
import { RewriteModal } from '@/components/RewriteModal';
import { Link, RefreshCw, Edit, Plus, ExternalLink, Eye, DollarSign, Calendar } from 'lucide-react';
import { getBaseUrl } from '@/lib/utils';

interface EtsyListing {
  listing_id: number;
  title: string;
  description: string;
  price: {
    amount: number;
    currency_code: string;
  };
  url: string;
  views: number;
  num_favorers: number;
  state: string;
  creation_tsz: number;
  last_modified_tsz: number;
  tags: string[];
  materials: string[];
  images: Array<{
    url_570xN: string;
    url_fullxfull: string;
  }>;
}

interface EtsyConnection {
  connected: boolean;
  shopName?: string;
  shopId?: number;
  isSandbox?: boolean;
}

export default function ListingsPage() {
  const { user, isLoaded } = useUser();
  const [listings, setListings] = useState<EtsyListing[]>([]);
  const [etsyConnection, setEtsyConnection] = useState<EtsyConnection>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rewriteModalOpen, setRewriteModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<EtsyListing | null>(null);

  // Load Etsy connection status
  useEffect(() => {
    if (user && isLoaded) {
      loadEtsyConnection();
    }
  }, [user, isLoaded]);

  // Load listings when connected
  useEffect(() => {
    if (etsyConnection.connected) {
      loadListings();
    } else {
      setLoading(false);
    }
  }, [etsyConnection.connected]);

  const loadEtsyConnection = async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/etsy/me`);
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.success) {
        setEtsyConnection({
          connected: data.connected,
          shopName: data.shopName,
          shopId: data.shopId,
          isSandbox: data.isSandbox
        });
      }
    } catch (error) {
      console.error('Error loading Etsy connection:', error);
    }
  };

  const loadListings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getBaseUrl()}/api/etsy/listings`);
      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }
      
      const data = await response.json();
      if (data.success) {
        setListings(data.data.results || []);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
      emitTopRightToast('Failed to load listings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadListings();
    setRefreshing(false);
  };

  const handleRewriteClick = (listing: EtsyListing) => {
    setSelectedListing(listing);
    setRewriteModalOpen(true);
  };

  const handleRewriteModalClose = () => {
    setRewriteModalOpen(false);
    setSelectedListing(null);
  };

  const handleListingUpdated = () => {
    // Refresh listings when a listing is updated
    loadListings();
    emitTopRightToast('Listing updated successfully!', 'success');
  };

  const handleConnectEtsy = async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/etsy/oauth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          window.location.href = data.authUrl;
        }
      }
    } catch (error) {
      emitTopRightToast('Failed to initiate Etsy connection', 'error');
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <Container className="py-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Sign in required
          </h1>
          <p className="text-gray-600 mb-6">
            Please sign in to view your Etsy listings.
          </p>
          <a
            href="/sign-in"
            className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            Sign In
          </a>
        </div>
      </Container>
    );
  }

  if (!etsyConnection.connected) {
    return (
      <Container className="py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Etsy Listings</h1>
            <p className="text-gray-600">
              Connect your Etsy shop to view and manage your listings.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <EmptyState
              icon={<ExternalLink className="h-16 w-16 text-gray-400" />}
              title="Connect to Etsy"
              description="Connect your Etsy shop to view and manage your listings, or publish new content directly to your shop."
              action={
                <Button onClick={handleConnectEtsy} className="mt-4">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect Etsy Shop
                </Button>
              }
            />
          </div>
        </div>
        <TopRightToast />
      </Container>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Etsy Listings</h1>
            <p className="text-gray-600">
              {etsyConnection.isSandbox && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-2">
                  SANDBOX
                </span>
              )}
              Managing listings for <strong>{etsyConnection.shopName}</strong>
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button asChild>
              <Link href="/app">
                <Plus className="h-4 w-4 mr-2" />
                Create New Listing
              </Link>
            </Button>
          </div>
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {loading ? (
            <div className="p-8">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : listings.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<Plus className="h-16 w-16 text-gray-400" />}
                title="No listings found"
                description="You don't have any listings in your Etsy shop yet."
                action={
                  <Button asChild>
                    <Link href="/app">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Listing
                    </Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Listing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {listings.map((listing) => (
                    <tr key={listing.listing_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {listing.images?.[0] ? (
                              <img
                                className="h-12 w-12 rounded-lg object-cover"
                                src={listing.images[0].url_570xN}
                                alt={listing.title}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                <Plus className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                              {listing.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {listing.num_favorers} favorites
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(listing.price.amount, listing.price.currency_code)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 text-gray-400 mr-1" />
                          {listing.views.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(listing.state)}`}>
                          {listing.state.charAt(0).toUpperCase() + listing.state.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                          {formatDate(listing.creation_tsz)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRewriteClick(listing)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Rewrite
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a
                            href={listing.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </a>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <TopRightToast />
      
      {/* Rewrite Modal */}
      <RewriteModal
        isOpen={rewriteModalOpen}
        onClose={handleRewriteModalClose}
        listing={selectedListing}
        onListingUpdated={handleListingUpdated}
      />
    </DashboardLayout>
  );
}
