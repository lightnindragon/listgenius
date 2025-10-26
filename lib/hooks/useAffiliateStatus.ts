'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface AffiliateStatus {
  hasApplication: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | null;
  code?: string;
  loading: boolean;
}

export function useAffiliateStatus(): AffiliateStatus {
  const { user } = useUser();
  const [affiliateStatus, setAffiliateStatus] = useState<AffiliateStatus>({
    hasApplication: false,
    status: null,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setAffiliateStatus({
        hasApplication: false,
        status: null,
        loading: false,
      });
      return;
    }

    const checkAffiliateStatus = async () => {
      try {
        const response = await fetch('/api/affiliate/dashboard');
        if (response.ok) {
          const data = await response.json();
          setAffiliateStatus({
            hasApplication: true,
            status: data.affiliate?.status || null,
            code: data.affiliate?.code,
            loading: false,
          });
        } else {
          // No affiliate application found
          setAffiliateStatus({
            hasApplication: false,
            status: null,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Failed to check affiliate status:', error);
        setAffiliateStatus({
          hasApplication: false,
          status: null,
          loading: false,
        });
      }
    };

    checkAffiliateStatus();
  }, [user]);

  return affiliateStatus;
}
