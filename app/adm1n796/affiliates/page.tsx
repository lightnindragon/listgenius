'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from 'react-hot-toast';
import { Download, Trash2 } from 'lucide-react';

export default function AdminAffiliatesPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [earlyPayoutRequests, setEarlyPayoutRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showAdjustCommissionModal, setShowAdjustCommissionModal] = useState(false);
  const [showCreatePayoutModal, setShowCreatePayoutModal] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [payoutsRes, affiliatesRes, applicationsRes, earlyPayoutsRes] = await Promise.all([
        fetch('/api/admin/affiliate/payouts/list'),
        fetch('/api/admin/affiliate/list'),
        fetch('/api/admin/affiliate/applications'),
        fetch('/api/admin/affiliate/early-payout-requests'),
      ]);

      if (payoutsRes.ok) {
        const data = await payoutsRes.json();
        setPayouts(data.payouts || []);
      }

      if (affiliatesRes.ok) {
        const data = await affiliatesRes.json();
        setAffiliates(data.affiliates || []);
      }

      if (applicationsRes.ok) {
        const data = await applicationsRes.json();
        setApplications(data.applications || []);
      }

      if (earlyPayoutsRes.ok) {
        const data = await earlyPayoutsRes.json();
        setEarlyPayoutRequests(data.requests || []);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function markPaid(payoutId: string, method: string, reference: string) {
    setProcessingId(payoutId);
    try {
      const res = await fetch('/api/admin/affiliate/payouts/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, method, reference }),
      });

      if (res.ok) {
        toast.success('Payout marked as paid');
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to mark paid');
      }
    } catch (error) {
      toast.error('Failed to mark paid');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleApplication(affiliateId: string, action: 'approve' | 'reject' | 'suspend', reason?: string) {
    setProcessingId(affiliateId);
    try {
      const res = await fetch('/api/admin/affiliate/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateId, action, rejectionReason: reason }),
      });

      if (res.ok) {
        toast.success(`Application ${action}d successfully`);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || `Failed to ${action} application`);
      }
    } catch (error) {
      toast.error(`Failed to ${action} application`);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleManualPayout(affiliateId: string) {
    const affiliate = affiliates.find(aff => aff.id === affiliateId);
    if (!affiliate) return;

    const amount = Number(affiliate.pendingEarnings);
    if (amount <= 0) {
      toast.error('No pending earnings to payout');
      return;
    }

    const confirmed = confirm(`Create payout of $${amount.toFixed(2)} for ${affiliate.userName}?`);
    if (!confirmed) return;

    setProcessingId(affiliateId);
    try {
      const res = await fetch('/api/admin/affiliate/manual-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateId, amount }),
      });

      if (res.ok) {
        toast.success('Manual payout created successfully');
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create payout');
      }
    } catch (error) {
      toast.error('Failed to create payout');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleEarlyPayoutRequest(payoutId: string, action: 'approve' | 'reject') {
    setProcessingId(payoutId);
    try {
      const paypalTransactionId = action === 'approve' ? prompt('PayPal Transaction ID (optional):') : null;
      const notes = prompt('Notes (optional):');

      const res = await fetch('/api/admin/affiliate/approve-early-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          payoutId, 
          action, 
          paypalTransactionId,
          notes 
        }),
      });

      if (res.ok) {
        toast.success(`Early payout request ${action}d successfully`);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || `Failed to ${action} early payout request`);
      }
    } catch (error) {
      toast.error(`Failed to ${action} early payout request`);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleTriggerMonthlyPayouts() {
    const confirmed = confirm('Trigger monthly payouts for all eligible affiliates?');
    if (!confirmed) return;

    setProcessingId('monthly-payouts');
    try {
      const res = await fetch('/api/admin/affiliate/trigger-monthly-payouts', {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to trigger monthly payouts');
      }
    } catch (error) {
      toast.error('Failed to trigger monthly payouts');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDeleteAffiliate(affiliateId: string, affiliateName: string, affiliateCode: string) {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete affiliate "${affiliateName}" (${affiliateCode})?\n\n` +
      `This action cannot be undone and will:\n` +
      `- Remove the affiliate from the database\n` +
      `- Delete all affiliate data (referrals, payouts, clicks, etc.)\n` +
      `- Remove the user from Clerk\n` +
      `- Delete all associated records\n\n` +
      `Type "DELETE" to confirm:`
    );
    
    if (!confirmed) return;
    
    const confirmation = window.prompt('Type "DELETE" to confirm permanent deletion:');
    if (confirmation !== 'DELETE') {
      toast.error('Deletion cancelled. You must type "DELETE" exactly to confirm.');
      return;
    }
    
    setProcessingId(affiliateId);
    toast.loading(`🗑️ Deleting affiliate "${affiliateName}" (${affiliateCode})...`, { id: 'delete-affiliate' });
    
    try {
      const res = await fetch(`/api/admin/affiliate/${affiliateId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success(`✅ Affiliate "${affiliateName}" (${affiliateCode}) deleted permanently`, { id: 'delete-affiliate' });
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete affiliate', { id: 'delete-affiliate' });
      }
    } catch (error) {
      toast.error('Failed to delete affiliate', { id: 'delete-affiliate' });
    } finally {
      setProcessingId(null);
    }
  }

  function openAdjustCommissionModal(affiliate: any) {
    setSelectedAffiliate(affiliate);
    setShowAdjustCommissionModal(true);
  }

  function openCreatePayoutModal(affiliate: any) {
    setSelectedAffiliate(affiliate);
    setShowCreatePayoutModal(true);
  }

  function exportCSV() {
    const headers = ['Affiliate Code', 'User ID', 'Email', 'Amount', 'Currency', 'Created'];
    const rows = payouts.map(p => [
      p.affiliate.code,
      p.affiliate.userId,
      p.affiliate.payoutEmail || '',
      p.amount,
      p.currency,
      new Date(p.createdAt).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(r => r.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `affiliate-payouts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('CSV exported');
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Calculate analytics
  const totalAffiliates = affiliates.length;
  const approvedAffiliates = affiliates.filter(aff => aff.status === 'APPROVED').length;
  const pendingAffiliates = affiliates.filter(aff => aff.status === 'PENDING').length;
  const totalReferrals = affiliates.reduce((sum, aff) => sum + aff.referralCount, 0);
  const totalPendingEarnings = affiliates.reduce((sum, aff) => sum + Number(aff.pendingEarnings), 0);
  const totalPaidEarnings = affiliates.reduce((sum, aff) => sum + Number(aff.totalEarnings), 0);
  const totalCommissions = affiliates.reduce((sum, aff) => sum + Number(aff.totalCommissions || 0), 0);
  const totalRevenue = affiliates.reduce((sum, aff) => sum + Number(aff.totalRevenue || 0), 0);
  const netProfit = totalRevenue - totalCommissions;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Affiliate Admin</h1>
          <div className="flex gap-2">
            <Button 
              onClick={handleTriggerMonthlyPayouts}
              disabled={processingId === 'monthly-payouts'}
              variant="outline"
            >
              {processingId === 'monthly-payouts' ? 'Processing...' : 'Trigger Monthly Payouts'}
            </Button>
            {payouts.length > 0 && (
              <Button onClick={exportCSV} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Affiliates</p>
                <p className="text-2xl font-bold">{totalAffiliates}</p>
                <p className="text-xs text-gray-500">{approvedAffiliates} approved, {pendingAffiliates} pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold">{totalReferrals}</p>
                <p className="text-xs text-gray-500">Users brought to system</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500">From affiliate referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold text-green-600">${netProfit.toFixed(2)}</p>
                <p className="text-xs text-gray-500">After commissions (${totalCommissions.toFixed(2)})</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">${totalPendingEarnings.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Pending Payouts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">${totalPaidEarnings.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Total Paid Out</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">${(totalPendingEarnings + totalPaidEarnings).toFixed(2)}</p>
              <p className="text-sm text-gray-600">Total Commissions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Applications */}
      {applications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Applications ({applications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-lg">{app.userName || 'Unknown User'}</p>
                      <p className="text-sm text-gray-600">{app.userEmail || 'No email available'}</p>
                      <p className="text-sm text-gray-600">Code: {app.code}</p>
                      <p className="text-sm text-gray-600">
                        Applied: {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                      
                      {/* Comprehensive Application Data */}
                      <div className="mt-3 space-y-2">
                        {app.phoneNumber && (
                          <p className="text-sm text-gray-600">
                            <strong>Phone:</strong> {app.phoneNumber}
                          </p>
                        )}
                        {app.address && (
                          <p className="text-sm text-gray-600">
                            <strong>Address:</strong> {app.address}
                          </p>
                        )}
                        {app.advertisingPlans && (
                          <p className="text-sm text-gray-600">
                            <strong>Advertising Plans:</strong> {app.advertisingPlans}
                          </p>
                        )}
                        {app.website && (
                          <p className="text-sm text-gray-600">
                            <strong>Website:</strong> 
                            <a href={app.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1">
                              {app.website}
                            </a>
                          </p>
                        )}
                        {app.socialMedia && (
                          <p className="text-sm text-gray-600">
                            <strong>Social Media:</strong> {app.socialMedia}
                          </p>
                        )}
                        {app.applicationNote && (
                          <p className="text-sm text-gray-700 mt-2">
                            <strong>Additional Notes:</strong> {app.applicationNote}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApplication(app.id, 'approve')}
                        disabled={processingId === app.id}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const reason = prompt('Rejection reason (optional):');
                          if (reason !== null) {
                            handleApplication(app.id, 'reject', reason);
                          }
                        }}
                        disabled={processingId === app.id}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Early Payout Requests */}
      {earlyPayoutRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Early Payout Requests ({earlyPayoutRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {earlyPayoutRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{request.affiliate.userName || 'Unknown User'}</p>
                      <p className="text-sm text-gray-600">Code: {request.affiliate.code}</p>
                      <p className="text-sm text-gray-600">Email: {request.affiliate.payoutEmail}</p>
                      <p className="text-sm text-gray-600">
                        Requested: {new Date(request.requestedAt).toLocaleDateString()}
                      </p>
                      <p className="text-lg font-semibold text-green-600">
                        ${Number(request.amount).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEarlyPayoutRequest(request.id, 'approve')}
                        disabled={processingId === request.id}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Approve & Pay
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEarlyPayoutRequest(request.id, 'reject')}
                        disabled={processingId === request.id}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queued Payouts */}
      <Card>
        <CardHeader>
          <CardTitle>Queued Payouts ({payouts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No queued payouts</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="py-3 px-2">Code</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Amount</th>
                    <th className="py-3 px-2">Created</th>
                    <th className="py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <PayoutRow
                      key={payout.id}
                      payout={payout}
                      onMarkPaid={markPaid}
                      processing={processingId === payout.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Affiliates */}
      <Card>
        <CardHeader>
          <CardTitle>All Affiliates ({affiliates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="py-3 px-2">User</th>
                  <th className="py-3 px-2">Code</th>
                  <th className="py-3 px-2">Custom Slug</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Phone</th>
                  <th className="py-3 px-2">Referrals</th>
                  <th className="py-3 px-2">Pending</th>
                  <th className="py-3 px-2">Total Paid</th>
                  <th className="py-3 px-2">Last Login</th>
                  <th className="py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((aff) => (
                  <tr key={aff.id} className="border-b">
                    <td className="py-3 px-2">
                      <div>
                        <div className="font-medium">{aff.userName || 'Unknown User'}</div>
                        <div className="text-xs text-gray-500">{aff.userEmail || 'No email'}</div>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-mono text-xs">{aff.code}</td>
                    <td className="py-3 px-2">
                      {aff.customSlug ? (
                        <div>
                          <div className="font-mono text-xs text-blue-600">{aff.customSlug}</div>
                          <div className="text-xs text-gray-500">
                            {window.location.origin}/{aff.customSlug}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        aff.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        aff.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        aff.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {aff.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-xs text-gray-600">
                      {aff.phoneNumber || 'Not provided'}
                    </td>
                    <td className="py-3 px-2">{aff.referralCount}</td>
                    <td className="py-3 px-2">${Number(aff.pendingEarnings).toFixed(2)}</td>
                    <td className="py-3 px-2">${Number(aff.totalEarnings).toFixed(2)}</td>
                    <td className="py-3 px-2 text-xs text-gray-500">
                      {aff.lastLoginAt ? new Date(aff.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-1 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/adm1n796/affiliates/${aff.id}`, '_blank')}
                          className="text-xs px-2 py-1"
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/adm1n796/affiliate/${aff.id}/impersonate`, { method: 'POST' });
                              const data = await res.json();
                              if (data.success && data.url) {
                                window.location.href = data.url;
                              }
                            } catch {}
                          }}
                          className="text-xs px-2 py-1"
                        >
                          Login as
                        </Button>
                        {aff.status !== 'APPROVED' && (
                          <Button
                            size="sm"
                            onClick={() => handleApplication(aff.id, 'approve')}
                            disabled={processingId === aff.id}
                            className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            Approve
                          </Button>
                        )}
                        {aff.status !== 'SUSPENDED' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              const reason = prompt('Suspension reason (optional):');
                              if (reason !== null) {
                                handleApplication(aff.id, 'suspend', reason);
                              }
                            }}
                            disabled={processingId === aff.id}
                            className="text-xs px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            Suspend
                          </Button>
                        )}
                        {aff.status === 'APPROVED' && (
                          <>
                            {Number(aff.pendingEarnings) > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleManualPayout(aff.id)}
                                disabled={processingId === aff.id}
                                className="text-xs px-2 py-1 bg-green-50 text-green-700 border-green-200"
                              >
                                Pay
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openCreatePayoutModal(aff)}
                              className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200"
                            >
                              Create
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAdjustCommissionModal(aff)}
                              className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 border-yellow-200"
                            >
                              Adjust
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAffiliate(aff.id, aff.userName || 'Unknown User', aff.code)}
                          disabled={processingId === aff.id}
                          className="text-xs px-2 py-1 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Payout Modal */}
      {showCreatePayoutModal && selectedAffiliate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Payout for {selectedAffiliate.userName || 'Unknown User'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  id="payoutAmount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payout Email
                </label>
                <Input
                  type="email"
                  placeholder="payout@example.com"
                  defaultValue={selectedAffiliate.payoutEmail || selectedAffiliate.userEmail || ''}
                  id="payoutEmail"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <Textarea
                  placeholder="Additional notes..."
                  rows={3}
                  id="payoutNotes"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                onClick={async () => {
                  const amount = (document.getElementById('payoutAmount') as HTMLInputElement)?.value;
                  const email = (document.getElementById('payoutEmail') as HTMLInputElement)?.value;
                  const notes = (document.getElementById('payoutNotes') as HTMLTextAreaElement)?.value;
                  
                  if (!amount || !email) {
                    toast.error('Please fill in amount and email');
                    return;
                  }

                  try {
                    const res = await fetch('/api/admin/affiliate/manual-payout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        affiliateId: selectedAffiliate.id,
                        amount: parseFloat(amount),
                        payoutEmail: email,
                        notes: notes || undefined,
                      }),
                    });

                    if (res.ok) {
                      toast.success('Payout created successfully');
                      setShowCreatePayoutModal(false);
                      setSelectedAffiliate(null);
                      fetchData();
                    } else {
                      const data = await res.json();
                      toast.error(data.error || 'Failed to create payout');
                    }
                  } catch (error) {
                    toast.error('Failed to create payout');
                  }
                }}
                className="flex-1"
              >
                Create Payout
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreatePayoutModal(false);
                  setSelectedAffiliate(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Commission Modal */}
      {showAdjustCommissionModal && selectedAffiliate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Adjust Commission for {selectedAffiliate.userName || 'Unknown User'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adjustment Amount ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  id="adjustmentAmount"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Positive for credit, negative for debit
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <Textarea
                  placeholder="Reason for adjustment..."
                  rows={3}
                  id="adjustmentReason"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                onClick={async () => {
                  const amount = (document.getElementById('adjustmentAmount') as HTMLInputElement)?.value;
                  const reason = (document.getElementById('adjustmentReason') as HTMLTextAreaElement)?.value;
                  
                  if (!amount || !reason) {
                    toast.error('Please fill in amount and reason');
                    return;
                  }

                  try {
                    const res = await fetch('/api/admin/affiliate/adjust-commission', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        affiliateId: selectedAffiliate.id,
                        amount: parseFloat(amount),
                        reason: reason,
                      }),
                    });

                    if (res.ok) {
                      toast.success('Commission adjusted successfully');
                      setShowAdjustCommissionModal(false);
                      setSelectedAffiliate(null);
                      fetchData();
                    } else {
                      const data = await res.json();
                      toast.error(data.error || 'Failed to adjust commission');
                    }
                  } catch (error) {
                    toast.error('Failed to adjust commission');
                  }
                }}
                className="flex-1"
              >
                Adjust Commission
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAdjustCommissionModal(false);
                  setSelectedAffiliate(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
        </div>
      </AdminLayout>
    );
  }

function PayoutRow({ payout, onMarkPaid, processing }: any) {
  const [method, setMethod] = useState('paypal');
  const [reference, setReference] = useState('');

  return (
    <tr className="border-b">
      <td className="py-3 px-2 font-mono">{payout.affiliate.code}</td>
      <td className="py-3 px-2">{payout.affiliate.payoutEmail}</td>
      <td className="py-3 px-2 font-semibold">
        ${Number(payout.amount).toFixed(2)}
      </td>
      <td className="py-3 px-2 text-gray-600">
        {new Date(payout.createdAt).toLocaleDateString()}
      </td>
      <td className="py-3 px-2">
        <div className="flex gap-2 items-center">
          <Input
            placeholder="method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-24 text-xs"
          />
          <Input
            placeholder="reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-32 text-xs"
          />
          <Button
            size="sm"
            onClick={() => onMarkPaid(payout.id, method, reference)}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Mark Paid'}
          </Button>
        </div>
      </td>
    </tr>
  );
}
