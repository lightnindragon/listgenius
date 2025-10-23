'use client';

import React from 'react';
import { CheckCircle, AlertCircle, XCircle, TrendingUp, Target, Lightbulb } from 'lucide-react';
import { calculateListingScore, getScoreColorClass, getScoreBgClass, type ListingScoreBreakdown, type ListingData } from '@/lib/listing-score';

interface ListingScoreDisplayProps {
  listing: ListingData;
  className?: string;
}

export const ListingScoreDisplay: React.FC<ListingScoreDisplayProps> = ({ 
  listing, 
  className = '' 
}) => {
  const scoreData = calculateListingScore(listing);

  const getIcon = (score: number, maxPoints: number) => {
    const percentage = (score / maxPoints) * 100;
    if (percentage >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (percentage >= 60) return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'medium': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'low': return <CheckCircle className="h-5 w-5 text-green-600" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'High Priority - Needs Immediate Attention';
      case 'medium': return 'Medium Priority - Room for Improvement';
      case 'low': return 'Low Priority - Good Performance';
      default: return 'Unknown Priority';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Overall Score Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`rounded-full p-3 ${getScoreBgClass(scoreData.totalScore)}`}>
            <TrendingUp className={`h-6 w-6 ${getScoreColorClass(scoreData.totalScore)}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Listing Quality Score</h3>
            <p className={`text-2xl font-bold ${getScoreColorClass(scoreData.totalScore)}`}>
              {scoreData.totalScore}/100
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getPriorityIcon(scoreData.priority)}
          <span className="text-sm font-medium text-gray-700">
            {getPriorityText(scoreData.priority)}
          </span>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-4 mb-6">
        <h4 className="text-md font-semibold text-gray-900 flex items-center">
          <Target className="h-4 w-4 mr-2" />
          Score Breakdown
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(scoreData.breakdown).map(([key, section]) => {
            const sectionName = key.charAt(0).toUpperCase() + key.slice(1);
            const percentage = Math.round((section.score / section.maxPoints) * 100);
            
            return (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getIcon(section.score, section.maxPoints)}
                    <span className="font-medium text-gray-900">{sectionName}</span>
                  </div>
                  <span className={`text-sm font-semibold ${getScoreColorClass(section.score)}`}>
                    {section.score}/{section.maxPoints}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      percentage >= 80 ? 'bg-green-500' : 
                      percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                
                {section.feedback.length > 0 && (
                  <div className="space-y-1">
                    {section.feedback.map((feedback, index) => (
                      <p key={index} className="text-xs text-gray-600">
                        • {feedback}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      {scoreData.recommendations.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
            <Lightbulb className="h-4 w-4 mr-2" />
            Recommended Actions
          </h4>
          <div className="space-y-2">
            {scoreData.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
                <p className="text-sm text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Legend */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span>Good (80%+)</span>
          </div>
          <div className="flex items-center space-x-1">
            <AlertCircle className="h-3 w-3 text-yellow-600" />
            <span>Fair (60-79%)</span>
          </div>
          <div className="flex items-center space-x-1">
            <XCircle className="h-3 w-3 text-red-600" />
            <span>Needs Work (&lt;60%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingScoreDisplay;
