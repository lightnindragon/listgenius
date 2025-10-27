import { auth } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { isAdminAuthenticated } from '@/lib/admin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'published';
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = { status };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          images: {
            orderBy: { order: 'asc' }
          },
          _count: {
            select: { comments: true }
          }
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.blogPost.count({ where })
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check admin authentication
    if (!isAdminAuthenticated(req)) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }
    
    const body = await req.json();
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      status = 'draft',
      tags = [],
      category,
      seoTitle,
      seoDescription,
      seoKeywords = [],
      images = []
    } = body;
    
    // Generate slug if not provided
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Check if slug already exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug: finalSlug }
    });
    
    if (existingPost) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 400 }
      );
    }
    
    const post = await prisma.blogPost.create({
      data: {
        id: randomUUID(),
        userId: 'admin', // Admin posts
        title,
        slug: finalSlug,
        excerpt,
        content,
        featuredImage,
        status,
        publishedAt: status === 'published' ? new Date() : null,
        tags,
        category,
        seoTitle,
        seoDescription,
        seoKeywords,
        images: {
          create: images.map((img: any, index: number) => ({
            id: randomUUID(),
            url: img.url,
            alt: img.alt || '',
            caption: img.caption || '',
            order: index
          }))
        }
      },
      include: {
        images: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
}
