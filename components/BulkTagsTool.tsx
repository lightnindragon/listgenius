/**
 * Bulk Tag Editor Tool Component
 */

'use client';

import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { TopRightToast, emitTopRightToast } from './TopRightToast';
import { getBaseUrl } from '@/lib/utils';
import { 
  Edit, 
  Plus, 
  Minus, 
  RotateCcw, 
  Search, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Tags,
  BarChart3,
  Target,
  Zap,
  Eye,
  Trash2
} from 'lucide-react';

interface TagOperation {
  type: 'replace' | 'add' | 'remove' | 'reorder';
  description: string;
}

interface BulkOperation {
  id: string;
  operation: TagOperation;
  listings: string[];
  currentTags: string[];
  newTags: string[];
  preview: {
    affected: number;
    unchanged: number;
    errors: string[];
  };
}

interface BulkTagsResult {
  operation: BulkOperation;
  success: boolean;
  processed: number;
  errors: string[];
  recommendations: string[];
  executedAt: string;
}

interface BulkTagsToolProps {
  className?: string;
}

export const BulkTagsTool: React.FC<BulkTagsToolProps> = ({ className = '' }) => {
  const [operationType, setOperationType] = useState<'replace' | 'add' | 'remove' | 'reorder'>('replace');
  const [searchTerm, setSearchTerm] = useState('');
  const [newTags, setNewTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<BulkOperation | null>(null);
  const [result, setResult] = useState<BulkTagsResult | null>(null);
  const [activeStep, setActiveStep] = useState<'setup' | 'preview' | 'execute' | 'complete'>('setup');

  const handlePreview = async () => {
    if (!searchTerm.trim() || !newTags.trim()) {
      emitTopRightToast('Please enter search terms and new tags', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/tools/bulk-tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: operationType,
          searchTerm,
          newTags: newTags.split(',').map(tag => tag.trim()).filter(tag => tag),
          preview: true
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPreview(data.data);
        setActiveStep('preview');
        emitTopRightToast('Preview generated successfully!', 'success');
      } else {
        emitTopRightToast(data.error || 'Failed to generate preview', 'error');
      }
    } catch (error) {
      console.error('Preview error:', error);
      emitTopRightToast('An error occurred while generating preview', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!preview) return;

    setLoading(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/tools/bulk-tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: operationType,
          searchTerm,
          newTags: newTags.split(',').map(tag => tag.trim()).filter(tag => tag),
          preview: false
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data.data);
        setActiveStep('complete');
        emitTopRightToast('Bulk operation completed!', 'success');
      } else {
        emitTopRightToast(data.error || 'Failed to execute bulk operation', 'error');
      }
    } catch (error) {
      console.error('Execution error:', error);
      emitTopRightToast('An error occurred during execution', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetTool = () => {
    setSearchTerm('');
    setNewTags('');
    setPreview(null);
    setResult(null);
    setActiveStep('setup');
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'replace': return <RotateCcw className="h-4 w-4" />;
      case 'add': return <Plus className="h-4 w-4" />;
      case 'remove': return <Minus className="h-4 w-4" />;
      case 'reorder': return <Edit className="h-4 w-4" />;
      default: return <Edit className="h-4 w-4" />;
    }
  };

  const getOperationColor = (type: string) => {
    switch (type) {
      case 'replace': return 'bg-blue-100 text-blue-700';
      case 'add': return 'bg-green-100 text-green-700';
      case 'remove': return 'bg-red-100 text-red-700';
      case 'reorder': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Tag Editor</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Manage tags across multiple listings with powerful bulk operations and smart suggestions.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          {[
            { id: 'setup', name: 'Setup', icon: Edit },
            { id: 'preview', name: 'Preview', icon: Eye },
            { id: 'execute', name: 'Execute', icon: Zap },
            { id: 'complete', name: 'Complete', icon: CheckCircle }
          ].map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                activeStep === step.id
                  ? 'bg-blue-600 text-white'
                  : ['setup', 'preview', 'execute', 'complete'].indexOf(activeStep) > ['setup', 'preview', 'execute', 'complete'].indexOf(step.id)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                <step.icon className="h-4 w-4" />
              </div>
              <span className={`ml-2 text-sm font-medium ${
                activeStep === step.id ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {step.name}
              </span>
              {index < 3 && (
                <div className={`w-8 h-0.5 mx-4 ${
                  ['setup', 'preview', 'execute', 'complete'].indexOf(activeStep) > ['setup', 'preview', 'execute', 'complete'].indexOf(step.id)
                    ? 'bg-green-600'
                    : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Setup Step */}
      {activeStep === 'setup' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Operation Setup</h2>
          
          <div className="space-y-4">
            {/* Operation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operation Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { type: 'replace', label: 'Replace All', description: 'Replace all tags' },
                  { type: 'add', label: 'Add Tags', description: 'Add new tags' },
                  { type: 'remove', label: 'Remove Tags', description: 'Remove specific tags' },
                  { type: 'reorder', label: 'Reorder', description: 'Reorder existing tags' }
                ].map((op) => (
                  <button
                    key={op.type}
                    onClick={() => setOperationType(op.type as any)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      operationType === op.type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      {getOperationIcon(op.type)}
                      <span className="ml-2 font-medium text-sm">{op.label}</span>
                    </div>
                    <p className="text-xs text-gray-600">{op.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Term */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search for listings containing:
              </label>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g., jewelry, handmade, vintage"
                className="w-full"
              />
            </div>

            {/* New Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {operationType === 'remove' ? 'Tags to remove:' : 'New tags:'}
              </label>
              <Input
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="e.g., handmade, vintage, gift, jewelry (comma-separated)"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate multiple tags with commas. Maximum 13 tags per listing.
              </p>
            </div>

            <Button
              onClick={handlePreview}
              disabled={loading || !searchTerm.trim() || !newTags.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating Preview...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Generate Preview
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Preview Step */}
      {activeStep === 'preview' && preview && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Operation Preview</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOperationColor(operationType)}`}>
                {getOperationIcon(operationType)}
                <span className="ml-1 capitalize">{operationType}</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{preview.preview.affected}</div>
                <div className="text-sm text-gray-600">Will be affected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{preview.preview.unchanged}</div>
                <div className="text-sm text-gray-600">Unchanged</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{preview.preview.errors.length}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>

            {preview.preview.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-red-900 mb-2">Errors Found:</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {preview.preview.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Button onClick={() => setActiveStep('setup')} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Back to Setup
                </Button>
                <Button onClick={handleExecute} disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Execute Operation
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Step */}
      {activeStep === 'complete' && result && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Operation Complete!</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.processed}</div>
                <div className="text-sm text-gray-600">Listings processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{result.errors.length}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-red-900 mb-2">Errors:</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.recommendations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Recommendations:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  {result.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="flex space-x-4">
              <Button onClick={resetTool} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Operation
              </Button>
              <Button onClick={() => window.print()}>
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>Executed: {result?.executedAt || 'Never'}</p>
      </div>
    </div>
  );
};

