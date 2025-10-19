'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FileText, 
  List, 
  User, 
  Settings, 
  CreditCard,
  BarChart3
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/app',
    icon: LayoutDashboard,
  },
  {
    name: 'Generator',
    href: '/app/generator',
    icon: FileText,
  },
  {
    name: 'My Listings',
    href: '/app/listings',
    icon: List,
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
];

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const pathname = usePathname();

  return (
    <div className={cn('flex flex-col h-full bg-white border-r border-gray-200', className)}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/app" className="flex items-center">
          <span className="text-xl font-bold text-primary">ListGenius</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
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
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
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
