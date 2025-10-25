'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  Zap, 
  Clock, 
  Shield, 
  CreditCard,
  Activity,
  TrendingUp,
  BarChart3,
  Edit,
  UserX,
  Key,
  RotateCcw
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'business' | 'agency';
  status: 'active' | 'suspended' | 'cancelled';
  loginCount: number;
  lastLoginAt: string;
  lifetimeGenerations: number;
  dailyGenCount: number;
  dailyRewriteCount: number;
  monthlyGenCount?: number;
  signUpDate: string;
  stripeCustomerId?: string;
  subscriptionStatus?: string;
  customQuota?: number;
}

interface UserAnalytics {
  user: any;
  activity: any;
  usage: any;
  trends: any;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const [user, setUser] = useState<AdminUser | null>(null);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [userResponse, analyticsResponse] = await Promise.all([
        fetch(`/api/adm1n796/users/${userId}`),
        fetch(`/api/adm1n796/analytics/users/${userId}`)
      ]);

      const userData = await userResponse.json();
      const analyticsData = await analyticsResponse.json();

      if (userData.success) {
        setUser(userData.data);
      } else {
        setError(userData.error || 'Failed to load user data');
      }

      if (analyticsData.success) {
        setAnalytics(analyticsData.data);
      } else {
        console.warn('Analytics data failed to load:', analyticsData.error);
        // Set empty analytics data structure to prevent errors
        setAnalytics({
          user: null,
          activity: { loginHistory: [] },
          usage: null,
          trends: null
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data');
      // Set empty analytics data structure to prevent errors
      setAnalytics({
        user: null,
        activity: { loginHistory: [] },
        usage: null,
        trends: null
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action: string, data?: any) => {
    setActionLoading(action);
    try {
      let endpoint = '';
      let method = 'POST';
      
      switch (action) {
        case 'suspend':
          endpoint = `/api/adm1n796/users/${userId}/suspend`;
          break;
        case 'unsuspend':
          endpoint = `/api/adm1n796/users/${userId}/suspend`;
          method = 'DELETE';
          break;
        case 'reset-password':
          endpoint = `/api/adm1n796/users/${userId}/reset-password`;
          break;
        case 'reset-quota':
          endpoint = `/api/adm1n796/users/${userId}/reset-quota`;
          break;
        case 'change-plan':
          endpoint = `/api/adm1n796/users/${userId}/plan`;
          method = 'PUT';
          break;
        default:
          return;
      }

      const response = await fetch(endpoint, { 
        method,
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchUserData(); // Refresh data
        alert('Action completed successfully');
      } else {
        alert(result.error || 'Action failed');
      }
    } catch (error) {
      alert('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'business': return 'bg-purple-100 text-purple-800';
      case 'agency': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <AdminAuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminAuthGuard>
    );
  }

  if (error || !user) {
    return (
      <AdminAuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'User not found'}</p>
            <Button onClick={() => router.push('/adm1n796/users')}>
              Back to Users
            </Button>
          </div>
        </div>
      </AdminAuthGuard>
    );
  }

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/adm1n796/users')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Users
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
                  <p className="text-gray-600">{user.name} ({user.email})</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPlanBadgeColor(user.plan)}`}>
                  {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                </span>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* User Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Sign Up Date</p>
                      <p className="font-medium text-gray-900">{formatDate(user.signUpDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Last Login</p>
                      <p className="font-medium text-gray-900">{formatRelativeTime(user.lastLoginAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage Statistics */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{user.lifetimeGenerations.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Total Generations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{user.dailyGenCount}</div>
                    <div className="text-sm text-gray-500">Today's Generations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{user.loginCount}</div>
                    <div className="text-sm text-gray-500">Total Logins</div>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              {analytics && analytics.activity && analytics.activity.loginHistory && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {analytics.activity.loginHistory.slice(-5).map((login: any, index: number) => (
                      <div key={index} className="flex items-center space-x-3 text-sm">
                        <Activity className="h-4 w-4 text-green-500" />
                        <span className="text-gray-500">Login</span>
                        <span className="text-gray-900">{formatRelativeTime(login.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show message if no activity data */}
              {analytics && (!analytics.activity || !analytics.activity.loginHistory) && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="text-center text-gray-500 py-8">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No activity data available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                      const newPlan = prompt('Enter new plan (free, pro, business, agency):');
                      if (newPlan && ['free', 'pro', 'business', 'agency'].includes(newPlan)) {
                        handleUserAction('change-plan', { plan: newPlan });
                      }
                    }}
                    disabled={actionLoading === 'change-plan'}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {actionLoading === 'change-plan' ? 'Updating...' : 'Change Plan'}
                  </Button>

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                      if (confirm('Are you sure you want to reset this user\'s quota?')) {
                        handleUserAction('reset-quota', { resetDaily: true, resetMonthly: true });
                      }
                    }}
                    disabled={actionLoading === 'reset-quota'}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {actionLoading === 'reset-quota' ? 'Resetting...' : 'Reset Quota'}
                  </Button>

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                      if (confirm('Send password reset email to this user?')) {
                        handleUserAction('reset-password');
                      }
                    }}
                    disabled={actionLoading === 'reset-password'}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {actionLoading === 'reset-password' ? 'Sending...' : 'Reset Password'}
                  </Button>

                  <Button
                    className="w-full"
                    variant={user.status === 'active' ? 'destructive' : 'outline'}
                    onClick={() => {
                      const action = user.status === 'active' ? 'suspend' : 'unsuspend';
                      const message = user.status === 'active' 
                        ? 'Are you sure you want to suspend this user?' 
                        : 'Are you sure you want to unsuspend this user?';
                      
                      if (confirm(message)) {
                        handleUserAction(action);
                      }
                    }}
                    disabled={actionLoading === 'suspend' || actionLoading === 'unsuspend'}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    {actionLoading === 'suspend' || actionLoading === 'unsuspend' 
                      ? 'Processing...' 
                      : user.status === 'active' ? 'Suspend User' : 'Unsuspend User'
                    }
                  </Button>
                </div>
              </div>

              {/* Account Details */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">User ID:</span>
                    <span className="font-mono text-xs text-gray-900">{user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Plan:</span>
                    <span className="font-medium text-gray-900">{user.plan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className="font-medium text-gray-900">{user.status}</span>
                  </div>
                  {user.stripeCustomerId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Stripe ID:</span>
                      <span className="font-mono text-xs text-gray-900">{user.stripeCustomerId}</span>
                    </div>
                  )}
                  {user.customQuota && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Custom Quota:</span>
                      <span className="font-medium text-gray-900">{user.customQuota}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AdminAuthGuard>
  );
}
