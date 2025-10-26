'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, User, Mail, DollarSign, Calendar, MapPin, Activity, Trash2 } from 'lucide-react';

export default function AffiliateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const affiliateId = params.id as string;
  
  const [affiliate, setAffiliate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    userName: '',
    userEmail: '',
    payoutEmail: '',
    customSlug: '',
    status: 'APPROVED',
    applicationNote: '',
    rejectionReason: '',
  });

  useEffect(() => {
    if (affiliateId) {
      fetchAffiliateDetails();
    }
  }, [affiliateId]);

  async function fetchAffiliateDetails() {
    try {
      const [affiliateRes, loginLogsRes] = await Promise.all([
        fetch(`/api/admin/affiliate/${affiliateId}`),
        fetch(`/api/admin/affiliate/${affiliateId}/login-logs`)
      ]);

      if (affiliateRes.ok) {
        const data = await affiliateRes.json();
        setAffiliate(data.affiliate);
        setFormData({
          userName: data.affiliate.userName || '',
          userEmail: data.affiliate.userEmail || '',
          payoutEmail: data.affiliate.payoutEmail || '',
          customSlug: data.affiliate.customSlug || '',
          status: data.affiliate.status,
          applicationNote: data.affiliate.applicationNote || '',
          rejectionReason: data.affiliate.rejectionReason || '',
        });
      }

      if (loginLogsRes.ok) {
        const data = await loginLogsRes.json();
        setLoginLogs(data.loginLogs || []);
      }
    } catch (error) {
      toast.error('Failed to load affiliate details');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/affiliate/${affiliateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Affiliate updated successfully');
        fetchAffiliateDetails();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update affiliate');
      }
    } catch (error) {
      toast.error('Failed to update affiliate');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    const confirmed = confirm(`Are you sure you want to change status to ${newStatus}?`);
    if (!confirmed) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/affiliate/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          affiliateId, 
          action: newStatus.toLowerCase(),
          rejectionReason: newStatus === 'REJECTED' ? formData.rejectionReason : undefined
        }),
      });

      if (res.ok) {
        toast.success(`Status changed to ${newStatus}`);
        fetchAffiliateDetails();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAffiliate() {
    if (!affiliate) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete affiliate "${affiliate.userName || 'Unknown User'}" (${affiliate.code})?\n\n` +
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
    
    setDeleting(true);
    toast.loading(`🗑️ Deleting affiliate "${affiliate.userName || 'Unknown User'}" (${affiliate.code})...`, { id: 'delete-affiliate' });
    
    try {
      const res = await fetch(`/api/admin/affiliate/${affiliateId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success(`✅ Affiliate "${affiliate.userName || 'Unknown User'}" (${affiliate.code}) deleted permanently`, { id: 'delete-affiliate' });
        router.push('/adm1n796/affiliates');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete affiliate', { id: 'delete-affiliate' });
      }
    } catch (error) {
      toast.error('Failed to delete affiliate', { id: 'delete-affiliate' });
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!affiliate) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <p className="text-gray-500">Affiliate not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => router.back()} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{affiliate.userName || 'Unknown User'}</h1>
              <p className="text-gray-600">Affiliate Code: {affiliate.code}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              onClick={handleDeleteAffiliate} 
              disabled={deleting}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete Affiliate'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    <Input
                      value={formData.userName}
                      onChange={(e) => setFormData({...formData, userName: e.target.value})}
                      placeholder="User's display name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={formData.userEmail}
                      onChange={(e) => setFormData({...formData, userEmail: e.target.value})}
                      placeholder="user@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payout Email
                  </label>
                  <Input
                    type="email"
                    value={formData.payoutEmail}
                    onChange={(e) => setFormData({...formData, payoutEmail: e.target.value})}
                    placeholder="payout@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Slug
                  </label>
                  <div className="flex gap-2">
                    <span className="text-sm text-gray-500 flex items-center">yoursite.com/</span>
                    <Input
                      type="text"
                      value={formData.customSlug}
                      onChange={(e) => setFormData({...formData, customSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                      placeholder="aslmarketing"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Custom referral link (letters, numbers, and hyphens only). Leave empty to use standard referral link.
                  </p>
                  {formData.customSlug && (
                    <p className="text-xs text-blue-600 mt-1">
                      Preview: {window.location.origin}/{formData.customSlug}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                    <Button
                      onClick={() => handleStatusChange(formData.status)}
                      disabled={saving}
                      variant="outline"
                    >
                      Update Status
                    </Button>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {formData.status !== 'APPROVED' && (
                    <Button
                      onClick={() => handleStatusChange('APPROVED')}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Approve Affiliate
                    </Button>
                  )}
                  {formData.status !== 'REJECTED' && (
                    <Button
                      onClick={() => {
                        const reason = prompt('Rejection reason (optional):');
                        if (reason !== null) {
                          setFormData({...formData, rejectionReason: reason});
                          handleStatusChange('REJECTED');
                        }
                      }}
                      disabled={saving}
                      variant="destructive"
                    >
                      Reject Affiliate
                    </Button>
                  )}
                  {formData.status !== 'SUSPENDED' && (
                    <Button
                      onClick={() => {
                        const reason = prompt('Suspension reason (optional):');
                        if (reason !== null) {
                          setFormData({...formData, rejectionReason: reason});
                          handleStatusChange('SUSPENDED');
                        }
                      }}
                      disabled={saving}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Suspend Affiliate
                    </Button>
                  )}
                  {formData.status !== 'PENDING' && (
                    <Button
                      onClick={() => handleStatusChange('PENDING')}
                      disabled={saving}
                      variant="outline"
                    >
                      Move to Pending
                    </Button>
                  )}
                </div>

                {formData.status === 'REJECTED' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rejection Reason
                    </label>
                    <Textarea
                      value={formData.rejectionReason}
                      onChange={(e) => setFormData({...formData, rejectionReason: e.target.value})}
                      placeholder="Reason for rejection..."
                      rows={3}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Application Details */}
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Application Note
                    </label>
                    <Textarea
                      value={formData.applicationNote}
                      onChange={(e) => setFormData({...formData, applicationNote: e.target.value})}
                      placeholder="Why they want to join..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Applied:</span> {new Date(affiliate.createdAt).toLocaleDateString()}
                    </div>
                    {affiliate.approvedAt && (
                      <div>
                        <span className="font-medium">Approved:</span> {new Date(affiliate.approvedAt).toLocaleDateString()}
                      </div>
                    )}
                    {affiliate.approvedBy && (
                      <div>
                        <span className="font-medium">Approved By:</span> {affiliate.approvedBy}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comprehensive Application Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Application Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <Input
                      value={affiliate?.firstName || 'Not provided'}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <Input
                      value={affiliate?.lastName || 'Not provided'}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <Input
                    value={affiliate?.phoneNumber || 'Not provided'}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <Textarea
                    value={affiliate?.address || 'Not provided'}
                    readOnly
                    rows={3}
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Advertising Plans
                  </label>
                  <Textarea
                    value={affiliate?.advertisingPlans || 'Not provided'}
                    readOnly
                    rows={3}
                    className="bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={affiliate?.website || 'Not provided'}
                        readOnly
                        className="bg-gray-50 flex-1"
                      />
                      {affiliate?.website && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(affiliate.website, '_blank')}
                        >
                          Visit
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Social Media
                    </label>
                    <Input
                      value={affiliate?.socialMedia || 'Not provided'}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terms Accepted
                  </label>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${affiliate?.termsAccepted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-600">
                      {affiliate?.termsAccepted ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Referrals:</span>
                  <span className="font-semibold">{affiliate.referralCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending Earnings:</span>
                  <span className="font-semibold text-yellow-600">${Number(affiliate.pendingEarnings).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Paid:</span>
                  <span className="font-semibold text-green-600">${Number(affiliate.totalEarnings).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Revenue:</span>
                  <span className="font-semibold">${Number(affiliate.totalRevenue || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Net Profit:</span>
                  <span className="font-semibold text-blue-600">${(Number(affiliate.totalRevenue || 0) - Number(affiliate.totalCommissions || 0)).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Login:</span>
                  <span className="text-sm">
                    {affiliate.lastLoginAt ? new Date(affiliate.lastLoginAt).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Login Count:</span>
                  <span className="font-semibold">{affiliate.loginCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Activity:</span>
                  <span className="text-sm">
                    {affiliate.lastActivityAt ? new Date(affiliate.lastActivityAt).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Login Logs */}
            {loginLogs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Recent Logins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {loginLogs.slice(0, 10).map((log: any) => (
                      <div key={log.id} className="text-xs border-b pb-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{log.ipAddress}</span>
                          <span className="text-gray-500">{new Date(log.loginAt).toLocaleDateString()}</span>
                        </div>
                        {log.userAgent && (
                          <div className="text-gray-500 truncate mt-1">
                            {log.userAgent}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
