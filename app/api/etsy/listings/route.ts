import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { EtsyClient } from '@/lib/etsy';
import { getEtsyConnection } from '@/lib/clerk';
import { logger } from '@/lib/logger';
import { mockListings, mockShopData } from '@/lib/mock-etsy-data';

// GET - Fetch listings
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '25');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const etsyConnection = await getEtsyConnection(userId);
    const isMockMode = process.env.ETSY_MOCK_MODE === "true";

    if (!etsyConnection.hasTokens && !isMockMode) {
      return NextResponse.json(
        { success: false, error: 'Etsy not connected' },
        { status: 400 }
      );
    }

    const etsyClient = new EtsyClient();
    const isSandbox = etsyClient.getSandboxMode();

    try {
      let listings;
      if (isMockMode) {
        listings = {
          results: mockListings.slice(offset, offset + limit),
          count: mockListings.length,
          params: { limit, offset, shop_id: etsyConnection.shopId || 'mock_shop_id' }
        };
        logger.info('Using mock listings data', { userId, isMockMode, count: listings.count });
      } else {
        listings = await etsyClient.getMyShopListings(limit, offset);
      }

      return NextResponse.json({
        success: true,
        data: {
          listings: listings.results,
          count: listings.count,
          params: listings.params,
          isSandbox
        }
      });
    } catch (error: any) {
      logger.error('Failed to get Etsy listings', {
        userId: (await auth()).userId,
        error: error.message
      });

      return NextResponse.json(
        { success: false, error: 'Failed to fetch listings from Etsy' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Failed to get Etsy listings', {
      userId: (await auth()).userId,
      error: error.message
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new listing
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, tags, materials, price, quantity, isDraft = false, shopSectionId } = body;

    if (!title || !description || !tags || !Array.isArray(tags)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, description, tags' },
        { status: 400 }
      );
    }

    const etsyConnection = await getEtsyConnection(userId);
    const isMockMode = process.env.ETSY_MOCK_MODE === "true";

    if (!etsyConnection.hasTokens && !isMockMode) {
      return NextResponse.json(
        { success: false, error: 'Etsy not connected' },
        { status: 400 }
      );
    }

    const etsyClient = new EtsyClient();
    const isSandbox = etsyClient.getSandboxMode();

    try {
      let newListing;
      if (isMockMode) {
        // Create a mock listing
        const mockListingId = Math.floor(Math.random() * 10000) + 2000;
        newListing = {
          listing_id: mockListingId,
          user_id: parseInt(userId, 10),
          shop_id: mockShopData.shop_id,
          title,
          description,
          state: isDraft ? 'draft' : 'active',
          creation_tsz: Math.floor(Date.now() / 1000),
          ending_timestamp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days from now
          original_creation_timestamp: Math.floor(Date.now() / 1000),
          last_modified_tsz: Math.floor(Date.now() / 1000),
          price: {
            amount: price || 1999,
            divisor: 100,
            currency_code: "USD"
          },
          quantity: quantity || 1,
          tags,
          materials: materials || [],
          shop_section_id: shopSectionId || null,
          featured_rank: 0,
          url: `https://www.etsy.com/listing/${mockListingId}/mock-listing`,
          views: 0,
          num_favorers: 0,
          processing_min: 1,
          processing_max: 3,
          who_made: "i_did",
          is_supply: false,
          when_made: "2020s",
          item_weight: 0,
          item_weight_unit: "lb",
          item_length: 0,
          item_width: 0,
          item_height: 0,
          item_dimensions_unit: "in",
          is_private: false,
          style: [],
          non_taxable: false,
          is_customizable: false,
          is_digital: false,
          file_data: "",
          should_auto_renew: true,
          language: "en-US",
          has_variations: false,
          taxonomy_id: 0,
          taxonomy_path: [],
          used_manufacturer: false,
          is_vintage: false,
          images: [],
          videos: [],
          shop_name: mockShopData.shop_name
        };
        
        // Add to mock listings array
        mockListings.unshift(newListing);
        
        logger.info('Created mock listing', { 
          userId, 
          isMockMode, 
          listingId: mockListingId,
          title: title.substring(0, 50) + '...'
        });
      } else {
        // Create real listing via Etsy API
        newListing = await etsyClient.createListing({
          title,
          description,
          tags,
          materials: materials || ['Handmade'],
          price: price || 1999,
          quantity: quantity || 1
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          listing: newListing,
          isSandbox
        }
      });
    } catch (error: any) {
      logger.error('Failed to create Etsy listing', {
        userId: (await auth()).userId,
        error: error.message
      });

      return NextResponse.json(
        { success: false, error: 'Failed to create listing on Etsy' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Failed to create Etsy listing', {
      userId: (await auth()).userId,
      error: error.message
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
