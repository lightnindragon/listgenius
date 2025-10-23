/**
 * A/B Testing Dashboard Component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { TopRightToast, emitTopRightToast } from './TopRightToast';
import { getBaseUrl } from '@/lib/utils';
import { 
  TestTube, 
  Play, 
  Pause, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  MousePointer,
  ShoppingCart,
  DollarSign,
  Target,
  Plus,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';

interface ABTestVariant {
  name: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  conversionRate: number;
}

interface ABTestResult {
  testId: string;
  name: string;
  status: 'running' | 'completed' | 'paused';
  startDate: string;
  endDate?: string;
  variants: ABTestVariant[];
  winner?: string;
  confidence: number;
  improvement: number;
}

interface CreateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTest: (testData: any) => void;
}

const CreateTestModal: React.FC<CreateTestModalProps> = ({ isOpen, onClose, onCreateTest }) => {
  const [testName, setTestName] = useState('');
  const [description, setDescription] = useState('');
  const [variants, setVariants] = useState([
    { name: 'Control', content: '' },
    { name: 'Variant A', content: '' }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) {
      emitTopRightToast('Test name is required', 'error');
      return;
    }
    onCreateTest({ testName, description, variants });
    setTestName('');
    setDescription('');
    setVariants([{ name: 'Control', content: '' }, { name: 'Variant A', content: '' }]);
    onClose();
  };

  const addVariant = () => {
    setVariants([...variants, { name: `Variant ${String.fromCharCode(65 + variants.length)}`, content: '' }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 2) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create A/B Test</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
            <input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Title Optimization Test"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe what you're testing..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Variants</label>
            {variants.map((variant, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={variant.name}
                  onChange={(e) => {
                    const newVariants = [...variants];
                    newVariants[index].name = e.target.value;
                    setVariants(newVariants);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Variant name"
                />
                <input
                  type="text"
                  value={variant.content}
                  onChange={(e) => {
                    const newVariants = [...variants];
                    newVariants[index].content = e.target.value;
                    setVariants(newVariants);
                  }}
                  className="flex-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Variant content"
                />
                {variants.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Variant</span>
            </button>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Test
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ABTestingDashboard: React.FC = () => {
  const [tests, setTests] = useState<ABTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    loadABTests();
  }, []);

  const loadABTests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getBaseUrl()}/api/analytics/ab-tests`);
      
      if (response.ok) {
        const data = await response.json();
        setTests(data.data.tests || []);
      } else {
        emitTopRightToast('Failed to load A/B tests', 'error');
      }
    } catch (error) {
      console.error('Failed to load A/B tests:', error);
      emitTopRightToast('Failed to load A/B tests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async (testData: any) => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/analytics/ab-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      if (response.ok) {
        emitTopRightToast('A/B test created successfully!', 'success');
        loadABTests();
      } else {
        emitTopRightToast('Failed to create A/B test', 'error');
      }
    } catch (error) {
      console.error('Failed to create A/B test:', error);
      emitTopRightToast('Failed to create A/B test', 'error');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="h-4 w-4 text-green-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <TestTube className="h-8 w-8 mr-3 text-purple-600" />
            A/B Testing
          </h1>
          <p className="text-gray-600 mt-1">
            Test different versions of your listings to optimize performance
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Create Test</span>
        </Button>
      </div>

      {tests.length === 0 ? (
        <div className="text-center py-12">
          <TestTube className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No A/B Tests Yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first A/B test to start optimizing your listings
          </p>
          <Button onClick={() => setCreateModalOpen(true)}>
            Create Your First Test
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <div key={test.testId} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{test.name}</h3>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                    {getStatusIcon(test.status)}
                    <span className="ml-1 capitalize">{test.status}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {test.variants.map((variant, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{variant.name}</span>
                      {test.winner === variant.name && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Target className="h-3 w-3 mr-1" />
                          Winner
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">{variant.impressions.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MousePointer className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">{variant.clicks.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ShoppingCart className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">{variant.conversions.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">${variant.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      CTR: {variant.ctr.toFixed(2)}% | Conv: {variant.conversionRate.toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>

              {test.status === 'completed' && test.winner && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Winner: {test.winner} ({test.improvement}% improvement)
                    </span>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Confidence: {test.confidence}%
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateTestModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreateTest={handleCreateTest}
      />
    </div>
  );
};
