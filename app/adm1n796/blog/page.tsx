'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Edit, 
  Trash2, 
  Eye, 
  MessageSquare, 
  Calendar, 
  User, 
  MoreVertical,
  Plus,
  Settings,
  Ban,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  views: number;
  likes: number;
  tags: string[];
  category: string | null;
  _count: {
    comments: number;
  };
}

interface CommentSettings {
  commentsEnabled: boolean;
  moderationRequired: boolean;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentSettings, setCommentSettings] = useState<CommentSettings>({
    commentsEnabled: true,
    moderationRequired: true
  });
  const [showCommentSettings, setShowCommentSettings] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPosts();
    fetchCommentSettings();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/adm1n796/blog');
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.data.posts);
      } else {
        toast.error('Failed to load blog posts');
      }
    } catch (error) {
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentSettings = async () => {
    try {
      const response = await fetch('/api/adm1n796/blog/settings');
      const data = await response.json();
      
      if (data.success) {
        setCommentSettings(data.data);
      }
    } catch (error) {
      console.error('Failed to load comment settings');
    }
  };

  const handleDeletePost = async (postId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/adm1n796/blog/post/${postId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('Post deleted successfully');
        fetchPosts();
      } else {
        toast.error('Failed to delete post');
      }
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const handleToggleCommentSettings = async (setting: keyof CommentSettings) => {
    try {
      const response = await fetch('/api/adm1n796/blog/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [setting]: !commentSettings[setting]
        })
      });
      
      if (response.ok) {
        const newSettings = { ...commentSettings, [setting]: !commentSettings[setting] };
        setCommentSettings(newSettings);
        toast.success('Settings updated successfully');
      } else {
        toast.error('Failed to update settings');
      }
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const togglePostExpansion = (postId: string) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
            <p className="text-gray-600">Manage blog posts, comments, and settings</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCommentSettings(!showCommentSettings)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Comment Settings
            </Button>
            <Link href="/adm1n796/blog/create">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Post
              </Button>
            </Link>
          </div>
        </div>

        {/* Comment Settings Panel */}
        {showCommentSettings && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comment Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Enable Comments</h3>
                  <p className="text-sm text-gray-600">Allow users to comment on blog posts</p>
                </div>
                <Button
                  variant={commentSettings.commentsEnabled ? "default" : "outline"}
                  onClick={() => handleToggleCommentSettings('commentsEnabled')}
                  className="flex items-center gap-2"
                >
                  {commentSettings.commentsEnabled ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      Disabled
                    </>
                  )}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Moderation Required</h3>
                  <p className="text-sm text-gray-600">Comments must be approved before appearing</p>
                </div>
                <Button
                  variant={commentSettings.moderationRequired ? "default" : "outline"}
                  onClick={() => handleToggleCommentSettings('moderationRequired')}
                  className="flex items-center gap-2"
                >
                  {commentSettings.moderationRequired ? (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      Required
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Not Required
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts Accordion */}
        <div className="space-y-2">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-600 mb-4">No blog posts found</p>
                <Link href="/adm1n796/blog/create">
                  <Button>Create Your First Post</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => {
              const isExpanded = expandedPosts.has(post.id);
              return (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardHeader 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => togglePostExpansion(post.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                            <Badge className={getStatusColor(post.status)}>
                              {post.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {post.views} views
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {post._count.comments} comments
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {post.publishedAt 
                                ? formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })
                                : 'Not published'
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {post.excerpt && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Excerpt</h4>
                            <p className="text-gray-600 text-sm">{post.excerpt}</p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Details</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div><span className="font-medium">Slug:</span> {post.slug}</div>
                              <div><span className="font-medium">Category:</span> {post.category || 'None'}</div>
                              <div><span className="font-medium">Created:</span> {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</div>
                              <div><span className="font-medium">Updated:</span> {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}</div>
                            </div>
                          </div>
                          
                          {post.tags.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                              <div className="flex flex-wrap gap-1">
                                {post.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 pt-4 border-t">
                          <Link href={`/blog/${post.slug}`} target="_blank">
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              View Post
                            </Button>
                          </Link>
                          <Link href={`/adm1n796/blog/${post.slug}/edit`}>
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                          </Link>
                          <Link href={`/adm1n796/blog/${post.slug}/comments`}>
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              Comments ({post._count.comments})
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePost(post.id, post.title)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
}