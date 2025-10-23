'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Crown, Lock, Zap } from 'lucide-react';

interface PlanGateProps {
  feature: string;
  currentPlan: string;
  requiredPlan: string;
  className?: string;
}

const PlanGate: React.FC<PlanGateProps> = ({
  feature,
  currentPlan,
  requiredPlan,
  className
}) => {
  const getPlanInfo = (plan: string) => {
    switch (plan) {
      case 'pro':
        return { name: 'Pro', price: `$${process.env.PRO_PRICE_USD || '29'}/mo`, color: 'text-blue-600' };
      case 'business':
        return { name: 'Business', price: `$${process.env.BUSINESS_PRICE_USD || '79'}/mo`, color: 'text-purple-600' };
      default:
        return { name: 'Free', price: '£0', color: 'text-gray-600' };
    }
  };

  const currentPlanInfo = getPlanInfo(currentPlan);
  const requiredPlanInfo = getPlanInfo(requiredPlan);

  return (
    <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-8 ${className}`}>
      <Container size="sm">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full mb-6">
            <Lock className="h-8 w-8 text-brand-600" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {feature} requires {requiredPlanInfo.name}
          </h3>
          
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You're currently on the <span className="font-semibold">{currentPlanInfo.name}</span> plan. 
            Upgrade to <span className={`font-semibold ${requiredPlanInfo.color}`}>{requiredPlanInfo.name}</span> to access this feature.
          </p>

          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-center mb-4">
              <Crown className="h-6 w-6 text-brand-600 mr-2" />
              <span className="text-lg font-semibold text-gray-900">{requiredPlanInfo.name}</span>
            </div>
            <div className="text-3xl font-bold text-brand-600 mb-2">
              {requiredPlanInfo.price}
            </div>
            <p className="text-sm text-gray-600">
              {requiredPlan === 'pro' && 'Unlimited generations, Etsy publishing, tone presets'}
              {requiredPlan === 'business' && 'Everything in Pro + bulk operations (50 items)'}
              {requiredPlan === 'agency' && 'Everything in Business + multi-shop support (200 items)'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/api/stripe/checkout?plan=${requiredPlan}`}>
              <Button size="lg" className="w-full sm:w-auto">
                <Zap className="h-5 w-5 mr-2" />
                Upgrade to {requiredPlanInfo.name}
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View All Plans
              </Button>
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Free 14-day trial • Cancel anytime • No setup fees
          </p>
        </div>
      </Container>
    </div>
  );
};

export { PlanGate };
