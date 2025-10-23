import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const requestSchema = z.object({
  imageUrl: z.string().url(),
  productName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl, productName } = requestSchema.parse(body);

    if (!process.env.OPENAI_API_KEY) {
      logger.error('OpenAI API key not configured');
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `You are an expert in e-commerce photography and Etsy listing optimization. Analyze the provided product image and provide a comprehensive quality assessment.

Rate each aspect on a scale of 0-100:
- Lighting: How well is the product lit? Is it evenly lit without harsh shadows or overexposure?
- Background: Is the background clean, uncluttered, and appropriate for the product?
- Visibility: How clearly can customers see the product details, texture, and features?
- Composition: Is the product well-framed and positioned for maximum visual impact?

Provide specific, actionable feedback and improvement suggestions. Focus on what would help customers better understand and want to purchase this product.

The product is: ${productName || 'a handmade item'}`;

    const userPrompt = `Please analyze this product image for an Etsy listing. Provide scores for lighting, background, visibility, and composition (0-100 each), plus overall feedback and specific improvement suggestions.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userPrompt
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
      response_format: {
        type: 'json_object'
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    let analysisData;
    try {
      analysisData = JSON.parse(content);
    } catch (parseError) {
      logger.error('Failed to parse OpenAI response', { content, parseError });
      throw new Error('Invalid response format from OpenAI');
    }

    // Validate and structure the response
    const analysis = {
      overallScore: Math.round(
        (analysisData.lighting + analysisData.background + analysisData.visibility + analysisData.composition) / 4
      ),
      lighting: Math.max(0, Math.min(100, analysisData.lighting || 0)),
      background: Math.max(0, Math.min(100, analysisData.background || 0)),
      visibility: Math.max(0, Math.min(100, analysisData.visibility || 0)),
      composition: Math.max(0, Math.min(100, analysisData.composition || 0)),
      feedback: Array.isArray(analysisData.feedback) ? analysisData.feedback : [],
      improvements: Array.isArray(analysisData.improvements) ? analysisData.improvements : []
    };

    logger.info('Photo quality analysis completed', {
      userId,
      imageUrl: imageUrl.substring(0, 50) + '...',
      overallScore: analysis.overallScore
    });

    return NextResponse.json({
      success: true,
      data: {
        analysis
      }
    });

  } catch (error: any) {
    logger.error('Photo quality analysis failed', {
      error: error.message,
      stack: error.stack
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.issues
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to analyze photo quality'
    }, { status: 500 });
  }
}
