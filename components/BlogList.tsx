'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  publishedAt: string | null;
  tags: string[];
  category: string | null;
  views: number;
  likes: number;
  _count: {
    comments: number;
  };
}

interface BlogListProps {
  initialPosts?: BlogPost[];
}

export default function BlogList({ initialPosts = [] }: BlogListProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('published');

  const fetchPosts = async (pageNum = 1, reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        status,
        ...(category && { category }),
        ...(search && { search })
      });

      const response = await fetch(`/api/blog?${params}`);
      const data = await response.json();

      if (data.success) {
        if (reset) {
          setPosts(data.data.posts);
        } else {
          setPosts(prev => [...prev, ...data.data.posts]);
        }
        setHasMore(data.data.pagination.page < data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1, true);
  }, [search, category, status]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPosts(1, true);
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Container>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Blog</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Discover insights, tips, and stories about Etsy selling, SEO optimization, and digital product creation.
            </p>
          </div>
        </Container>
      </section>

      {/* Content */}
      <section className="py-20">
        <Container>

          {/* Filters */}
          <div className="mb-8">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-6">
              <Input
                type="text"
                placeholder="Search posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
              />
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full sm:w-48 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="seo">SEO</option>
                <option value="marketing">Marketing</option>
                <option value="tips">Tips & Tricks</option>
                <option value="case-studies">Case Studies</option>
              </Select>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white border-0 px-6 py-2 rounded-md font-medium transition-colors"
              >
                Search
              </Button>
            </form>
          </div>

          {/* Posts Grid */}
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No posts found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Card key={post.id} className="overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  {post.featuredImage && (
                    <div className="aspect-video relative">
                      <Image
                        src={post.featuredImage}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      {post.category && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">{post.category}</Badge>
                      )}
                      <span className="text-sm text-gray-500">
                        {post.publishedAt && formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
                      </span>
                    </div>
                    <CardTitle className="line-clamp-2 text-gray-900">
                      <Link href={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
                        {post.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {post.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span>{post.views} views</span>
                        <span>{post._count.comments} comments</span>
                      </div>
                      <span>{post.likes} likes</span>
                    </div>
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs border-gray-300 text-gray-600">
                            {tag}
                          </Badge>
                        ))}
                        {post.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                            +{post.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-12">
              <Button
                onClick={handleLoadMore}
                loading={loading}
                variant="outline"
                size="lg"
              >
                Load More Posts
              </Button>
            </div>
          )}
        </Container>
      </section>
    </div>
  );
}
