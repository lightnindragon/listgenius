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
  ChevronRight,
  Bot,
  Play,
  Pause,
  RefreshCw,
  BarChart3,
  Clock,
  TrendingUp,
  Activity
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
  workflowStatus?: string;
  qualityScore?: number;
  autoPublished?: boolean;
  revisionCount?: number;
  aiGeneratedTopicKeyword?: string;
  targetKeywordDensity?: number;
  _count: {
    comments: number;
  };
}

interface AutomationStats {
  totalAutoPosts: number;
  avgQualityScore: number;
  avgWordCount: number;
  avgRevisionCount: number;
  lastSuccessfulRun: string | null;
  automationEnabled: boolean;
  categoryDistribution: Record<string, number>;
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
  const [automationStats, setAutomationStats] = useState<AutomationStats | null>(null);
  const [showAutomationPanel, setShowAutomationPanel] = useState(false);
  const [automationLoading, setAutomationLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchCommentSettings();
    fetchAutomationStats();
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

  const fetchAutomationStats = async () => {
    try {
      const response = await fetch('/api/blog/automation/publish?status=published&limit=50');
      const data = await response.json();
      
      if (data.success) {
        const autoPosts = data.data.posts.filter((post: any) => post.autoPublished);
        const totalAutoPosts = autoPosts.length;
        const avgQualityScore = data.data.statistics.avgQualityScore || 0;
        const avgWordCount = data.data.statistics.avgWordCount || 0;
        const avgRevisionCount = data.data.statistics.avgRevisionCount || 0;
        
        // Calculate category distribution
        const categoryDistribution: Record<string, number> = {};
        autoPosts.forEach((post: any) => {
          if (post.category) {
            categoryDistribution[post.category] = (categoryDistribution[post.category] || 0) + 1;
          }
        });

        // Get last successful run (most recent published post)
        const lastSuccessfulRun = autoPosts.length > 0 ? autoPosts[0].publishedAt : null;

        setAutomationStats({
          totalAutoPosts,
          avgQualityScore,
          avgWordCount,
          avgRevisionCount,
          lastSuccessfulRun,
          automationEnabled: true, // This could be a setting
          categoryDistribution
        });
      }
    } catch (error) {
      console.error('Failed to load automation stats');
    }
  };

  const handleTestAutomation = async () => {
    setAutomationLoading(true);
    try {
      const response = await fetch('/api/blog/automation/test-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testMode: true, skipExistingCheck: true })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Test workflow completed successfully');
        fetchPosts();
        fetchAutomationStats();
      } else {
        toast.error(`Test workflow failed: ${data.error}`);
      }
    } catch (error) {
      toast.error('Failed to run test workflow');
    } finally {
      setAutomationLoading(false);
    }
  };

  const handleRefreshAutomation = async () => {
    setAutomationLoading(true);
    try {
      await fetchAutomationStats();
      toast.success('Automation stats refreshed');
    } catch (error) {
      toast.error('Failed to refresh automation stats');
    } finally {
      setAutomationLoading(false);
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
              onClick={() => setShowAutomationPanel(!showAutomationPanel)}
              className="flex items-center gap-2"
            >
              <Bot className="h-4 w-4" />
              Automation
            </Button>
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
                  variant={commentSettings.commentsEnabled ? "primary" : "outline"}
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
                  variant={commentSettings.moderationRequired ? "primary" : "outline"}
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

        {/* Automation Panel */}
        {showAutomationPanel && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Blog Automation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Automation Status */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Automation Status</h3>
                  <p className="text-sm text-gray-600">AI-powered blog post generation and publishing</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={automationStats?.automationEnabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {automationStats?.automationEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshAutomation}
                    disabled={automationLoading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${automationLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Automation Stats */}
              {automationStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Total Auto Posts</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">{automationStats.totalAutoPosts}</div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Avg Quality Score</span>
                    </div>
                    <div className="text-2xl font-bold text-green-900">{automationStats.avgQualityScore.toFixed(1)}</div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Avg Word Count</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-900">{automationStats.avgWordCount}</div>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-900">Avg Revisions</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-900">{automationStats.avgRevisionCount.toFixed(1)}</div>
                  </div>
                </div>
              )}

              {/* Last Run Info */}
              {automationStats?.lastSuccessfulRun && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Last Successful Run</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDistanceToNow(new Date(automationStats.lastSuccessfulRun), { addSuffix: true })}
                  </div>
                </div>
              )}

              {/* Category Distribution */}
              {automationStats && Object.keys(automationStats.categoryDistribution).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Category Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(automationStats.categoryDistribution).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{category}</span>
                        <Badge variant="outline">{count} posts</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Automation Controls */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <Button
                  onClick={handleTestAutomation}
                  disabled={automationLoading}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {automationLoading ? 'Running Test...' : 'Test Workflow'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAutomationPanel(false)}
                >
                  Close Panel
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
                              {post.autoPublished && (
                                <div className="flex items-center gap-2">
                                  <Bot className="h-3 w-3 text-blue-600" />
                                  <span className="text-blue-600 font-medium">AI Generated</span>
                                </div>
                              )}
                              {post.workflowStatus && (
                                <div><span className="font-medium">Workflow:</span> 
                                  <Badge className="ml-2 text-xs" variant="outline">
                                    {post.workflowStatus}
                                  </Badge>
                                </div>
                              )}
                              {post.qualityScore && (
                                <div><span className="font-medium">Quality Score:</span> {post.qualityScore}/100</div>
                              )}
                              {post.revisionCount && post.revisionCount > 0 && (
                                <div><span className="font-medium">Revisions:</span> {post.revisionCount}</div>
                              )}
                              {post.aiGeneratedTopicKeyword && (
                                <div><span className="font-medium">Topic Keyword:</span> {post.aiGeneratedTopicKeyword}</div>
                              )}
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