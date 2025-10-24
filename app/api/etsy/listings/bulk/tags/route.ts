/**
 * Bulk Tag Operations API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { EtsyClient } from '@/lib/etsy';
import { getEtsyConnection } from '@/lib/clerk';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const bulkTagsSchema = z.object({
  listingIds: z.array(z.number()).min(1).max(50),
  operation: z.object({
    type: z.enum(['replace', 'add', 'remove']),
    searchTag: z.string().min(1).max(50),
    replaceTag: z.string().max(50).optional(),
    newTag: z.string().max(50).optional(),
  }),
});

// POST - Apply bulk tag operations
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const validation = bulkTagsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { listingIds, operation } = validation.data;

    // Get Etsy connection
    const etsyConnection = await getEtsyConnection(userId);
    if (!etsyConnection.hasTokens) {
      return NextResponse.json(
        { error: 'Etsy connection required' },
        { status: 400 }
      );
    }

    // Initialize Etsy client
    // TODO: Fix Etsy token handling
    // const etsyClient = new EtsyClient(
    //   etsyConnection.accessToken,
    //   etsyConnection.refreshToken
    // );
    const etsyClient = new EtsyClient('', ''); // Temporary fix

    // Apply bulk operations
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const listingId of listingIds) {
      try {
        // Get current listing data
        const listing = await etsyClient.getListing(listingId);
        const currentTags = listing.tags || [];
        
        let updatedTags = [...currentTags];
        let hasChanges = false;

        switch (operation.type) {
          case 'replace':
            if (operation.replaceTag) {
              const tagIndex = currentTags.findIndex(
                (tag: string) => tag.toLowerCase() === operation.searchTag.toLowerCase()
              );
              if (tagIndex !== -1) {
                updatedTags[tagIndex] = operation.replaceTag;
                hasChanges = true;
              }
            }
            break;

          case 'add':
            if (operation.newTag) {
              const tagExists = currentTags.some(
                (tag: string) => tag.toLowerCase() === operation.newTag!.toLowerCase()
              );
              if (!tagExists) {
                updatedTags.push(operation.newTag);
                hasChanges = true;
              }
            }
            break;

          case 'remove':
            const tagIndex = currentTags.findIndex(
              (tag: string) => tag.toLowerCase() === operation.searchTag.toLowerCase()
            );
            if (tagIndex !== -1) {
              updatedTags.splice(tagIndex, 1);
              hasChanges = true;
            }
            break;
        }

        // Update listing if there are changes
        if (hasChanges) {
          await etsyClient.updateListing(listingId, {
            tags: updatedTags,
          });

          results.push({
            listingId,
            success: true,
            changes: updatedTags.length - currentTags.length,
          });
          successCount++;
        } else {
          results.push({
            listingId,
            success: false,
            reason: 'No changes needed',
          });
        }

      } catch (error) {
        logger.error('Failed to update listing tags', { listingId, error });
        results.push({
          listingId,
          success: false,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
        failureCount++;
      }
    }

    logger.info('Bulk tag operations completed', {
      userId,
      listingCount: listingIds.length,
      operationType: operation.type,
      successCount,
      failureCount,
    });

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          totalListings: listingIds.length,
          updatedCount: successCount,
          failureCount,
          operation,
        },
      },
    });

  } catch (error) {
    logger.error('Bulk tag operations error', { error });
    return NextResponse.json(
      { error: 'Failed to apply bulk tag operations' },
      { status: 500 }
    );
  }
}
