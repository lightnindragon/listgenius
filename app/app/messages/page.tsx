'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { EmptyState } from '@/components/EmptyState';
import { TopRightToast, emitTopRightToast } from '@/components/TopRightToast';
import { getMessagingSystem, MessageTemplate } from '@/lib/messaging-system';

// Local interface for customer segments
interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: Record<string, any>;
  customerCount: number;
}
import { 
  MessageSquare, 
  Send, 
  Users, 
  Filter, 
  Search, 
  Plus, 
  Clock, 
  Check,
  X,
  Mail,
  Reply,
  Forward,
  Archive,
  Star,
  MoreVertical
} from 'lucide-react';
import { getBaseUrl } from '@/lib/utils';

interface EtsyMessage {
  message_id: number;
  sender_id: number;
  recipient_id: number;
  subject: string;
  body: string;
  read: boolean;
  created_timestamp: number;
  listing_id?: number;
  order_id?: number;
}

export default function MessagesPage() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'templates' | 'compose'>('inbox');
  const [messages, setMessages] = useState<EtsyMessage[]>([]);
  const [sentMessages, setSentMessages] = useState<EtsyMessage[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(new Set());
  const [selectedMessage, setSelectedMessage] = useState<EtsyMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Compose message state
  const [composeData, setComposeData] = useState({
    recipient: '',
    subject: '',
    body: '',
    templateId: '',
    variables: {} as Record<string, string>
  });
  
  // Template and segment data
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all');
  const [filterType, setFilterType] = useState<'all' | 'support' | 'order' | 'review'>('all');

  useEffect(() => {
    if (user && isLoaded) {
      loadData();
    }
  }, [user, isLoaded]);

  const loadData = async () => {
    setLoading(true);
    try {
      const messagingSystem = getMessagingSystem();
      
      // Load messages, templates, and segments in parallel
      // Note: Using mock data since the messaging system doesn't have these methods yet
      const mockMessages: EtsyMessage[] = [
        {
          message_id: 1,
          sender_id: 12345,
          recipient_id: 67890,
          subject: 'Welcome to our shop!',
          body: 'Thank you for your purchase...',
          read: false,
          created_timestamp: Date.now() - 86400000, // 1 day ago
          listing_id: 111
        },
        {
          message_id: 2,
          sender_id: 12345,
          recipient_id: 67891,
          subject: 'Your order has shipped',
          body: 'Great news! Your order is on its way...',
          read: true,
          created_timestamp: Date.now() - 172800000, // 2 days ago
          order_id: 222
        }
      ];
      
      const mockTemplates: MessageTemplate[] = [
        {
          id: '1',
          userId: user?.id || 'mock-user',
          name: 'Welcome Email',
          type: 'welcome',
          subject: 'Welcome to {{shopName}}!',
          content: 'Thank you for your purchase, {{customerName}}!',
          variables: ['shopName', 'customerName'],
          isDefault: false,
          usageCount: 15,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: '2',
          userId: user?.id || 'mock-user',
          name: 'Order Shipped',
          type: 'shipping',
          subject: 'Your order is on its way!',
          content: 'Great news, {{customerName}}! Your order #{{orderNumber}} has shipped.',
          variables: ['customerName', 'orderNumber'],
          isDefault: false,
          usageCount: 8,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02')
        }
      ];
      const mockSegments = [
        {
          id: '1',
          name: 'New Customers',
          description: 'Customers who made their first purchase',
          criteria: { firstPurchase: true },
          customerCount: 45
        },
        {
          id: '2',
          name: 'VIP Customers',
          description: 'High-value repeat customers',
          criteria: { totalSpent: { $gte: 500 } },
          customerCount: 12
        }
      ];
      
      setMessages(mockMessages);
      setSentMessages(mockMessages);
      setTemplates(mockTemplates);
      setSegments(mockSegments);
    } catch (error) {
      console.error('Error loading messages data:', error);
      emitTopRightToast('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!composeData.recipient || !composeData.subject || !composeData.body) {
      emitTopRightToast('Please fill in all required fields', 'error');
      return;
    }

    setSending(true);
    try {
      const messagingSystem = getMessagingSystem();
      
      // Extract recipient ID from recipient field (assuming it's in format "customer_id" or email)
      const recipientId = parseInt(composeData.recipient) || 0;
      
      if (recipientId === 0) {
        emitTopRightToast('Invalid recipient ID', 'error');
        return;
      }

      const message = await messagingSystem.sendMessage(
        user?.id || '',
        {
          recipientId: recipientId.toString(),
          recipientEmail: composeData.recipient,
          type: 'custom',
          subject: composeData.subject,
          content: composeData.body,
          template: composeData.templateId || '',
          variables: {}
        }
      );

      if (message) {
        emitTopRightToast('Message sent successfully!', 'success');
        setComposeData({
          recipient: '',
          subject: '',
          body: '',
          templateId: '',
          variables: {}
        });
        setActiveTab('sent');
        loadData(); // Refresh sent messages
      }
    } catch (error) {
      console.error('Error sending message:', error);
      emitTopRightToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleUseTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setComposeData(prev => ({
      ...prev,
      subject: template.subject,
      body: template.content,
      templateId: template.id
    }));
    setActiveTab('compose');
  };

  const handleMarkAsRead = async (messageId: number) => {
    try {
      // Mock mark as read functionality
      console.log(`Marking message ${messageId} as read`);
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.message_id === messageId ? { ...msg, read: true } : msg
      ));
      
      emitTopRightToast('Message marked as read', 'success');
    } catch (error) {
      console.error('Error marking message as read:', error);
      emitTopRightToast('Failed to mark message as read', 'error');
    }
  };

  const handleSelectMessage = (messageId: number) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedMessages.size === getCurrentMessages().length) {
      setSelectedMessages(new Set());
    } else {
      setSelectedMessages(new Set(getCurrentMessages().map(msg => msg.message_id)));
    }
  };

  const getCurrentMessages = (): EtsyMessage[] => {
    return activeTab === 'inbox' ? messages : sentMessages;
  };

  const filteredMessages = getCurrentMessages().filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.body.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRead = filterRead === 'all' || 
                       (filterRead === 'read' && message.read) ||
                       (filterRead === 'unread' && !message.read);
    
    const matchesType = filterType === 'all' || true; // Add type filtering logic if needed
    
    return matchesSearch && matchesRead && matchesType;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Sign in required
        </h1>
        <p className="text-gray-600 mb-6">
          Please sign in to view your messages.
        </p>
        <a
          href="/sign-in"
          className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <DashboardLayout onCreateListingClick={() => {}}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">
            Communicate with your customers and manage your message templates.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'inbox', name: 'Inbox', icon: MessageSquare, count: messages.filter(m => !m.read).length },
              { id: 'sent', name: 'Sent', icon: Send, count: sentMessages.length },
              { id: 'templates', name: 'Templates', icon: Mail, count: templates.length },
              { id: 'compose', name: 'Compose', icon: Plus, count: 0 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
                {tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'inbox' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search messages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={filterRead}
                  onChange={(e) => setFilterRead(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="all">All Messages</option>
                  <option value="unread">Unread Only</option>
                  <option value="read">Read Only</option>
                </select>
              </div>
            </div>

            {/* Messages List */}
            <div className="bg-white rounded-lg border border-gray-200">
              {loading ? (
                <div className="p-8">
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon={<MessageSquare className="h-16 w-16 text-gray-400" />}
                    title="No messages found"
                    description="You don't have any messages in your inbox."
                    action={
                      <Button onClick={() => setActiveTab('compose')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Compose Message
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.message_id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${
                        !message.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedMessage(message)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedMessages.has(message.message_id)}
                            onChange={() => handleSelectMessage(message.message_id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className={`text-sm font-medium ${
                                !message.read ? 'text-gray-900' : 'text-gray-600'
                              }`}>
                                {message.subject}
                              </h3>
                              {!message.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate mt-1">
                              {message.body.substring(0, 100)}...
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-gray-400">
                                From: Customer #{message.sender_id}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDate(message.created_timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!message.read && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(message.message_id);
                              }}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark Read
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle reply
                            }}
                          >
                            <Reply className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sent' && (
          <div className="space-y-6">
            {/* Sent Messages List */}
            <div className="bg-white rounded-lg border border-gray-200">
              {sentMessages.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon={<Send className="h-16 w-16 text-gray-400" />}
                    title="No sent messages"
                    description="You haven't sent any messages yet."
                    action={
                      <Button onClick={() => setActiveTab('compose')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Compose Message
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {sentMessages.map((message) => (
                    <div key={message.message_id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {message.subject}
                          </h3>
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {message.body.substring(0, 100)}...
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-gray-400">
                              To: Customer #{message.recipient_id}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDate(message.created_timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-6">
            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {template.name}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      template.type === 'welcome' ? 'bg-green-100 text-green-800' :
                      template.type === 'order_update' ? 'bg-blue-100 text-blue-800' :
                      template.type === 'support' ? 'bg-purple-100 text-purple-800' :
                      template.type === 'promotional' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {template.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {template.subject}
                  </p>
                  <p className="text-xs text-gray-500 mb-4 line-clamp-3">
                    {template.content.substring(0, 150)}...
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                      {template.variables.length} variables
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                    >
                      Use Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'compose' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                Compose Message
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient (Customer ID)
                  </label>
                  <Input
                    value={composeData.recipient}
                    onChange={(e) => setComposeData(prev => ({ ...prev, recipient: e.target.value }))}
                    placeholder="Enter customer ID or email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <Input
                    value={composeData.subject}
                    onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Message subject"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Body
                  </label>
                  <Textarea
                    value={composeData.body}
                    onChange={(e) => setComposeData(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Type your message here..."
                    rows={8}
                  />
                </div>

                {selectedTemplate && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      Using template: <strong>{selectedTemplate.name}</strong>
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTemplate(null);
                        setComposeData(prev => ({
                          ...prev,
                          subject: '',
                          body: '',
                          templateId: ''
                        }));
                      }}
                      className="mt-2"
                    >
                      Clear Template
                    </Button>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('templates')}
                  >
                    Browse Templates
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={sending}
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message Detail Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedMessage.subject}
                </h3>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>From: Customer #{selectedMessage.sender_id}</span>
                    <span>Date: {formatDate(selectedMessage.created_timestamp)}</span>
                    {selectedMessage.listing_id && (
                      <span>Listing: #{selectedMessage.listing_id}</span>
                    )}
                  </div>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap text-gray-900">
                      {selectedMessage.body}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setSelectedMessage(null)}
                >
                  Close
                </Button>
                <Button>
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <TopRightToast />
    </DashboardLayout>
  );
}
