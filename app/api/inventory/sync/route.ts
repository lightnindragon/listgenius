import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { inventorySyncEngine } from '@/lib/inventory-sync';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId, syncAll } = await request.json();

    if (syncAll) {
      // Sync all items
      const result = await inventorySyncEngine.syncAllItems(userId);
      return NextResponse.json({
        success: true,
        data: {
          message: 'Sync initiated for all items',
          ...result
        }
      });
    } else if (itemId) {
      // Sync specific item
      const operation = await inventorySyncEngine.syncItem(userId, itemId);
      return NextResponse.json({
        success: true,
        data: {
          message: 'Item synced successfully',
          operation
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Either itemId or syncAll must be provided' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Inventory sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync inventory' },
      { status: 500 }
    );
  }
}

// GET /api/inventory/sync - Get sync status
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    // Get sync status for item or all items
    // Implementation would query database for sync operations
    const status = {
      isSyncing: false,
      lastSyncAt: new Date().toISOString(),
      syncErrors: []
    };

    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    console.error('Failed to get sync status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
