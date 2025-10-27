import BlogEditor from '@/components/BlogEditor';
import { prisma } from '@/lib/prisma';

interface EditBlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getBlogPost(slug: string) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        images: {
          orderBy: { order: 'asc' }
        }
      }
    });
    return post;
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  
  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Post Not Found</h1>
          <p className="text-muted-foreground">The blog post you're trying to edit doesn't exist.</p>
        </div>
      </div>
    );
  }

  return <BlogEditor post={post} mode="edit" />;
}
