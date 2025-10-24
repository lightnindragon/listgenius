'use client';

import React, { useState, useEffect } from 'react';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { GA4_MEASUREMENT_ID } from '@/lib/analytics';

export const GA4DebugPanel: React.FC = () => {
  const analytics = useAnalytics();
  const [gtagAvailable, setGtagAvailable] = useState(false);
  const [dataLayerAvailable, setDataLayerAvailable] = useState(false);

  useEffect(() => {
    // Check if gtag and dataLayer are available
    const checkGA4Availability = () => {
      if (typeof window !== 'undefined') {
        setGtagAvailable(!!window.gtag);
        setDataLayerAvailable(!!window.dataLayer);
      }
    };

    // Check immediately
    checkGA4Availability();

    // Check again after a delay to allow scripts to load
    const timer = setTimeout(checkGA4Availability, 2000);

    return () => clearTimeout(timer);
  }, []);

  const testEvent = () => {
    analytics.trackEvent('test_event', {
      category: 'debug',
      label: 'manual_test',
      value: 1
    });
    console.log('Test event sent to GA4');
  };

  const testListingGeneration = () => {
    analytics.trackListingGeneration('pro', 200, 'Professional');
    console.log('Test listing generation event sent to GA4');
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show debug panel in production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <h3 className="font-bold text-sm mb-2">GA4 Debug Panel</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Measurement ID:</strong> {GA4_MEASUREMENT_ID || 'Not set'}
        </div>
        
        <div>
          <strong>Analytics Initialized:</strong> 
          <span className={`ml-1 ${analytics.isInitialized ? 'text-green-600' : 'text-red-600'}`}>
            {analytics.isInitialized ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div>
          <strong>gtag Available:</strong> 
          <span className={`ml-1 ${gtagAvailable ? 'text-green-600' : 'text-red-600'}`}>
            {gtagAvailable ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div>
          <strong>dataLayer Available:</strong> 
          <span className={`ml-1 ${dataLayerAvailable ? 'text-green-600' : 'text-red-600'}`}>
            {dataLayerAvailable ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
      
      <div className="mt-3 space-y-1">
        <button
          onClick={testEvent}
          className="w-full bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600"
        >
          Test Event
        </button>
        
        <button
          onClick={testListingGeneration}
          className="w-full bg-green-500 text-white text-xs px-2 py-1 rounded hover:bg-green-600"
        >
          Test Listing Generation
        </button>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        Check browser console for debug messages
      </div>
    </div>
  );
};
