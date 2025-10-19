import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { logger } from '@/lib/logger';
import { simulateDelay } from '@/lib/mock-etsy-data';
import altTextPrompt from '@/config/prompts/image-alt-text.json';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl, imageBase64, title, tags, descriptionExcerpt } = body;

    if (!imageUrl && !imageBase64) {
      return NextResponse.json(
        { success: false, error: 'Image URL or base64 data required' },
        { status: 400 }
      );
    }

    const isMockMode = process.env.ETSY_MOCK_MODE === "true" || !process.env.OPENAI_API_KEY;

    try {
      let altText;

      if (isMockMode) {
        // Mock mode - generate simple alt text based on context
        await simulateDelay(800);
        
        const titleWords = title ? title.split(' ').slice(0, 8).join(' ') : 'Product';
        const firstTag = tags && tags.length > 0 ? tags[0] : '';
        
        altText = `${titleWords}${firstTag ? ` - ${firstTag}` : ''}, handcrafted with attention to detail`.substring(0, 250);
        
        logger.info('Generated mock alt text', { 
          userId, 
          isMockMode, 
          altTextLength: altText.length 
        });
      } else {
        // Real mode - use GPT-4o Vision
        const tagsString = tags && Array.isArray(tags) ? tags.join(', ') : '';
        const descExcerpt = descriptionExcerpt ? descriptionExcerpt.substring(0, 200) : '';

        const userPrompt = altTextPrompt.user
          .replace('{{title}}', title || 'Product')
          .replace('{{tags}}', tagsString || 'N/A')
          .replace('{{description_excerpt}}', descExcerpt || 'N/A');

        const imageContent: any = imageUrl 
          ? { type: 'image_url', image_url: { url: imageUrl } }
          : { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } };

        const response = await openai.chat.completions.create({
          model: altTextPrompt.model || 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: altTextPrompt.system
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: userPrompt },
                imageContent
              ]
            }
          ],
          max_tokens: 100,
          temperature: altTextPrompt.temperature || 0.7,
        });

        altText = response.choices[0]?.message?.content?.trim() || '';

        // Ensure it's under 250 characters
        if (altText.length > altTextPrompt.maxLength) {
          altText = altText.substring(0, altTextPrompt.maxLength - 3) + '...';
        }

        logger.info('Generated AI alt text', {
          userId,
          model: altTextPrompt.model,
          altTextLength: altText.length,
          tokensUsed: response.usage?.total_tokens
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          altText,
          length: altText.length,
          isMock: isMockMode
        }
      });
    } catch (error: any) {
      logger.error('Failed to generate alt text', {
        userId,
        error: error.message,
        stack: error.stack
      });

      return NextResponse.json(
        { success: false, error: 'Failed to generate alt text' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Failed to generate alt text', {
      userId: (await auth()).userId,
      error: error.message
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

