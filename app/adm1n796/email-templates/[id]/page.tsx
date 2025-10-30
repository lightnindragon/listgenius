'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { 
  Save,
  Send,
  Eye,
  X,
  Loader2,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

// Helper function to strip HTML and convert to plain text
const stripHtml = (html: string): string => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  variables: string[];
  isActive: boolean;
}

export default function EditEmailTemplatePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTemplate();
  }, [params.id]);

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/adm1n796/email-templates/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        setTemplate(data.template);
        // Initialize test variables with sample values
        const vars: Record<string, string> = {};
        data.template.variables.forEach((v: string) => {
          // Map variable names to sample values
          switch(v) {
            case 'userName':
              vars[v] = 'Test User';
              break;
            case 'affiliateCode':
              vars[v] = 'TEST123';
              break;
            case 'affiliateUrl':
              vars[v] = (typeof window !== 'undefined' ? window.location.origin : 'https://listgenius.expert') + '/ref/TEST123';
              break;
            case 'appUrl':
              vars[v] = typeof window !== 'undefined' ? window.location.origin : 'https://listgenius.expert';
              break;
            case 'rejectionReason':
              vars[v] = 'Not meeting our current requirements';
              break;
            case 'suspensionReason':
              vars[v] = 'Violation of terms of service';
              break;
            default:
              vars[v] = `Sample ${v}`;
          }
        });
        setTestVariables(vars);
      } else {
        setError(data.error || 'Failed to load template');
      }
    } catch (error) {
      setError('Failed to load email template');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!template) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/adm1n796/email-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          subject: template.subject,
          htmlBody: template.htmlBody,
          textBody: template.textBody,
          variables: template.variables,
          isActive: template.isActive,
          category: template.category,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Template saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to save template');
      }
    } catch (error) {
      setError('Failed to save email template');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!template || !testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    setTesting(true);
    setError('');

    try {
      const response = await fetch('/api/adm1n796/email-templates/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          testEmail,
          variables: testVariables,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Test email sent successfully!');
        setShowTestDialog(false);
      } else {
        const errorMsg = data.details 
          ? `${data.error || 'Failed to send test email'}: ${data.details}`
          : data.error || 'Failed to send test email';
        toast.error(errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      toast.error('Failed to send test email');
      setError('Failed to send test email');
    } finally {
      setTesting(false);
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

  if (!template) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Template not found</p>
          <Link href="/adm1n796/email-templates">
            <Button variant="outline">Back to Templates</Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/adm1n796/email-templates">
              <Button variant="outline" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Templates
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
            <p className="text-gray-600">Edit email template content</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowTestDialog(true)}
              variant="outline"
            >
              <Send className="h-4 w-4 mr-2" />
              Test Email
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Template Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={template.category}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={template.description || ''}
              onChange={(e) => setTemplate({ ...template, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of this template"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Active Status
            </label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={template.isActive}
                onChange={(e) => setTemplate({ ...template, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600">
                {template.isActive ? 'Template is active' : 'Template is inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Available Variables */}
        {template.variables.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              Available Variables (use double curly braces, e.g., {`{{userName}}`})
            </h3>
            <div className="flex flex-wrap gap-2">
              {template.variables.map((v: string) => (
                <code key={v} className="bg-white px-2 py-1 rounded text-sm border border-blue-200">
                  {`{{${v}}}`}
                </code>
              ))}
            </div>
          </div>
        )}

        {/* Email Subject */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject Line
          </label>
          <input
            type="text"
            value={template.subject}
            onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Email subject"
          />
        </div>

        {/* HTML Body */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              HTML Body
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                {template.htmlBody.length} characters
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const plainText = stripHtml(template.htmlBody);
                  setTemplate({ ...template, textBody: plainText });
                  toast.success('Plain text generated from HTML!');
                }}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Generate Text from HTML
              </Button>
            </div>
          </div>
          <textarea
            value={template.htmlBody}
            onChange={(e) => setTemplate({ ...template, htmlBody: e.target.value })}
            rows={20}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="HTML email content (variables: {{variableName}})"
          />
        </div>

        {/* Text Body */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Plain Text Body
            </label>
            <span className="text-xs text-gray-500">
              {template.textBody.length} characters
            </span>
          </div>
          <textarea
            value={template.textBody}
            onChange={(e) => setTemplate({ ...template, textBody: e.target.value })}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="Plain text email content (variables: {{variableName}})"
          />
        </div>

        {/* Test Email Dialog */}
        {showTestDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Send Test Email</h3>
                <button
                  onClick={() => setShowTestDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Email Address
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                />
              </div>

              {template.variables.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Variables
                  </label>
                  {template.variables.map((v: string) => (
                    <div key={v} className="mb-2">
                      <input
                        type="text"
                        value={testVariables[v] || ''}
                        onChange={(e) =>
                          setTestVariables({ ...testVariables, [v]: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Enter value for ${v}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleSendTest}
                  disabled={testing || !testEmail}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test Email
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowTestDialog(false)}
                  variant="outline"
                  disabled={testing}
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

