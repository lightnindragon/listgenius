import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock analytics data - would calculate from actual expense data
    const mockAnalytics = generateMockAnalytics();

    return NextResponse.json({
      success: true,
      data: mockAnalytics
    });
  } catch (error: any) {
    console.error('Failed to fetch expense analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

function generateMockAnalytics() {
  const totalExpenses = Math.floor(Math.random() * 5000) + 2000; // $2k-$7k

  const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' });
    const baseAmount = totalExpenses / 12;
    const variation = (Math.random() - 0.5) * 0.4; // ±20% variation
    return {
      month,
      amount: Math.round(baseAmount * (1 + variation))
    };
  });

  const categories = [
    'Office Supplies', 'Travel', 'Meals', 'Marketing', 'Software', 'Equipment', 'Utilities'
  ];

  const categoryBreakdown = categories.map(category => {
    const amount = Math.floor(Math.random() * totalExpenses * 0.3);
    return {
      category,
      amount,
      percentage: (amount / totalExpenses) * 100
    };
  }).sort((a, b) => b.amount - a.amount);

  const vendors = [
    'Amazon Business', 'Office Depot', 'Uber', 'Starbucks', 'Google Ads',
    'Facebook Ads', 'Adobe', 'Canva', 'Mailchimp', 'Shopify'
  ];

  const topVendors = vendors.slice(0, 5).map(vendor => ({
    vendor,
    amount: Math.floor(Math.random() * 800) + 100,
    count: Math.floor(Math.random() * 10) + 1
  })).sort((a, b) => b.amount - a.amount);

  const taxDeductibleAmount = totalExpenses * 0.8; // 80% tax deductible

  return {
    totalExpenses,
    monthlyTrend,
    categoryBreakdown,
    topVendors,
    taxDeductible: {
      total: taxDeductibleAmount,
      percentage: 80
    }
  };
}
