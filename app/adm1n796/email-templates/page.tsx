'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { 
  Mail, 
  Plus,
  Edit,
  Trash2,
  Send,
  Eye,
  Check,
  X,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  subject: string;
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSeedDialog, setShowSeedDialog] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/adm1n796/email-templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates);
      } else {
        setError(data.error || 'Failed to load templates');
      }
    } catch (error) {
      setError('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedTemplates = async () => {
    setSeeding(true);
    try {
      const response = await fetch('/api/adm1n796/email-templates/seed', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setShowSeedDialog(false);
        fetchTemplates(); // Refresh list
      } else {
        setError(data.error || 'Failed to seed templates');
      }
    } catch (error) {
      setError('Failed to seed email templates');
    } finally {
      setSeeding(false);
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'welcome':
        return 'bg-blue-100 text-blue-800';
      case 'affiliate_approval':
        return 'bg-green-100 text-green-800';
      case 'affiliate_rejection':
        return 'bg-red-100 text-red-800';
      case 'affiliate_suspension':
        return 'bg-yellow-100 text-yellow-800';
      case 'affiliate_application_received':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  const needsSeeding = templates.length === 0;

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
            <p className="text-gray-600">Manage automated email templates</p>
          </div>
          <div className="flex gap-2">
            {needsSeeding && (
              <Button
                onClick={() => setShowSeedDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Seed Default Templates
              </Button>
            )}
            <Link href="/adm1n796/email-templates/new">
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {needsSeeding && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <Mail className="h-6 w-6 text-blue-600 mr-3 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Get Started with Email Templates
                </h3>
                <p className="text-blue-800 mb-4">
                  You don't have any email templates yet. Seed the default templates to get started quickly.
                </p>
                <Button
                  onClick={handleSeedTemplates}
                  disabled={seeding}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {seeding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Seeding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Seed Default Templates
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Templates Grid */}
        {templates.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {template.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(
                          template.category
                        )}`}
                      >
                        {template.category.replace('_', ' ')}
                      </span>
                      {template.isActive ? (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                          <Check className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                          <X className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    {template.description && (
                      <p className="text-gray-600 mb-3">{template.description}</p>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        Used {template.usageCount} times
                      </span>
                      {template.lastUsedAt && (
                        <span>
                          Last used: {new Date(template.lastUsedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 rounded p-3 mb-4">
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Subject:</strong>
                      </p>
                      <p className="text-gray-900">{template.subject}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Link href={`/adm1n796/email-templates/${template.id}`}>
                      <Button variant="outline" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        View & Edit
                      </Button>
                    </Link>
                    <Link href={`/adm1n796/email-templates/${template.id}/test`}>
                      <Button variant="outline" className="w-full">
                        <Send className="h-4 w-4 mr-2" />
                        Test
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Seed Dialog */}
        {showSeedDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Seed Default Templates?
              </h3>
              <p className="text-gray-600 mb-6">
                This will create the default email templates for welcome emails, affiliate applications, and more.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleSeedTemplates}
                  disabled={seeding}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {seeding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Seeding...
                    </>
                  ) : (
                    'Yes, Seed Templates'
                  )}
                </Button>
                <Button
                  onClick={() => setShowSeedDialog(false)}
                  variant="outline"
                  disabled={seeding}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

