"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

interface CheckoutButtonProps {
  plan: 'pro' | 'business' | 'agency';
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  plan,
  children,
  variant = 'primary',
  size = 'lg',
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          successUrl: `${window.location.origin}/settings?subscription=success`,
          cancelUrl: `${window.location.origin}/pricing?subscription=cancelled`,
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`w-full ${className}`}
      onClick={handleCheckout}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" className="mr-2" />
          Processing...
        </>
      ) : (
        children
      )}
    </Button>
  );
};
