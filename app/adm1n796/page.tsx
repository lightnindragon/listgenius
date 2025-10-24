'use client';

import { useState, useEffect } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { StatsCard } from '@/components/admin/StatsCard';
import { Button } from '@/components/ui/Button';
import { 
  Users, 
  UserCheck, 
  Zap, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  XCircle,
  BarChart3,
  Settings
} from 'lucide-react';
import Link from 'next/link';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByPlan: {
    free: number;
    pro: number;
    business: number;
    agency: number;
  };
  cancelledSubscriptions: number;
  totalGenerationsThisMonth: number;
  averageGenerationsPerUser: number;
  revenueThisMonth: number;
  userGrowthData: Array<{ date: string; count: number }>;
  generationTrends: Array<{ date: string; count: number }>;
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/adm1n796/analytics/overview');
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      } else {
        setError(data.error || 'Failed to load analytics');
      }
    } catch (error) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/adm1n796/auth/logout', { method: 'POST' });
      window.location.href = '/adm1n796/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
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

  if (error) {
    return (
      <AdminAuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchAnalytics}>Retry</Button>
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
              <div>
                <h1 className="text-3xl font-bold text-gray-900">System Dashboard</h1>
                <p className="text-gray-600">Analytics and user management</p>
              </div>
              <div className="flex space-x-4">
                <Link href="/adm1n796/users">
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                </Link>
                <Link href="/adm1n796/environment-variables">
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Environment Variables
                  </Button>
                </Link>
                <Button onClick={handleLogout} variant="outline">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {analytics && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                  title="Total Users"
                  value={analytics.totalUsers.toLocaleString()}
                  icon={<Users className="h-6 w-6 text-blue-600" />}
                  trend="up"
                  change={12}
                />
                <StatsCard
                  title="Active Users"
                  value={analytics.activeUsers.toLocaleString()}
                  icon={<UserCheck className="h-6 w-6 text-green-600" />}
                  trend="up"
                  change={8}
                />
                <StatsCard
                  title="Generations This Month"
                  value={analytics.totalGenerationsThisMonth.toLocaleString()}
                  icon={<Zap className="h-6 w-6 text-yellow-600" />}
                  trend="up"
                  change={15}
                />
                <StatsCard
                  title="Revenue This Month"
                  value={`$${analytics.revenueThisMonth.toLocaleString()}`}
                  icon={<DollarSign className="h-6 w-6 text-green-600" />}
                  trend="up"
                  change={23}
                />
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                  title="New Users This Month"
                  value={analytics.newUsersThisMonth.toLocaleString()}
                  icon={<Calendar className="h-6 w-6 text-purple-600" />}
                  trend="up"
                  change={5}
                />
                <StatsCard
                  title="Cancelled Subscriptions"
                  value={analytics.cancelledSubscriptions.toLocaleString()}
                  icon={<XCircle className="h-6 w-6 text-red-600" />}
                  trend="down"
                  change={-2}
                />
                <StatsCard
                  title="Avg Generations/User"
                  value={analytics.averageGenerationsPerUser.toLocaleString()}
                  icon={<BarChart3 className="h-6 w-6 text-indigo-600" />}
                  trend="up"
                  change={7}
                />
                <StatsCard
                  title="Growth Rate"
                  value="12.5%"
                  icon={<TrendingUp className="h-6 w-6 text-emerald-600" />}
                  trend="up"
                  change={3}
                />
              </div>

              {/* Plan Distribution */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{analytics.usersByPlan.free}</div>
                    <div className="text-sm text-gray-500">Free</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{analytics.usersByPlan.pro}</div>
                    <div className="text-sm text-gray-500">Pro</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{analytics.usersByPlan.business}</div>
                    <div className="text-sm text-gray-500">Business</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">{analytics.usersByPlan.agency}</div>
                    <div className="text-sm text-gray-500">Agency</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Link href="/adm1n796/users">
                    <Button className="w-full" variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      View All Users
                    </Button>
                  </Link>
                  <Link href="/adm1n796/environment-variables">
                    <Button className="w-full" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Environment Variables
                    </Button>
                  </Link>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={fetchAnalytics}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Refresh Analytics
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => window.open('/api/adm1n796/users?export=csv', '_blank')}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </AdminAuthGuard>
  );
}
