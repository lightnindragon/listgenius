'use client';

import React, { useState, useEffect } from 'react';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { BarChart3, Users, TrendingUp, MousePointer } from 'lucide-react';

interface AnalyticsDashboardProps {
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className }) => {
  const analytics = useAnalytics();
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false);

  useEffect(() => {
    setIsTrackingEnabled(analytics.isInitialized);
  }, [analytics.isInitialized]);

  const handleTestEvent = () => {
    analytics.trackEngagement('test_button_clicked', 'analytics_dashboard');
  };

  const handleTestError = () => {
    analytics.trackError('Test error from analytics dashboard', 'test');
  };

  const handleTestFeatureUsage = () => {
    analytics.trackFeatureUsage('analytics_dashboard', 'pro');
  };

  if (!isTrackingEnabled) {
    return (
      <Container className={className}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-yellow-600" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Analytics Not Initialized</h3>
              <p className="text-yellow-700">
                Google Analytics 4 is not initialized. Please check your GA4_MEASUREMENT_ID environment variable.
              </p>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className={className}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
            <p className="text-gray-600">Track user behavior and engagement</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">GA4 Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">User Engagement</h3>
                <p className="text-gray-600">Track user interactions</p>
              </div>
            </div>
            <Button 
              onClick={handleTestEvent}
              className="mt-4 w-full"
              variant="outline"
            >
              Test Engagement Event
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Feature Usage</h3>
                <p className="text-gray-600">Monitor feature adoption</p>
              </div>
            </div>
            <Button 
              onClick={handleTestFeatureUsage}
              className="mt-4 w-full"
              variant="outline"
            >
              Test Feature Usage
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <MousePointer className="h-8 w-8 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Error Tracking</h3>
                <p className="text-gray-600">Monitor application errors</p>
              </div>
            </div>
            <Button 
              onClick={handleTestError}
              className="mt-4 w-full"
              variant="outline"
            >
              Test Error Event
            </Button>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Events</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Page Views:</span>
              <span className="font-mono">Automatic</span>
            </div>
            <div className="flex justify-between">
              <span>Listing Generation:</span>
              <span className="font-mono">Tracked</span>
            </div>
            <div className="flex justify-between">
              <span>Plan Upgrades:</span>
              <span className="font-mono">Tracked</span>
            </div>
            <div className="flex justify-between">
              <span>Feature Usage:</span>
              <span className="font-mono">Tracked</span>
            </div>
            <div className="flex justify-between">
              <span>Error Tracking:</span>
              <span className="font-mono">Tracked</span>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};
