/**
 * Bulk Tag Operations Preview API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { EtsyClient } from '@/lib/etsy';
import { getEtsyConnection } from '@/lib/clerk';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const previewSchema = z.object({
  listingIds: z.array(z.number()).min(1).max(50),
  operation: z.object({
    type: z.enum(['replace', 'add', 'remove']),
    searchTag: z.string().min(1).max(50),
    replaceTag: z.string().max(50).optional(),
    newTag: z.string().max(50).optional(),
  }),
});

// POST - Preview bulk tag operations
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const validation = previewSchema.safeParse(body);
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

    // Get listings data
    const previewResults = [];
    
    for (const listingId of listingIds) {
      try {
        const listing = await etsyClient.getListing(listingId);
        const currentTags = listing.tags || [];
        
        let updatedTags = [...currentTags];
        let changes = [];

        switch (operation.type) {
          case 'replace':
            if (operation.replaceTag) {
              const tagIndex = currentTags.findIndex(
                (tag: string) => tag.toLowerCase() === operation.searchTag.toLowerCase()
              );
              if (tagIndex !== -1) {
                updatedTags[tagIndex] = operation.replaceTag;
                changes.push(`Replaced "${operation.searchTag}" with "${operation.replaceTag}"`);
              } else {
                changes.push(`Tag "${operation.searchTag}" not found`);
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
                changes.push(`Added "${operation.newTag}"`);
              } else {
                changes.push(`Tag "${operation.newTag}" already exists`);
              }
            }
            break;

          case 'remove':
            const tagIndex = currentTags.findIndex(
              (tag: string) => tag.toLowerCase() === operation.searchTag.toLowerCase()
            );
            if (tagIndex !== -1) {
              updatedTags.splice(tagIndex, 1);
              changes.push(`Removed "${operation.searchTag}"`);
            } else {
              changes.push(`Tag "${operation.searchTag}" not found`);
            }
            break;
        }

        previewResults.push({
          listingId,
          title: listing.title,
          currentTags,
          updatedTags,
          changes,
          hasChanges: changes.length > 0 && !changes[0].includes('not found') && !changes[0].includes('already exists'),
        });

      } catch (error) {
        logger.warn('Failed to get listing for preview', { listingId, error });
        previewResults.push({
          listingId,
          title: `Listing #${listingId}`,
          currentTags: [],
          updatedTags: [],
          changes: ['Failed to load listing data'],
          hasChanges: false,
        });
      }
    }

    logger.info('Bulk tag preview completed', {
      userId,
      listingCount: listingIds.length,
      operationType: operation.type,
      changesCount: previewResults.filter(r => r.hasChanges).length,
    });

    return NextResponse.json({
      success: true,
      data: {
        preview: previewResults,
        operation,
        summary: {
          totalListings: listingIds.length,
          listingsWithChanges: previewResults.filter(r => r.hasChanges).length,
          listingsWithoutChanges: previewResults.filter(r => !r.hasChanges).length,
        },
      },
    });

  } catch (error) {
    logger.error('Bulk tag preview error', { error });
    return NextResponse.json(
      { error: 'Failed to preview bulk tag operations' },
      { status: 500 }
    );
  }
}
