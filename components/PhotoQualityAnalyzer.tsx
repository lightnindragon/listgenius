/**
 * Photo Quality Analyzer Component
 */

'use client';

import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Loader2, Camera, Lightbulb, Palette, Layout, Eye, Zap, Target, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { emitTopRightToast } from './TopRightToast';
import { getBaseUrl } from '@/lib/utils';

interface PhotoQualityAnalysis {
  overallScore: number;
  lighting: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  background: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  composition: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  productVisibility: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  technicalQuality: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  ecommerceOptimization: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  specificRecommendations: string[];
  priorityActions: string[];
  estimatedImpact: 'low' | 'medium' | 'high';
}

interface PhotoQualityAnalyzerProps {
  imageUrl: string;
  productDescription?: string;
  onAnalysisComplete?: (analysis: PhotoQualityAnalysis) => void;
  className?: string;
}

export const PhotoQualityAnalyzer: React.FC<PhotoQualityAnalyzerProps> = ({
  imageUrl,
  productDescription,
  onAnalysisComplete,
  className = '',
}) => {
  const [analysis, setAnalysis] = useState<PhotoQualityAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const analyzePhoto = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/analyze-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          imageUrl,
          productDescription,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setAnalysis(result.data.analysis);
        onAnalysisComplete?.(result.data.analysis);
        emitTopRightToast('Photo analysis completed!', 'success');
      } else {
        emitTopRightToast(result.error || 'Analysis failed', 'error');
      }
    } catch (error) {
      console.error('Photo analysis error:', error);
      emitTopRightToast('Analysis failed', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return AlertCircle;
    return AlertCircle;
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'lighting': return Lightbulb;
      case 'background': return Palette;
      case 'composition': return Layout;
      case 'productVisibility': return Eye;
      case 'technicalQuality': return Camera;
      case 'ecommerceOptimization': return Target;
      default: return Zap;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Analysis Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Photo Quality Analysis</h3>
          <p className="text-sm text-gray-600">AI-powered analysis using GPT-4o Vision</p>
        </div>
        <Button
          onClick={analyzePhoto}
          disabled={isAnalyzing}
          className="flex items-center"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              Analyze Photo
            </>
          )}
        </Button>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-semibold text-gray-900">Overall Quality Score</h4>
              <div className={`px-4 py-2 rounded-full border font-bold text-lg ${getScoreColor(analysis.overallScore)}`}>
                {analysis.overallScore}/100
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{analysis.overallScore}</div>
                <div className="text-sm text-gray-600">Quality Score</div>
              </div>
              <div className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getImpactColor(analysis.estimatedImpact)}`}>
                  {analysis.estimatedImpact.toUpperCase()} Impact
                </div>
                <div className="text-sm text-gray-600 mt-1">Sales Impact</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{analysis.priorityActions.length}</div>
                <div className="text-sm text-gray-600">Priority Actions</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  analysis.overallScore >= 80 ? 'bg-green-500' :
                  analysis.overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${analysis.overallScore}%` }}
              />
            </div>
          </div>

          {/* Category Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analysis).map(([key, value]) => {
              if (key === 'overallScore' || key === 'specificRecommendations' || key === 'priorityActions' || key === 'estimatedImpact') {
                return null;
              }

              const category = value as any;
              const IconComponent = getCategoryIcon(key);
              
              return (
                <div key={key} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <IconComponent className="h-5 w-5 text-gray-600 mr-2" />
                      <h5 className="font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h5>
                    </div>
                    <div className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(category.score)}`}>
                      {category.score}/100
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        category.score >= 80 ? 'bg-green-500' :
                        category.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${category.score}%` }}
                    />
                  </div>

                  {category.issues.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-red-600">Issues:</div>
                      {category.issues.slice(0, 2).map((issue: string, index: number) => (
                        <div key={index} className="text-xs text-red-600">• {issue}</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Priority Actions */}
          {analysis.priorityActions.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Priority Actions
              </h4>
              <div className="space-y-2">
                {analysis.priorityActions.map((action, index) => (
                  <div key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </span>
                    <span className="text-red-800">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specific Recommendations */}
          {analysis.specificRecommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-blue-900 mb-3">Specific Recommendations</h4>
              <div className="space-y-2">
                {analysis.specificRecommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </span>
                    <span className="text-blue-800">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Toggle Details */}
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {showDetails ? 'Hide Details' : 'Show Detailed Analysis'}
          </Button>

          {/* Detailed Analysis */}
          {showDetails && (
            <div className="space-y-4">
              {Object.entries(analysis).map(([key, value]) => {
                if (key === 'overallScore' || key === 'specificRecommendations' || key === 'priorityActions' || key === 'estimatedImpact') {
                  return null;
                }

                const category = value as any;
                const IconComponent = getCategoryIcon(key);
                
                return (
                  <div key={key} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <IconComponent className="h-5 w-5 text-gray-600 mr-2" />
                      <h5 className="font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h5>
                    </div>

                    <div className="space-y-3">
                      {category.issues.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-red-600 mb-2">Issues Found:</div>
                          <ul className="space-y-1">
                            {category.issues.map((issue: string, index: number) => (
                              <li key={index} className="text-sm text-red-600">• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {category.suggestions.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-green-600 mb-2">Improvement Suggestions:</div>
                          <ul className="space-y-1">
                            {category.suggestions.map((suggestion: string, index: number) => (
                              <li key={index} className="text-sm text-green-600">• {suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};