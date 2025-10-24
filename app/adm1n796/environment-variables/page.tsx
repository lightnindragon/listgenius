'use client';

import React, { useState, useEffect } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { TopRightToast, emitTopRightToast } from '@/components/TopRightToast';
import { Save, RefreshCw, AlertCircle, CheckCircle, Settings } from 'lucide-react';

interface EnvironmentVariable {
  key: string;
  description: string;
  type: 'public';
  current: string;
}

interface UpdateRequest {
  key: string;
  value: string;
  environment: 'production' | 'preview' | 'development';
}

export default function EnvironmentVariablesPage() {
  const [variables, setVariables] = useState<EnvironmentVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingVar, setEditingVar] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [environment, setEnvironment] = useState<'production' | 'preview' | 'development'>('production');
  const { toast, toasts, removeToast } = useToast();

  useEffect(() => {
    fetchVariables();
  }, []);

  const fetchVariables = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/adm1n796/environment-variables');
      const data = await response.json();

      if (data.success) {
        setVariables(data.variables);
        // Initialize edit values with current values
        const initialValues: Record<string, string> = {};
        data.variables.forEach((variable: EnvironmentVariable) => {
          initialValues[variable.key] = variable.current === 'Not set' ? '' : variable.current;
        });
        setEditValues(initialValues);
      } else {
        emitTopRightToast('Failed to fetch environment variables', 'error');
      }
    } catch (error) {
      emitTopRightToast('Error fetching environment variables', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (key: string) => {
    setEditingVar(key);
  };

  const handleCancelEdit = (key: string) => {
    setEditingVar(null);
    // Reset to original value
    const variable = variables.find(v => v.key === key);
    if (variable) {
      setEditValues(prev => ({
        ...prev,
        [key]: variable.current === 'Not set' ? '' : variable.current
      }));
    }
  };

  const handleSave = async (key: string) => {
    const value = editValues[key];
    
    if (value === undefined) {
      emitTopRightToast('Invalid value', 'error');
      return;
    }

    try {
      setUpdating(key);
      
      const updateRequest: UpdateRequest = {
        key,
        value,
        environment
      };

      const response = await fetch('/api/adm1n796/environment-variables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateRequest),
      });

      const data = await response.json();

      if (data.success) {
        emitTopRightToast(data.message, 'success');
        setEditingVar(null);
        // Update the current value in the list
        setVariables(prev => prev.map(v => 
          v.key === key 
            ? { ...v, current: value || 'Not set' }
            : v
        ));
      } else {
        emitTopRightToast(data.error || 'Failed to update variable', 'error');
      }
    } catch (error) {
      emitTopRightToast('Error updating environment variable', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const getValueInput = (variable: EnvironmentVariable) => {
    const key = variable.key;
    const isEditing = editingVar === key;
    const currentValue = editValues[key] || '';

    if (!isEditing) {
      return (
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-sm ${
            variable.current === 'Not set' 
              ? 'bg-gray-100 text-gray-600' 
              : 'bg-green-100 text-green-800'
          }`}>
            {variable.current}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(key)}
            disabled={updating === key}
          >
            Edit
          </Button>
        </div>
      );
    }

    if (key === 'NEXT_PUBLIC_GA4_MEASUREMENT_ID') {
      return (
        <div className="flex items-center space-x-2">
          <Input
            value={currentValue}
            onChange={(e) => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
            placeholder="G-XXXXXXXXXX"
            className="w-48"
          />
          <Button
            size="sm"
            onClick={() => handleSave(key)}
            disabled={updating === key}
          >
            {updating === key ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCancelEdit(key)}
            disabled={updating === key}
          >
            Cancel
          </Button>
        </div>
      );
    }

    // Boolean feature flags
    return (
      <div className="flex items-center space-x-2">
        <Select
          value={currentValue}
          onChange={(value) => setEditValues(prev => ({ ...prev, [key]: value }))}
          className="w-24"
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </Select>
        <Button
          size="sm"
          onClick={() => handleSave(key)}
          disabled={updating === key}
        >
          {updating === key ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleCancelEdit(key)}
          disabled={updating === key}
        >
          Cancel
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <AdminAuthGuard>
        <Container>
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
        </Container>
      </AdminAuthGuard>
    );
  }

  return (
    <AdminAuthGuard>
      <Container>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Environment Variables</h1>
              <p className="text-gray-600 mt-2">
                Manage public environment variables for your Vercel deployment
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Environment:</label>
                <Select
                  value={environment}
                  onChange={(value) => setEnvironment(value as any)}
                  className="w-32"
                >
                  <option value="production">Production</option>
                  <option value="preview">Preview</option>
                  <option value="development">Development</option>
                </Select>
              </div>
              <Button
                onClick={fetchVariables}
                variant="outline"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Important Notes</h3>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  <li>• Only public environment variables (NEXT_PUBLIC_*) can be managed here</li>
                  <li>• Changes will take effect on the next deployment</li>
                  <li>• Vercel API credentials must be configured for real updates</li>
                  <li>• Sensitive variables (API keys, secrets) are not shown for security</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {variables.map((variable) => (
              <Card key={variable.key} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {variable.key}
                      </h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {variable.type}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{variable.description}</p>
                  </div>
                  <div className="ml-6">
                    {getValueInput(variable)}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {variables.length === 0 && (
            <Card className="p-8 text-center">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Environment Variables</h3>
              <p className="text-gray-600">
                No manageable environment variables found.
              </p>
            </Card>
          )}
        </div>

        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <TopRightToast />
      </Container>
    </AdminAuthGuard>
  );
}
