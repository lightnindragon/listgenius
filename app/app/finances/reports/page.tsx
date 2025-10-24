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
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  FileText,
  Calculator,
  PieChart,
  LineChart,
  AlertCircle
} from 'lucide-react';
import { getBaseUrl } from '@/lib/utils';

interface FinancialData {
  revenue: {
    totalRevenue: number;
    byPlatform: Array<{
      platform: string;
      amount: number;
      percentage: number;
    }>;
    monthlyTrend: Array<{
      month: string;
      amount: number;
    }>;
  };
  expenses: {
    totalExpenses: number;
    categories: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
  profit: {
    grossProfit: number;
    netProfit: number;
    grossMargin: number;
    netMargin: number;
  };
  cashFlow: {
    operatingCashFlow: number;
    netCashFlow: number;
    monthlyCashFlow: Array<{
      month: string;
      inflow: number;
      outflow: number;
      net: number;
    }>;
  };
}

interface FinancialReport {
  id: string;
  reportType: string;
  period: {
    start: string;
    end: string;
  };
  generatedAt: string;
}

export default function FinancialReportsPage() {
  const { user, isLoaded } = useUser();
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [selectedReportType, setSelectedReportType] = useState('profit_loss');

  useEffect(() => {
    if (user && isLoaded) {
      fetchFinancialData();
      fetchReports();
    }
  }, [user, isLoaded, selectedPeriod]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period: selectedPeriod });
      const response = await fetch(`${getBaseUrl()}/api/finances/reports?${params}`);
      const result = await response.json();

      if (result.success) {
        setFinancialData(result.data);
        emitTopRightToast('Financial data loaded successfully', 'success');
      } else {
        emitTopRightToast(result.error || 'Failed to fetch financial data', 'error');
      }
    } catch (error) {
      emitTopRightToast('Failed to load financial data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/finances/reports/list`);
      const result = await response.json();

      if (result.success) {
        setReports(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  };

  const generateReport = async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/finances/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: selectedReportType,
          period: selectedPeriod
        })
      });

      const result = await response.json();
      if (result.success) {
        emitTopRightToast(`${selectedReportType} report generated successfully`, 'success');
        fetchReports();
        fetchFinancialData();
      } else {
        emitTopRightToast(result.error || 'Failed to generate report', 'error');
      }
    } catch (error) {
      emitTopRightToast('Failed to generate report', 'error');
    }
  };

  const exportReport = async (reportId: string) => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/finances/reports/${reportId}/export`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      emitTopRightToast('Report exported successfully', 'success');
    } catch (error) {
      emitTopRightToast('Failed to export report', 'error');
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'profit_loss': return <BarChart3 className="h-4 w-4" />;
      case 'cash_flow': return <LineChart className="h-4 w-4" />;
      case 'balance_sheet': return <FileText className="h-4 w-4" />;
      case 'tax_report': return <Calculator className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'profit_loss': return 'Profit & Loss';
      case 'cash_flow': return 'Cash Flow';
      case 'balance_sheet': return 'Balance Sheet';
      case 'tax_report': return 'Tax Report';
      default: return type;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (!isLoaded || loading) {
    return (
      <DashboardLayout>
        <Container className="py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">Loading financial reports...</span>
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
              <BarChart3 className="h-8 w-8 mr-3 text-green-600" />
              Financial Reports
            </h1>
            <p className="text-gray-600">
              Comprehensive financial reporting and analytics for your business
            </p>
          </div>

          {/* Report Generation Controls */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <select 
                  value={selectedPeriod} 
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="current_month">Current Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="current_quarter">Current Quarter</option>
                  <option value="last_quarter">Last Quarter</option>
                  <option value="current_year">Current Year</option>
                  <option value="last_year">Last Year</option>
                  <option value="custom">Custom Range</option>
                </select>

                <select 
                  value={selectedReportType} 
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  className="w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="profit_loss">Profit & Loss</option>
                  <option value="cash_flow">Cash Flow Statement</option>
                  <option value="balance_sheet">Balance Sheet</option>
                  <option value="tax_report">Tax Report</option>
                </select>

                <Button onClick={generateReport}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>

                <Button variant="outline" onClick={fetchFinancialData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Financial Overview */}
          {financialData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(financialData.revenue.totalRevenue)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(financialData.expenses.totalExpenses)}
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Net Profit</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(financialData.profit.netProfit)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Profit Margin</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatPercentage(financialData.profit.netMargin)}
                      </p>
                    </div>
                    <PieChart className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Revenue by Platform */}
          {financialData && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Revenue by Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialData.revenue.byPlatform.map((platform) => (
                    <div key={platform.platform} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-3">
                          {platform.platform}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {formatPercentage(platform.percentage)}
                        </span>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(platform.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expense Categories */}
          {financialData && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialData.expenses.categories.map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-3">
                          {category.category}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatPercentage(category.percentage)}
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

          {/* Cash Flow */}
          {financialData && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Cash Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Operating Cash Flow</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(financialData.cashFlow.operatingCashFlow)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Net Cash Flow</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(financialData.cashFlow.netCashFlow)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No reports generated yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Generate your first financial report to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.slice(0, 5).map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center">
                        {getReportTypeIcon(report.reportType)}
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">
                            {getReportTypeLabel(report.reportType)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(report.period.start).toLocaleDateString()} - {new Date(report.period.end).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {new Date(report.generatedAt).toLocaleDateString()}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => exportReport(report.id)}>
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
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
