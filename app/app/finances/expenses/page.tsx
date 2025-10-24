'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { emitTopRightToast } from '@/components/TopRightToast';
import { 
  Receipt,
  Plus,
  Upload,
  Search,
  Filter,
  Calendar,
  DollarSign,
  PieChart,
  TrendingUp,
  FileText,
  CreditCard,
  RefreshCw,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { getBaseUrl } from '@/lib/utils';

interface Expense {
  id: string;
  date: string;
  amount: number;
  currency: string;
  description: string;
  category: {
    id: string;
    name: string;
    color: string;
  };
  vendor: string;
  paymentMethod: {
    name: string;
    type: string;
  };
  tags: string[];
  isBusiness: boolean;
  isReimbursable: boolean;
  status: 'pending' | 'approved' | 'rejected';
  receiptUrl?: string;
}

interface ExpenseAnalytics {
  totalExpenses: number;
  monthlyTrend: Array<{
    month: string;
    amount: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  topVendors: Array<{
    vendor: string;
    amount: number;
    count: number;
  }>;
  taxDeductible: {
    total: number;
    percentage: number;
  };
}

export default function ExpensesPage() {
  const { user, isLoaded } = useUser();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [analytics, setAnalytics] = useState<ExpenseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    if (user && isLoaded) {
      fetchExpenses();
      fetchAnalytics();
    }
  }, [user, isLoaded]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/finances/expenses`);
      const result = await response.json();

      if (result.success) {
        setExpenses(result.data.expenses);
        emitTopRightToast('Expenses loaded successfully', 'success');
      } else {
        emitTopRightToast(result.error || 'Failed to fetch expenses', 'error');
      }
    } catch (error) {
      emitTopRightToast('Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/finances/expenses/analytics`);
      const result = await response.json();

      if (result.success) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const uploadReceipt = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const response = await fetch(`${getBaseUrl()}/api/finances/expenses/receipt`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        emitTopRightToast('Receipt processed successfully', 'success');
        fetchExpenses();
      } else {
        emitTopRightToast(result.error || 'Failed to process receipt', 'error');
      }
    } catch (error) {
      emitTopRightToast('Failed to upload receipt', 'error');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadReceipt(file);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'credit_card': return <CreditCard className="h-4 w-4" />;
      case 'cash': return <DollarSign className="h-4 w-4" />;
      case 'bank_transfer': return <FileText className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || expense.category.id === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || expense.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (!isLoaded || loading) {
    return (
      <DashboardLayout>
        <Container className="py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">Loading expenses...</span>
          </div>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container className="py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Receipt className="h-8 w-8 mr-3 text-blue-600" />
              Expense Tracking
            </h1>
            <p className="text-gray-600">
              Track and manage your business expenses with receipt processing and categorization
            </p>
          </div>

          {/* Analytics Overview */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(analytics.totalExpenses)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Tax Deductible</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(analytics.taxDeductible.total)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {analytics.taxDeductible.percentage.toFixed(1)}% of total
                      </p>
                    </div>
                    <PieChart className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Categories</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {analytics.categoryBreakdown.length}
                      </p>
                    </div>
                    <PieChart className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Top Vendor</p>
                      <p className="text-lg font-bold text-purple-600">
                        {analytics.topVendors[0]?.vendor || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(analytics.topVendors[0]?.amount || 0)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Category Breakdown */}
          {analytics && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.categoryBreakdown.map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3" 
                          style={{ backgroundColor: '#3B82F6' }}
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {category.category}
                        </span>
                        <span className="text-sm text-gray-600 ml-2">
                          {category.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(category.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {analytics?.categoryBreakdown.map((category) => (
                <option key={category.category} value={category.category.toLowerCase().replace(' ', '_')}>
                  {category.category}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>

            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Receipt
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </Button>

            <Button variant="outline" onClick={fetchExpenses}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Expenses List */}
          <Card>
            <CardHeader>
              <CardTitle>Expenses ({filteredExpenses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No expenses found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Add your first expense or upload a receipt to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-4" 
                          style={{ backgroundColor: expense.category.color }}
                        />
                        <div>
                          <p className="font-medium text-gray-900">{expense.description}</p>
                          <p className="text-sm text-gray-600">
                            {expense.vendor} • {formatDate(expense.date)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatCurrency(expense.amount, expense.currency)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {expense.category.name}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(expense.paymentMethod.type)}
                          <Badge className={getStatusColor(expense.status)}>
                            {expense.status}
                          </Badge>
                        </div>

                        <div className="flex gap-2">
                          {expense.receiptUrl && (
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Container>
    </DashboardLayout>
  );
}
