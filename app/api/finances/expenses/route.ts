import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock expense data - would query from database
    const mockExpenses = generateMockExpenses(userId);

    return NextResponse.json({
      success: true,
      data: {
        expenses: mockExpenses
      }
    });
  } catch (error: any) {
    console.error('Failed to fetch expenses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

function generateMockExpenses(userId: string) {
  const categories = [
    { id: 'cat_office_supplies', name: 'Office Supplies', color: '#10B981' },
    { id: 'cat_travel', name: 'Travel', color: '#3B82F6' },
    { id: 'cat_meals', name: 'Meals', color: '#F59E0B' },
    { id: 'cat_marketing', name: 'Marketing', color: '#EF4444' },
    { id: 'cat_software', name: 'Software', color: '#8B5CF6' }
  ];

  const paymentMethods = [
    { name: 'Business Credit Card', type: 'credit_card' },
    { name: 'Business Debit Card', type: 'debit_card' },
    { name: 'Cash', type: 'cash' },
    { name: 'PayPal', type: 'paypal' }
  ];

  const vendors = [
    'Amazon Business', 'Office Depot', 'Uber', 'Starbucks', 'Google Ads',
    'Facebook Ads', 'Adobe', 'Canva', 'Mailchimp', 'Shopify'
  ];

  const statuses = ['pending', 'approved', 'rejected'];
  const descriptions = [
    'Office supplies for Q1', 'Business lunch with client', 'Marketing campaign materials',
    'Software subscription renewal', 'Travel to conference', 'Online advertising',
    'Professional development course', 'Equipment maintenance', 'Business phone bill'
  ];

  const expenses = [];

  for (let i = 1; i <= 25; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const vendor = vendors[Math.floor(Math.random() * vendors.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];

    const expense = {
      id: `expense_${i}`,
      date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      amount: Math.floor(Math.random() * 500) + 10,
      currency: 'USD',
      description,
      category,
      vendor,
      paymentMethod,
      tags: ['business', 'q1'],
      isBusiness: true,
      isReimbursable: Math.random() > 0.2,
      status,
      receiptUrl: Math.random() > 0.5 ? `receipts/expense_${i}.pdf` : undefined
    };

    expenses.push(expense);
  }

  return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
