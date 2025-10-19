import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { EtsyClient } from '@/lib/etsy';
import { getEtsyConnection } from '@/lib/clerk';
import { logger } from '@/lib/logger';
import {
  mockVideos,
  handleMockVideoUpload,
  handleMockVideoDelete,
  simulateDelay
} from '@/lib/mock-etsy-data';

// GET - Fetch all videos for a listing
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const listingId = parseInt(params.id);
    if (isNaN(listingId)) {
      return NextResponse.json({ success: false, error: 'Invalid listing ID' }, { status: 400 });
    }

    const etsyConnection = await getEtsyConnection(userId);
    const isMockMode = process.env.ETSY_MOCK_MODE === "true";

    if (!etsyConnection.hasTokens && !isMockMode) {
      return NextResponse.json(
        { success: false, error: 'Etsy not connected' },
        { status: 400 }
      );
    }

    try {
      let videos;
      if (isMockMode) {
        await simulateDelay(300);
        videos = mockVideos.filter(vid => vid.listing_id === listingId);
        logger.info('Using mock videos data', { userId, isMockMode, listingId, count: videos.length });
      } else {
        const etsyClient = new EtsyClient();
        videos = await etsyClient.getListingVideos(listingId);
      }

      return NextResponse.json({
        success: true,
        data: { videos }
      });
    } catch (error: any) {
      logger.error('Failed to get listing videos', {
        userId,
        listingId,
        error: error.message
      });

      return NextResponse.json(
        { success: false, error: 'Failed to fetch videos from Etsy' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Failed to get listing videos', {
      userId: (await auth()).userId,
      error: error.message
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Upload new video to listing
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const listingId = parseInt(params.id);
    if (isNaN(listingId)) {
      return NextResponse.json({ success: false, error: 'Invalid listing ID' }, { status: 400 });
    }

    const etsyConnection = await getEtsyConnection(userId);
    const isMockMode = process.env.ETSY_MOCK_MODE === "true";

    if (!etsyConnection.hasTokens && !isMockMode) {
      return NextResponse.json(
        { success: false, error: 'Etsy not connected' },
        { status: 400 }
      );
    }

    try {
      let uploadedVideo;
      if (isMockMode) {
        await simulateDelay(1200);
        const body = await request.json();
        uploadedVideo = handleMockVideoUpload(listingId, body);
        logger.info('Mock video uploaded', { userId, isMockMode, listingId, videoId: uploadedVideo.video_id });
      } else {
        const formData = await request.formData();
        const videoFile = formData.get('video') as File;
        
        if (!videoFile) {
          return NextResponse.json(
            { success: false, error: 'No video file provided' },
            { status: 400 }
          );
        }

        const etsyClient = new EtsyClient();
        uploadedVideo = await etsyClient.uploadListingVideo(listingId, videoFile);
      }

      return NextResponse.json({
        success: true,
        data: { video: uploadedVideo }
      });
    } catch (error: any) {
      logger.error('Failed to upload listing video', {
        userId,
        listingId,
        error: error.message
      });

      return NextResponse.json(
        { success: false, error: 'Failed to upload video to Etsy' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Failed to upload listing video', {
      userId: (await auth()).userId,
      error: error.message
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete video from listing
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const listingId = parseInt(params.id);
    if (isNaN(listingId)) {
      return NextResponse.json({ success: false, error: 'Invalid listing ID' }, { status: 400 });
    }

    const url = new URL(request.url);
    const videoId = parseInt(url.searchParams.get('videoId') || '0');
    
    if (isNaN(videoId) || videoId === 0) {
      return NextResponse.json({ success: false, error: 'Invalid video ID' }, { status: 400 });
    }

    const etsyConnection = await getEtsyConnection(userId);
    const isMockMode = process.env.ETSY_MOCK_MODE === "true";

    if (!etsyConnection.hasTokens && !isMockMode) {
      return NextResponse.json(
        { success: false, error: 'Etsy not connected' },
        { status: 400 }
      );
    }

    try {
      let deleted;
      if (isMockMode) {
        await simulateDelay(300);
        deleted = handleMockVideoDelete(listingId, videoId);
        logger.info('Mock video deleted', { userId, isMockMode, listingId, videoId, deleted });
        
        if (!deleted) {
          return NextResponse.json(
            { success: false, error: 'Video not found' },
            { status: 404 }
          );
        }
      } else {
        const etsyClient = new EtsyClient();
        await etsyClient.deleteListingVideo(listingId, videoId);
        deleted = true;
      }

      return NextResponse.json({
        success: true,
        data: { deleted }
      });
    } catch (error: any) {
      logger.error('Failed to delete listing video', {
        userId,
        listingId,
        videoId,
        error: error.message
      });

      return NextResponse.json(
        { success: false, error: 'Failed to delete video from Etsy' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Failed to delete listing video', {
      userId: (await auth()).userId,
      error: error.message
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

