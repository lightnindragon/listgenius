'use client';

import React, { useState } from 'react';
import { Button } from './ui/Button';
import { SEOGrade } from '@/lib/seo-grader';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Target,
  Eye,
  Tag,
  DollarSign,
  MessageSquare,
  Star,
  Edit3,
  Copy,
  ExternalLink
} from 'lucide-react';

interface SEOGradeCardProps {
  grade: SEOGrade;
  listing: {
    id: number;
    title: string;
    description: string;
    tags: string[];
    price: number;
    reviews: { count: number; average: number };
    favorites: number;
    views: number;
  };
  onApplyFix?: (fixType: string) => void;
  className?: string;
}

export const SEOGradeCard: React.FC<SEOGradeCardProps> = ({
  grade,
  listing,
  onApplyFix,
  className = ''
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const getGradeColor = (letterGrade: string) => {
    const letter = letterGrade.charAt(0);
    switch (letter) {
      case 'A': return 'text-green-600 bg-green-100 border-green-200';
      case 'B': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'C': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'D': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'F': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getIssueIcon = (severity: 'critical' | 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'medium': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getIssueColor = (severity: 'critical' | 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'low': return 'text-green-800 bg-green-50 border-green-200';
      case 'medium': return 'text-blue-800 bg-blue-50 border-blue-200';
      case 'high': return 'text-yellow-800 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-800 bg-red-50 border-red-200';
      default: return 'text-gray-800 bg-gray-50 border-gray-200';
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className={`bg-gray-50 rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Overall Grade Summary */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full border-2 ${getGradeColor(grade.overall)}`}>
            <span className="text-xl font-bold">{grade.overall}</span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Overall SEO Grade</h4>
            <p className="text-sm text-gray-600">Score: {grade.score}/100</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Issues Found</div>
          <div className="text-lg font-bold text-gray-900">{grade.issues.length}</div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {Object.entries(grade.breakdown).map(([category, score]) => (
          <div key={category} className="text-center p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-lg font-bold text-gray-900 mb-1">{score.score}</div>
            <div className="text-xs text-gray-600 capitalize">{category.replace('_', ' ')}</div>
          </div>
        ))}
      </div>

      {/* Issues and Recommendations */}
      <div className="space-y-3">
        {grade.issues.map((issue, index) => (
          <div key={index} className={`p-3 rounded-lg border ${getIssueColor(issue.severity)}`}>
            <div className="flex items-start space-x-2">
              {getIssueIcon(issue.severity)}
              <div className="flex-1">
                <h5 className="font-medium mb-1">{issue.issue}</h5>
                <p className="text-sm mb-2">{issue.description}</p>
                {issue.fix && (
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => onApplyFix?.(issue.category)}
                      size="sm"
                      variant="outline"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Fix {issue.category}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Breakdown Sections */}
      <div className="mt-6 space-y-3">
        {/* Title Section */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('title')}
            className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">Title Analysis</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIssueColor(grade.breakdown.title.score >= 80 ? 'low' : grade.breakdown.title.score >= 60 ? 'medium' : 'high')}`}>
                  {grade.breakdown.title.score}/100
              </span>
            </div>
            {expandedSection === 'title' ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          {expandedSection === 'title' && (
            <div className="px-3 pb-3 border-t border-gray-200">
              <div className="mt-3 space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Current Title:</span>
                  <div className="mt-1 p-2 bg-gray-100 rounded text-sm">{listing.title}</div>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Length:</span> {listing.title.length} characters
                </div>
                <div className="text-sm">
                  <span className="font-medium">Keywords:</span> {listing.tags.length} tags included
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Description Section */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('description')}
            className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center space-x-2">
              <Edit3 className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">Description Analysis</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIssueColor(grade.breakdown.description.score >= 80 ? 'low' : grade.breakdown.description.score >= 60 ? 'medium' : 'high')}`}>
                  {grade.breakdown.description.score}/100
              </span>
            </div>
            {expandedSection === 'description' ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          {expandedSection === 'description' && (
            <div className="px-3 pb-3 border-t border-gray-200">
              <div className="mt-3 space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Word Count:</span> {listing.description.split(' ').length} words
                </div>
                <div className="text-sm">
                  <span className="font-medium">Character Count:</span> {listing.description.length} characters
                </div>
                <div className="text-sm">
                  <span className="font-medium">Preview:</span>
                  <div className="mt-1 p-2 bg-gray-100 rounded text-sm max-h-20 overflow-y-auto">
                    {listing.description}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tags Section */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('tags')}
            className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">Tags Analysis</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIssueColor(grade.breakdown.tags.score >= 80 ? 'low' : grade.breakdown.tags.score >= 60 ? 'medium' : 'high')}`}>
                {grade.breakdown.tags.score}/100
              </span>
            </div>
            {expandedSection === 'tags' ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          {expandedSection === 'tags' && (
            <div className="px-3 pb-3 border-t border-gray-200">
              <div className="mt-3 space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Tag Count:</span> {listing.tags.length}/13
                </div>
                <div className="text-sm">
                  <span className="font-medium">Tags:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {listing.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Engagement Section */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('engagement')}
            className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">Engagement Analysis</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIssueColor(grade.breakdown.engagement.score >= 80 ? 'low' : grade.breakdown.engagement.score >= 60 ? 'medium' : 'high')}`}>
                {grade.breakdown.engagement.score}/100
              </span>
            </div>
            {expandedSection === 'engagement' ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          {expandedSection === 'engagement' && (
            <div className="px-3 pb-3 border-t border-gray-200">
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{listing.views}</div>
                  <div className="text-xs text-gray-600">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{listing.favorites}</div>
                  <div className="text-xs text-gray-600">Favorites</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{listing.reviews.count}</div>
                  <div className="text-xs text-gray-600">Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">{listing.reviews.average}</div>
                  <div className="text-xs text-gray-600">Rating</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Lightbulb className="h-4 w-4" />
            <span>{grade.improvements.length} recommendations available</span>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => onApplyFix?.('all')}
              variant="outline"
              size="sm"
            >
              <Copy className="h-4 w-4 mr-2" />
              Apply All Fixes
            </Button>
            <Button
              onClick={() => onApplyFix?.('preview')}
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
