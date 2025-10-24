import { isEnabled } from './flags';

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  requiresPro?: boolean;
  featureFlag?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/app', icon: 'LayoutDashboard' },
  { label: 'AI Generator', href: '/app/generator', icon: 'FileText' },
  { label: 'Saved Generations', href: '/app/saved', icon: 'Save', requiresPro: true },
  { label: 'My Listings', href: '/app/listings', icon: 'List', featureFlag: 'myListings' },
  { label: 'Keyword Lab', href: '/app/keywords', icon: 'Search', featureFlag: 'keywords' },
  { label: 'Rank Tracker', href: '/app/rank-tracker', icon: 'TrendingUp', featureFlag: 'keywordRanking' },
  { label: 'Finances', href: '/app/finances/reports', icon: 'DollarSign', featureFlag: 'finances' },
];

export function getVisibleNav(plan: 'free'|'pro'): NavItem[] {
  return NAV_ITEMS.filter(item => {
    if (item.requiresPro && plan === 'free') return false;
    if (item.featureFlag && !isEnabled(item.featureFlag as any)) return false;
    return true;
  });
}
