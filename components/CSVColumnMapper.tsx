'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { X, Check } from 'lucide-react';
import { ColumnMapping, getAvailableHeaders } from '@/lib/csv-parser';

interface CSVColumnMapperProps {
  headers: string[];
  onMappingComplete: (mapping: ColumnMapping) => void;
  onCancel: () => void;
}

const FIELD_LABELS = {
  productName: 'Product Name (Required)',
  niche: 'Niche (Optional)',
  audience: 'Target Audience (Optional)',
  keywords: 'Keywords (Required)',
  tone: 'Tone (Optional)',
  wordCount: 'Word Count (Optional)',
  pinterestCaption: 'Pinterest Caption (Optional)',
  etsyMessage: 'Etsy Message (Optional)'
};

const FIELD_DESCRIPTIONS = {
  productName: 'The name of your product',
  niche: 'Product category (e.g., Wedding Planning, Digital Art)',
  audience: 'Who this product is for (e.g., Brides-to-be, Small business owners)',
  keywords: 'Comma-separated keywords for SEO',
  tone: 'Writing style (Professional, Friendly, Creative, etc.)',
  wordCount: 'Number of words for description (200-600)',
  pinterestCaption: 'Whether to generate Pinterest caption (true/false)',
  etsyMessage: 'Whether to generate Etsy thank you message (true/false)'
};

export default function CSVColumnMapper({ headers, onMappingComplete, onCancel }: CSVColumnMapperProps) {
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({
    productName: '',
    keywords: ''
  });

  const availableHeaders = getAvailableHeaders(headers);

  const handleMappingChange = (field: keyof ColumnMapping, header: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: header
    }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!mapping.productName || !mapping.keywords) {
      alert('Product Name and Keywords are required fields');
      return;
    }

    onMappingComplete(mapping as ColumnMapping);
  };

  const isRequired = (field: keyof ColumnMapping): boolean => {
    return field === 'productName' || field === 'keywords';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Map CSV Columns</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Map your CSV columns to the generator fields. Required fields are marked with an asterisk (*).
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">Available CSV Columns:</h3>
              <div className="flex flex-wrap gap-2">
                {availableHeaders.map(header => (
                  <span key={header} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {header}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(FIELD_LABELS).map(([field, label]) => (
              <div key={field} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    {label}
                    {isRequired(field as keyof ColumnMapping) && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  {mapping[field as keyof ColumnMapping] && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </div>
                
                <p className="text-xs text-gray-500 mb-3">
                  {FIELD_DESCRIPTIONS[field as keyof typeof FIELD_DESCRIPTIONS]}
                </p>

                <select
                  value={mapping[field as keyof ColumnMapping] || ''}
                  onChange={(e) => handleMappingChange(field as keyof ColumnMapping, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                >
                  <option value="">Select a column...</option>
                  {availableHeaders.map(header => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!mapping.productName || !mapping.keywords}
            >
              Continue
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
