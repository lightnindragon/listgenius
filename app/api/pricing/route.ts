import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const pricing = {
      pro: {
        price: parseFloat(process.env.PRO_PRICE_USD || '29'),
        currency: 'USD',
        period: 'month'
      },
      business: {
        price: parseFloat(process.env.BUSINESS_PRICE_USD || '79'),
        currency: 'USD',
        period: 'month'
      }
    };

    return NextResponse.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}
