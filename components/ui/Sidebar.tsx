'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { isEnabled } from '@/lib/flags';
import { useUser } from '@clerk/nextjs';
import { getUserPlanSimple } from '@/lib/entitlements';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { navigationCategories, bottomNavigation, NavigationItem, NavigationCategory } from '@/lib/navigation';
import { useUserMetadata } from '@/contexts/UserMetadataContext';

interface SidebarProps {
  className?: string;
  onCreateListingClick?: () => void;
}


export const Sidebar: React.FC<SidebarProps> = ({ className, onCreateListingClick }) => {
  const pathname = usePathname();
  const { user } = useUser();
  const { userMetadata } = useUserMetadata();
  
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navigationCategories.forEach(category => {
      initial[category.name] = category.defaultOpen || false;
    });
    return initial;
  });

  // Get user plan from UserMetadataContext
  const userPlan = userMetadata?.plan || 'free';
  console.log('Sidebar: Current userPlan:', userPlan, 'userMetadata:', userMetadata);

  // Filter navigation items based on feature flags
  const getFilteredNavigationCategories = () => {
    // Debug: Check raw environment variables
    console.log('Raw env vars:', {
      NEXT_PUBLIC_ENABLE_MY_LISTINGS: process.env.NEXT_PUBLIC_ENABLE_MY_LISTINGS,
      NEXT_PUBLIC_ENABLE_KEYWORDS: process.env.NEXT_PUBLIC_ENABLE_KEYWORDS,
      NEXT_PUBLIC_ENABLE_KEYWORD_RANKING: process.env.NEXT_PUBLIC_ENABLE_KEYWORD_RANKING,
      NEXT_PUBLIC_ENABLE_FINANCES: process.env.NEXT_PUBLIC_ENABLE_FINANCES,
      NEXT_PUBLIC_ENABLE_PINTEREST: process.env.NEXT_PUBLIC_ENABLE_PINTEREST,
      NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
      NEXT_PUBLIC_ENABLE_GA4_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_GA4_ANALYTICS,
      NEXT_PUBLIC_ENABLE_COMMUNICATION: process.env.NEXT_PUBLIC_ENABLE_COMMUNICATION,
      NEXT_PUBLIC_ENABLE_INVENTORY: process.env.NEXT_PUBLIC_ENABLE_INVENTORY,
      NEXT_PUBLIC_ENABLE_TOOLS: process.env.NEXT_PUBLIC_ENABLE_TOOLS,
      NEXT_PUBLIC_ENABLE_TEMPLATES: process.env.NEXT_PUBLIC_ENABLE_TEMPLATES,
      NEXT_PUBLIC_ENABLE_DRAFTS: process.env.NEXT_PUBLIC_ENABLE_DRAFTS,
      NEXT_PUBLIC_ENABLE_ETSY: process.env.NEXT_PUBLIC_ENABLE_ETSY,
    });
    
    console.log('Feature flags:', {
      myListings: isEnabled('myListings'),
      keywords: isEnabled('keywords'),
      keywordRanking: isEnabled('keywordRanking'),
      finances: isEnabled('finances'),
      pinterest: isEnabled('pinterest'),
      analytics: isEnabled('analytics'),
      ga4Analytics: isEnabled('ga4Analytics'),
      communication: isEnabled('communication'),
      inventory: isEnabled('inventory'),
      tools: isEnabled('tools'),
      templates: isEnabled('templates'),
      drafts: isEnabled('drafts'),
      etsy: isEnabled('etsy'),
    });
    
    const filtered = navigationCategories.map(category => ({
      ...category,
      items: category.items.filter(item => {
        // Check feature flag if present
        if (item.featureFlag) {
          const enabled = isEnabled(item.featureFlag as any);
          console.log(`Item ${item.name} (${item.featureFlag}): ${enabled ? 'enabled' : 'disabled'}`);
          if (!enabled) return false;
        }
        
        // Check plan requirement if present
        if (item.planRequired) {
          const hasRequiredPlan = (item.planRequired === 'pro' && (userPlan === 'pro' || userPlan === 'business')) ||
                                 (item.planRequired === 'business' && userPlan === 'business');
          console.log(`Item ${item.name} (plan: ${item.planRequired}): user has ${userPlan}, required: ${hasRequiredPlan ? 'yes' : 'no'}`);
          if (!hasRequiredPlan) return false;
        }
        
        return true;
      })
    })).filter(category => category.items.length > 0); // Remove categories with no visible items
    
    console.log('Filtered categories:', filtered.map(c => ({ 
      name: c.name, 
      itemCount: c.items.length,
      items: c.items.map(i => i.name)
    })));
    return filtered;
  };

  const toggleCategory = (categoryName: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const renderNavigationItem = (item: NavigationItem) => {
    const isActive = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));
    
    if (item.isModal) {
      return (
        <button
          key={item.name}
          onClick={() => {
            console.log('Create Listing button clicked in sidebar');
            if (onCreateListingClick) {
              onCreateListingClick();
            } else {
              console.error('onCreateListingClick is not defined');
            }
          }}
          className={cn(
            'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left',
            'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <item.icon className="h-5 w-5" />
          <span>{item.name}</span>
        </button>
      );
    }
    
    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        )}
      >
        <item.icon className="h-5 w-5" />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <div className={cn('flex flex-col h-full bg-white border-r border-gray-200', className)}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/app" className="flex items-center">
          <span className="text-xl font-bold text-primary">ListGenius</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {getFilteredNavigationCategories().map((category) => (
          <div key={category.name} className="space-y-1">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.name)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <category.icon className="h-5 w-5" />
                <span>{category.name}</span>
              </div>
              {openCategories[category.name] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {/* Category Items */}
            {openCategories[category.name] && (
              <div className="ml-6 space-y-1">
                {category.items.map(renderNavigationItem)}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-4 py-6 border-t border-gray-200 space-y-2">
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
