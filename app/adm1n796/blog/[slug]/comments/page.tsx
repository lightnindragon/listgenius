'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Ban, 
  User, 
  Mail, 
  Calendar,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface Comment {
  id: string;
  name: string;
  email: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
}

export default function AdminCommentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    fetchPostAndComments();
  }, []);

  const fetchPostAndComments = async () => {
    try {
      const resolvedParams = await params;
      const response = await fetch(`/api/adm1n796/blog/${resolvedParams.slug}/comments`);
      const data = await response.json();
      
      if (data.success) {
        setPost(data.data.post);
        setComments(data.data.comments);
      } else {
        toast.error('Failed to load comments');
      }
    } catch (error) {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAction = async (commentId: string, action: 'approve' | 'reject' | 'delete') => {
    try {
      const response = await fetch(`/api/adm1n796/blog/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      });
      
      if (response.ok) {
        toast.success(`Comment ${action}d successfully`);
        fetchPostAndComments();
      } else {
        toast.error(`Failed to ${action} comment`);
      }
    } catch (error) {
      toast.error(`Failed to ${action} comment`);
    }
  };

  const handleSuspendUser = async (email: string) => {
    if (!confirm(`Are you sure you want to suspend user ${email} from commenting?`)) {
      return;
    }

    try {
      const response = await fetch('/api/adm1n796/blog/suspend-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        toast.success('User suspended successfully');
      } else {
        toast.error('Failed to suspend user');
      }
    } catch (error) {
      toast.error('Failed to suspend user');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredComments = comments.filter(comment => {
    if (filter === 'all') return true;
    return comment.status === filter;
  });

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
          <div className="flex items-center gap-4">
            <Link href="/adm1n796/blog">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Posts
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Comment Management</h1>
              <p className="text-gray-600">
                {post ? `Managing comments for: ${post.title}` : 'Loading...'}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status} ({status === 'all' ? comments.length : comments.filter(c => c.status === status).length})
            </Button>
          ))}
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {filteredComments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {filter === 'all' ? 'No comments found' : `No ${filter} comments found`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredComments.map((comment) => (
              <Card key={comment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getStatusColor(comment.status)}>
                          {comment.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {comment.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {comment.email}
                        </div>
                      </div>
                      
                      <p className="text-gray-900 mb-4">{comment.content}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {comment.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCommentAction(comment.id, 'approve')}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCommentAction(comment.id, 'reject')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuspendUser(comment.email)}
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        title="Suspend user from commenting"
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCommentAction(comment.id, 'delete')}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
