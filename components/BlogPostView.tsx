'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  publishedAt: string | null;
  tags: string[];
  category: string | null;
  views: number;
  likes: number;
  images: Array<{
    id: string;
    url: string;
    alt: string | null;
    caption: string | null;
    order: number;
  }>;
  comments: Array<{
    id: string;
    name: string;
    content: string;
    createdAt: string;
  }>;
}

interface BlogPostViewProps {
  slug: string;
}

export default function BlogPostView({ slug }: BlogPostViewProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentForm, setCommentForm] = useState({
    name: '',
    email: '',
    content: ''
  });

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/blog/${slug}`);
      const data = await response.json();
      
      if (data.success) {
        setPost(data.data);
      } else {
        console.error('Error fetching post:', data.error);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentLoading(true);

    try {
      const response = await fetch(`/api/blog/${slug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentForm)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Comment submitted! It will appear after approval.');
        setCommentForm({ name: '', email: '', content: '' });
        fetchPost(); // Refresh to show new comment
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Failed to submit comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleLike = async () => {
    // This would be implemented with a separate API endpoint
    toast.success('Thanks for liking this post!');
  };

  if (loading) {
    return (
      <div className="bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="h-64 bg-gray-200 rounded mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
            <p className="text-gray-600">The blog post you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white blog-page" data-blog="true">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              {post.category && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">{post.category}</Badge>
              )}
              <span className="text-sm text-gray-500">
                {post.publishedAt && formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
              </span>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
            
            {post.excerpt && (
              <p className="text-xl text-gray-600 mb-6">{post.excerpt}</p>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
              <div className="flex items-center gap-4">
                <span>{post.views} views</span>
                <span>{post.comments.length} comments</span>
              </div>
              <Button onClick={handleLike} variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                {post.likes} likes
              </Button>
            </div>
          </div>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-8">
            <div className="aspect-video relative rounded-lg overflow-hidden">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-12 text-gray-900">
            <div className="whitespace-pre-wrap">{post.content}</div>
          </div>

          {/* Additional Images */}
          {post.images.length > 0 && (
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {post.images.map((image) => (
                  <div key={image.id} className="space-y-2">
                    <div className="aspect-video relative rounded-lg overflow-hidden">
                      <Image
                        src={image.url}
                        alt={image.alt || ''}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {image.caption && (
                      <p className="text-sm text-gray-600 italic">{image.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mb-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-gray-300 text-gray-600">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="border-t border-gray-200 pt-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Comments ({post.comments.length})
            </h3>

            {/* Comment Form */}
            <Card className="mb-8 bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Leave a Comment</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCommentSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <Input
                        value={commentForm.name}
                        onChange={(e) => setCommentForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Your name"
                        required
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <Input
                        type="email"
                        value={commentForm.email}
                        onChange={(e) => setCommentForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com"
                        required
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comment *
                    </label>
                    <Textarea
                      value={commentForm.content}
                      onChange={(e) => setCommentForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Share your thoughts..."
                      rows={4}
                      required
                      className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    loading={commentLoading}
                    disabled={!commentForm.name || !commentForm.email || !commentForm.content}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Post Comment
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Comments List */}
            {post.comments.length > 0 ? (
              <div className="space-y-6">
                {post.comments.map((comment) => (
                  <Card key={comment.id} className="bg-white border border-gray-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{comment.name}</h4>
                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
