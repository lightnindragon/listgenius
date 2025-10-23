import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') || 'all';
    const status = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'recent';

    // Mock data for now - replace with actual database queries
    const mockOrders = generateMockOrders(userId, platform, status);
    const stats = calculateOrderStats(mockOrders);

    return NextResponse.json({
      success: true,
      data: {
        orders: mockOrders,
        stats
      }
    });
  } catch (error: any) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create order (webhook handler)
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderData = await request.json();
    const { platform, orderId, items, customer, total } = orderData;

    // Store order in database
    const order = {
      id: `order_${Date.now()}`,
      platform,
      platformOrderId: orderId,
      customerName: customer.name,
      customerEmail: customer.email,
      status: 'pending',
      totalAmount: total,
      itemCount: items.length,
      items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // TODO: Save to database
    // await prisma.order.create({ data: order });

    // TODO: Update inventory
    // await inventorySyncEngine.handleOrderCreated(userId, platform, orderData);

    return NextResponse.json({
      success: true,
      data: order
    });
  } catch (error: any) {
    console.error('Failed to create order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

function generateMockOrders(userId: string, platform: string, status: string) {
  const platforms = ['etsy']; // Only Etsy platform
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const orders = [];

  for (let i = 1; i <= 20; i++) {
    const orderPlatform = 'etsy'; // Only Etsy orders
    const orderStatus = statuses[Math.floor(Math.random() * statuses.length)];

    // Filter by platform and status if specified
    if (platform !== 'all' && orderPlatform !== platform) continue;
    if (status !== 'all' && orderStatus !== status) continue;

    const order = {
      id: `order_${i}`,
      platform: orderPlatform,
      platformOrderId: `${orderPlatform.toUpperCase()}_${i}`,
      customerName: `Customer ${i}`,
      customerEmail: `customer${i}@example.com`,
      status: orderStatus,
      totalAmount: Math.floor(Math.random() * 200) + 20,
      itemCount: Math.floor(Math.random() * 3) + 1,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      items: [
        {
          sku: `SKU_${i}`,
          title: `Product ${i}`,
          quantity: Math.floor(Math.random() * 2) + 1,
          price: Math.floor(Math.random() * 50) + 10
        }
      ],
      shippingAddress: {
        name: `Customer ${i}`,
        address1: `${i} Main St`,
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        country: 'US'
      }
    };

    orders.push(order);
  }

  // Sort orders
  orders.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });

  return orders;
}

function calculateOrderStats(orders: any[]) {
  if (orders.length === 0) {
    return {
      total: 0,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0,
      avgOrderValue: 0
    };
  }

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const avgOrderValue = totalRevenue / orders.length;

  return {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalRevenue,
    avgOrderValue
  };
}
