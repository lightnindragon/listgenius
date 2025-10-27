'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import CSVColumnMapper from './CSVColumnMapper';
import { CSVRow, ColumnMapping, ValidationError } from '@/lib/csv-parser';

interface BulkUploadData {
  headers: string[];
  rows: CSVRow[];
  totalRows: number;
  columnMapping: ColumnMapping;
  validationErrors: ValidationError[];
}

interface ProgressData {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  currentRow?: number;
  errors: Array<{
    rowNumber: number;
    error: string;
    data?: any;
  }>;
  progress: number;
}

export default function CSVBulkUpload() {
  const [step, setStep] = useState<'upload' | 'preview' | 'processing' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState<BulkUploadData | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [showColumnMapper, setShowColumnMapper] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<{ used: number; limit: number | string; remaining: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/csv/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needsMapping) {
          setShowColumnMapper(true);
          return;
        }
        throw new Error(data.error || 'Upload failed');
      }

      setUploadData(data.data);
      setQuotaInfo(data.data.quotaInfo);
      setStep('preview');
      toast.success(`CSV uploaded successfully! Found ${data.data.totalRows} rows.`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleColumnMappingComplete = async (mapping: ColumnMapping) => {
    setShowColumnMapper(false);
    
    // Re-parse with manual mapping
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file!);
      formData.append('mapping', JSON.stringify(mapping));

      const response = await fetch('/api/csv/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Processing failed');
      }

      setUploadData(data.data);
      setQuotaInfo(data.data.quotaInfo);
      setStep('preview');
      toast.success(`CSV processed successfully! Found ${data.data.totalRows} rows.`);
    } catch (error) {
      console.error('Processing error:', error);
      toast.error(error instanceof Error ? error.message : 'Processing failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRowSelection = (index: number, selected: boolean) => {
    if (selected) {
      setSelectedRows(prev => [...prev, index]);
    } else {
      setSelectedRows(prev => prev.filter(i => i !== index));
    }
  };

  const handleSelectAll = () => {
    if (selectedRows.length === uploadData!.rows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(uploadData!.rows.map((_, index) => index));
    }
  };

  const handleProcess = async () => {
    if (!uploadData) return;

    setLoading(true);
    try {
      const rowsToProcess = selectedRows.length > 0 
        ? uploadData.rows.filter((_, index) => selectedRows.includes(index))
        : uploadData.rows;

      const response = await fetch('/api/csv/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rows: uploadData.rows,
          selectedRows: selectedRows.length > 0 ? selectedRows : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Processing failed');
      }

      setProgress({
        jobId: data.data.jobId,
        status: 'processing',
        totalRows: data.data.totalRows,
        processedRows: 0,
        successfulRows: 0,
        failedRows: 0,
        errors: [],
        progress: 0
      });

      setStep('processing');
      startProgressPolling(data.data.jobId);
      toast.success('Bulk processing started!');
    } catch (error) {
      console.error('Process error:', error);
      toast.error(error instanceof Error ? error.message : 'Processing failed');
    } finally {
      setLoading(false);
    }
  };

  const startProgressPolling = (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/csv/progress/${jobId}`);
        const data = await response.json();

        if (response.ok && data.data) {
          setProgress(data.data);
          
          if (data.data.status === 'completed' || data.data.status === 'failed') {
            clearInterval(pollInterval);
            setStep('complete');
            
            if (data.data.status === 'completed') {
              toast.success(`Bulk processing completed! ${data.data.successfulRows} successful, ${data.data.failedRows} failed.`);
            } else {
              toast.error('Bulk processing failed');
            }
          }
        }
      } catch (error) {
        console.error('Progress polling error:', error);
      }
    }, 2000);
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setUploadData(null);
    setSelectedRows([]);
    setProgress(null);
    setQuotaInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = `Product Name,Niche,Target Audience,Keywords,Tone,Word Count,Pinterest Caption,Etsy Message
Sample Wedding Planner Template,Wedding Planning,Brides-to-be,"wedding planner, digital download, printable",Professional,300,true,false
Custom Logo Design,Graphic Design,Small business owners,"logo design, branding, custom",Creative,400,false,true`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'listgenius-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CSV Bulk Upload</h1>
        <p className="text-gray-600">
          Upload a CSV file to generate multiple listings at once. Each row will count toward your monthly generation quota.
        </p>
      </div>

      {quotaInfo && (
        <Card className="mb-6 p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Generation Quota</h3>
              <p className="text-sm text-blue-700">
                Used: {quotaInfo.used} / {quotaInfo.limit === 'unlimited' ? '1000' : quotaInfo.limit} | 
                Remaining: {quotaInfo.remaining}
              </p>
            </div>
          </div>
        </Card>
      )}

      {step === 'upload' && (
        <Card className="p-8">
          <div className="text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload CSV File</h2>
            <p className="text-gray-600 mb-6">
              Select a CSV file with your product data. Download our template to get started.
            </p>

            <div className="flex justify-center gap-4 mb-6">
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mb-4"
              >
                <FileText className="h-4 w-4 mr-2" />
                Choose CSV File
              </Button>
              {file && (
                <div className="text-sm text-gray-600">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || loading}
              loading={loading}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Upload & Process'}
            </Button>
          </div>
        </Card>
      )}

      {step === 'preview' && uploadData && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Preview Data</h2>
            <Button variant="outline" onClick={reset}>
              Upload New File
            </Button>
          </div>

          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Rows:</span> {uploadData.totalRows}
              </div>
              <div>
                <span className="font-medium">Validation Errors:</span> {uploadData.validationErrors.length}
              </div>
            </div>
          </div>

          {uploadData.validationErrors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-2">Validation Errors</h3>
              <div className="space-y-1">
                {uploadData.validationErrors.slice(0, 5).map((error, index) => (
                  <div key={index} className="text-sm text-red-700">
                    Row {error.row}: {error.message}
                  </div>
                ))}
                {uploadData.validationErrors.length > 5 && (
                  <div className="text-sm text-red-600">
                    ... and {uploadData.validationErrors.length - 5} more errors
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Select Rows to Process</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedRows.length === uploadData.rows.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Select</th>
                    <th className="px-3 py-2 text-left">Product Name</th>
                    <th className="px-3 py-2 text-left">Keywords</th>
                    <th className="px-3 py-2 text-left">Tone</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadData.rows.map((row, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(index)}
                          onChange={(e) => handleRowSelection(index, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-3 py-2">{row.productName}</td>
                      <td className="px-3 py-2">{row.keywords.join(', ')}</td>
                      <td className="px-3 py-2">{row.tone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedRows.length > 0 ? `${selectedRows.length} rows selected` : 'All rows will be processed'}
            </div>
            <Button
              onClick={handleProcess}
              disabled={loading}
              loading={loading}
            >
              {loading ? 'Starting...' : 'Start Processing'}
            </Button>
          </div>
        </Card>
      )}

      {step === 'processing' && progress && (
        <Card className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Processing Generations</h2>
            
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              <div className="text-sm text-gray-600">
                {progress.processedRows} of {progress.totalRows} rows processed ({progress.progress}%)
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center mb-6">
              <div>
                <div className="text-2xl font-bold text-green-600">{progress.successfulRows}</div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{progress.failedRows}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{progress.currentRow || 0}</div>
                <div className="text-sm text-gray-600">Current Row</div>
              </div>
            </div>

            {progress.errors.length > 0 && (
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Recent Errors</h3>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {progress.errors.slice(-5).map((error, index) => (
                    <div key={index} className="text-sm text-red-600">
                      Row {error.rowNumber}: {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {step === 'complete' && progress && (
        <Card className="p-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Complete</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{progress.successfulRows}</div>
                <div className="text-sm text-green-700">Successful Generations</div>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{progress.failedRows}</div>
                <div className="text-sm text-red-700">Failed Generations</div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button onClick={reset}>
                Upload Another File
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/app/saved'}>
                View Saved Generations
              </Button>
            </div>
          </div>
        </Card>
      )}

      {showColumnMapper && (
        <CSVColumnMapper
          headers={uploadData?.headers || []}
          onMappingComplete={handleColumnMappingComplete}
          onCancel={() => setShowColumnMapper(false)}
        />
      )}
    </div>
  );
}
