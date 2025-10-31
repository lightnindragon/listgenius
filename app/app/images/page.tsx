'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Container } from '@/components/ui/Container';
import { ImageUploader } from '@/components/ImageUploader';
import { SavedImages } from '@/components/SavedImages';
import { Info } from 'lucide-react';

export default function ImagesPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <DashboardLayout>
      <Container className="py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Image Uploader</h1>
            <p className="text-gray-600">
              Upload images with AI-generated SEO-friendly filenames and alt text
            </p>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">About Etsy Alt Text</h3>
              <p className="text-sm text-blue-800">
                To add alt text to your Etsy images: Open your listing editor → Click on a photo → 
                Click "Alt text" → Paste the generated alt text manually. This helps improve your SEO 
                and makes your listings more accessible.
              </p>
            </div>
          </div>

          {/* Upload Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Upload Images</h2>
            <ImageUploader onUploadSuccess={handleUploadSuccess} />
          </section>

          {/* Saved Images Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Saved Images</h2>
            <SavedImages key={refreshKey} onRefresh={() => setRefreshKey(prev => prev + 1)} />
          </section>
        </div>
      </Container>
    </DashboardLayout>
  );
}

