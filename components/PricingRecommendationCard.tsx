'use client';

import React from 'react';
import { Button } from './ui/Button';
import { PricingRecommendation } from '@/lib/smart-pricing';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  Users, 
  Lightbulb,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface PricingRecommendationCardProps {
  recommendation: PricingRecommendation;
  currentPrice: number;
  listingTitle: string;
  onApplyPrice?: (price: number) => void;
  onViewAlternatives?: () => void;
  loading?: boolean;
  className?: string;
}

export const PricingRecommendationCard: React.FC<PricingRecommendationCardProps> = ({
  recommendation,
  currentPrice,
  listingTitle,
  onApplyPrice,
  onViewAlternatives,
  loading = false,
  className = ''
}) => {
  const priceChange = ((recommendation.recommendedPrice - currentPrice) / currentPrice) * 100;
  const isIncrease = priceChange > 0;
  const isDecrease = priceChange < 0;
  const isSignificant = Math.abs(priceChange) > 5;

  const getPriceChangeColor = () => {
    if (isIncrease && isSignificant) return 'text-green-600 bg-green-50';
    if (isDecrease && isSignificant) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getConfidenceColor = () => {
    if (recommendation.confidence >= 80) return 'text-green-600 bg-green-100';
    if (recommendation.confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getImpactIcon = () => {
    if (recommendation.expectedConversionChange > 10) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (recommendation.expectedConversionChange < -5) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Target className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Pricing Recommendation
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {listingTitle}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor()}`}>
          {recommendation.confidence}% confidence
        </div>
      </div>

      {/* Price Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-1">Current Price</div>
          <div className="text-2xl font-bold text-gray-900">
            ${currentPrice.toFixed(2)}
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-blue-700 mb-1">Recommended Price</div>
          <div className={`text-2xl font-bold ${isIncrease ? 'text-green-600' : isDecrease ? 'text-red-600' : 'text-blue-900'}`}>
            ${recommendation.recommendedPrice.toFixed(2)}
          </div>
          <div className={`text-xs mt-1 ${isIncrease ? 'text-green-600' : isDecrease ? 'text-red-600' : 'text-gray-600'}`}>
            {isIncrease ? '+' : ''}{priceChange.toFixed(1)}% change
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            {getImpactIcon()}
          </div>
          <div className="text-sm font-medium text-gray-700">Conversion</div>
          <div className={`text-lg font-bold ${recommendation.expectedConversionChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {recommendation.expectedConversionChange >= 0 ? '+' : ''}{recommendation.expectedConversionChange.toFixed(1)}%
          </div>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <DollarSign className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-sm font-medium text-gray-700">Profit Impact</div>
          <div className={`text-lg font-bold ${recommendation.expectedProfitChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {recommendation.expectedProfitChange >= 0 ? '+' : ''}{recommendation.expectedProfitChange.toFixed(1)}%
          </div>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-sm font-medium text-gray-700">Competitor Price</div>
          <div className="text-lg font-bold text-purple-600">
            ${recommendation.competitorPrice.toFixed(2)}
          </div>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Lightbulb className="h-4 w-4 text-yellow-600" />
          </div>
          <div className="text-sm font-medium text-gray-700">Psychological Price</div>
          <div className="text-lg font-bold text-yellow-600">
            ${recommendation.psychologicalPrice.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Reasoning */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
          <Lightbulb className="h-4 w-4 mr-2 text-yellow-600" />
          AI Reasoning
        </h4>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            {recommendation.reasoning}
          </p>
        </div>
      </div>

      {/* Alternative Prices */}
      {recommendation.alternatives && recommendation.alternatives.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Alternative Prices</h4>
          <div className="space-y-2">
            {recommendation.alternatives.slice(0, 3).map((alternative, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    ${alternative.price.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {alternative.reason}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {alternative.expectedImpact}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriceChangeColor()}`}>
            {isIncrease ? 'Price Increase' : isDecrease ? 'Price Decrease' : 'Price Adjustment'}
          </div>
          {isSignificant && (
            <div className="flex items-center text-xs text-gray-500">
              {isIncrease ? (
                <AlertTriangle className="h-3 w-3 mr-1 text-yellow-500" />
              ) : (
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              )}
              {isIncrease ? 'Significant increase' : 'Significant decrease'}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {onViewAlternatives && (
            <Button
              onClick={onViewAlternatives}
              variant="outline"
              size="sm"
            >
              View All Options
            </Button>
          )}
          {onApplyPrice && (
            <Button
              onClick={() => onApplyPrice(recommendation.recommendedPrice)}
              disabled={loading}
              size="sm"
            >
              {loading ? 'Applying...' : 'Apply Price'}
            </Button>
          )}
        </div>
      </div>

      {/* Confidence Indicators */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              recommendation.confidence >= 80 ? 'bg-green-500' :
              recommendation.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            {recommendation.confidence >= 80 ? 'High confidence' :
             recommendation.confidence >= 60 ? 'Medium confidence' : 'Low confidence'}
          </div>
          <div>
            Based on competitor analysis & AI insights
          </div>
        </div>
      </div>
    </div>
  );
};
