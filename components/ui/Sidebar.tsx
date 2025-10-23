'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { isEnabled } from '@/lib/flags';
import { useUser } from '@clerk/nextjs';
import { getUserPlanSimple } from '@/lib/entitlements';
import { 
  LayoutDashboard, 
  FileText, 
  List, 
  User, 
  Settings, 
  CreditCard,
  BarChart3,
  Plus,
  Search,
  TrendingUp,
  Users,
  Compass,
  Tags,
  Activity,
  Edit,
  Zap,
  MessageSquare,
  MessageCircle,
  Target,
  DollarSign,
  Globe,
  Award,
  Save,
  Scale,
  Video,
  Package,
  Package2,
  Mail,
  Printer,
  Receipt,
  ChevronDown,
  ChevronRight,
  Home,
  Wrench,
  DollarSign as DollarIcon,
  BarChart3 as AnalyticsIcon,
  MessageSquare as CommunicationIcon,
  Package as InventoryIcon
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  onCreateListingClick?: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  isModal?: boolean;
  featureFlag?: string;
  planRequired?: 'pro' | 'business';
}

interface NavigationCategory {
  name: string;
  icon: any;
  items: NavigationItem[];
  defaultOpen?: boolean;
}

const navigationCategories: NavigationCategory[] = [
  {
    name: 'Overview',
    icon: Home,
    defaultOpen: true,
    items: [
      {
        name: 'Dashboard',
        href: '/app',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    name: 'Listings',
    icon: FileText,
    defaultOpen: true,
    items: [
      {
        name: 'Generator',
        href: '/app/generator',
        icon: FileText,
      },
      {
        name: 'Create Listing',
        href: '#create-listing',
        icon: Plus,
        isModal: true,
        featureFlag: 'etsy',
      },
      {
        name: 'My Listings',
        href: '/app/listings',
        icon: List,
        featureFlag: 'myListings',
      },
      {
        name: 'Saved Listings',
        href: '/app/saved',
        icon: Save,
        planRequired: 'pro', // Available for Pro and Business users
      },
      {
        name: 'Templates',
        href: '/app/templates',
        icon: FileText,
        featureFlag: 'templates',
      },
      {
        name: 'Drafts',
        href: '/app/drafts',
        icon: Save,
        featureFlag: 'drafts',
      },
    ],
  },
  {
    name: 'SEO & Keywords',
    icon: Search,
    defaultOpen: false,
    items: [
      {
        name: 'Keyword Lab',
        href: '/app/keywords',
        icon: Search,
        featureFlag: 'keywords',
      },
      {
        name: 'Rank Tracker',
        href: '/app/rank-tracker',
        icon: TrendingUp,
        featureFlag: 'keywordRanking',
      },
      {
        name: 'SEO Grader',
        href: '/app/listings/grade',
        icon: Award,
        featureFlag: 'keywords',
      },
    ],
  },
  {
    name: 'Analytics',
    icon: AnalyticsIcon,
    defaultOpen: false,
    items: [
      {
        name: 'Analytics',
        href: '/app/analytics',
        icon: BarChart3,
        featureFlag: 'analytics',
      },
      {
        name: 'Competitors',
        href: '/app/competitors',
        icon: Users,
        featureFlag: 'analytics',
      },
      {
        name: 'Shop Health',
        href: '/app/shop/health',
        icon: Activity,
        featureFlag: 'analytics',
      },
      {
        name: 'Shop Compare',
        href: '/app/shop/compare',
        icon: Scale,
        featureFlag: 'analytics',
      },
    ],
  },
  {
    name: 'Business',
    icon: DollarIcon,
    defaultOpen: false,
    items: [
      {
        name: 'Smart Pricing',
        href: '/app/pricing/optimizer',
        icon: TrendingUp,
        featureFlag: 'finances',
      },
      {
        name: 'Financial Reports',
        href: '/app/finances/reports',
        icon: BarChart3,
        featureFlag: 'finances',
      },
      {
        name: 'Expense Tracking',
        href: '/app/finances/expenses',
        icon: Receipt,
        featureFlag: 'finances',
      },
    ],
  },
  {
    name: 'Communication',
    icon: CommunicationIcon,
    defaultOpen: false,
    items: [
      {
        name: 'Messages',
        href: '/app/messages',
        icon: MessageSquare,
        featureFlag: 'communication',
      },
      {
        name: 'Campaigns',
        href: '/app/campaigns',
        icon: Target,
        featureFlag: 'communication',
      },
    ],
  },
  {
    name: 'Inventory',
    icon: InventoryIcon,
    defaultOpen: false,
    items: [
      {
        name: 'Orders',
        href: '/app/orders',
        icon: Package,
        featureFlag: 'inventory',
      },
      {
        name: 'Inventory',
        href: '/app/inventory',
        icon: Package2,
        featureFlag: 'inventory',
      },
    ],
  },
  {
    name: 'Tools',
    icon: Wrench,
    defaultOpen: false,
    items: [
      {
        name: 'Niche Finder',
        href: '/app/tools/niche-finder',
        icon: Compass,
        featureFlag: 'tools',
      },
      {
        name: 'Seasonal Predictor',
        href: '/app/tools/seasonal-predictor',
        icon: TrendingUp,
        featureFlag: 'tools',
      },
      {
        name: 'Health Check',
        href: '/app/tools/health-check',
        icon: Activity,
        featureFlag: 'tools',
      },
      {
        name: 'Bulk Tags',
        href: '/app/tools/bulk-tags',
        icon: Edit,
        featureFlag: 'tools',
      },
    ],
  },
];

const bottomNavigation = [
  {
    name: 'Profile',
    href: '/app/profile',
    icon: User,
  },
  {
    name: 'Settings',
    href: '/app/settings',
    icon: Settings,
  },
  {
    name: 'Billing',
    href: '/app/billing',
    icon: CreditCard,
  },
  {
    name: 'Upgrade',
    href: '/app/upgrade',
    icon: Zap,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ className, onCreateListingClick }) => {
  const pathname = usePathname();
  const { user } = useUser();
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'business'>('free');
  
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navigationCategories.forEach(category => {
      initial[category.name] = category.defaultOpen || false;
    });
    return initial;
  });

  // Get user plan when user data is available
  React.useEffect(() => {
    if (user) {
      console.log('Sidebar - User object:', user);
      console.log('Sidebar - User metadata:', user.publicMetadata);
      console.log('Sidebar - User metadata plan:', user.publicMetadata?.plan);
      console.log('Sidebar - User metadata plan type:', typeof user.publicMetadata?.plan);
      
      // Fetch user plan from API to ensure consistency with server-side
      fetch('/api/user/plan')
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log('Sidebar - API detected plan:', data.plan);
            setUserPlan(data.plan);
          } else {
            console.error('Sidebar - Failed to get plan from API:', data.error);
            // Fallback to client-side detection
            getUserPlanSimple(user).then(plan => {
              console.log('Sidebar - Fallback detected plan:', plan);
              setUserPlan(plan);
            });
          }
        })
        .catch(error => {
          console.error('Sidebar - Error fetching plan from API:', error);
          // Fallback to client-side detection
          getUserPlanSimple(user).then(plan => {
            console.log('Sidebar - Fallback detected plan:', plan);
            setUserPlan(plan);
          });
        });
    }
  }, [user]);

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
