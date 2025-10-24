import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();
    const { id: orderId } = await params;

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update order status in database
    // TODO: Implement actual database update
    // await prisma.order.update({
    //   where: { id: orderId, userId },
    //   data: { status, updatedAt: new Date() }
    // });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Order status updated successfully',
        orderId,
        newStatus: status
      }
    });
  } catch (error: any) {
    console.error('Failed to update order status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}
