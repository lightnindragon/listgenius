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
  Images,
  Package,
  Package2,
  Mail,
  Printer,
  Receipt,
  Home,
  Wrench,
  DollarSign as DollarIcon,
  BarChart3 as AnalyticsIcon,
  MessageSquare as CommunicationIcon,
  Package as InventoryIcon,
  HandCoins
} from 'lucide-react';

export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  isModal?: boolean;
  featureFlag?: string;
  planRequired?: 'pro' | 'business';
}

export interface NavigationCategory {
  name: string;
  icon: any;
  items: NavigationItem[];
  defaultOpen?: boolean;
}

export const navigationCategories: NavigationCategory[] = [
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
      {
        name: 'Images',
        href: '/app/images',
        icon: Images,
        // Feature is complete - always visible
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
        name: 'Affiliate Program',
        href: '/app/affiliate',
        icon: HandCoins,
        featureFlag: 'affiliate',
      },
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

export const bottomNavigation = [
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
