'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useUser, SignInButton, SignOutButton } from '@clerk/nextjs';
import { Menu, X, ChevronDown, User, Settings, LogOut, CreditCard, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusIndicator } from '@/components/StatusIndicator';
import { navigationCategories, bottomNavigation, NavigationItem, NavigationCategory } from '@/lib/navigation';
import { isEnabled } from '@/lib/flags';
import { getUserPlanSimple } from '@/lib/entitlements';

const Header: React.FC = () => {
  const { user, isSignedIn } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'business'>('free');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user plan when user data is available
  useEffect(() => {
    if (user) {
      getUserPlanSimple(user).then(plan => {
        setUserPlan(plan);
      });
    }
  }, [user]);

  // Initialize open categories
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    navigationCategories.forEach(category => {
      initial[category.name] = category.defaultOpen || false;
    });
    setOpenCategories(initial);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Contact', href: '/contact' }
  ];

  const loggedInNavigation = [
    { name: 'Dashboard', href: '/app' }
  ];

  // Filter navigation items based on feature flags and plan requirements
  const getFilteredNavigationCategories = () => {
    return navigationCategories.map(category => ({
      ...category,
      items: category.items.filter(item => {
        // Check feature flag if present
        if (item.featureFlag) {
          if (!isEnabled(item.featureFlag as any)) return false;
        }
        
        // Check plan requirement if present
        if (item.planRequired) {
          const hasRequiredPlan = (item.planRequired === 'pro' && (userPlan === 'pro' || userPlan === 'business')) ||
                                 (item.planRequired === 'business' && userPlan === 'business');
          if (!hasRequiredPlan) return false;
        }
        
        return true;
      })
    })).filter(category => category.items.length > 0);
  };

  const toggleCategory = (categoryName: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const handleCreateListingClick = () => {
    // This would be passed from the parent component
    // For now, we'll just close the mobile menu
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-background shadow-sm border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary">ListGenius</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {(isSignedIn ? loggedInNavigation : navigation).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-muted-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

              {/* Desktop Auth and Status */}
              <div className="hidden md:flex items-center space-x-4">
                {/* Status Indicator */}
                <StatusIndicator />

                {isSignedIn ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary px-3 py-2 transition-colors"
                    >
                      <span>{user?.firstName || user?.emailAddresses[0]?.emailAddress}</span>
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform",
                        isUserDropdownOpen && "rotate-180"
                      )} />
                    </button>

                    {/* Dropdown Menu */}
                    {isUserDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      href="/app/profile"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                        <Link
                          href="/app/settings"
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                        <Link
                          href="/app/billing"
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <CreditCard className="h-4 w-4" />
                          <span>Billing</span>
                        </Link>
                        <SignOutButton>
                          <button className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full text-left">
                            <LogOut className="h-4 w-4" />
                            <span>Sign Out</span>
                          </button>
                        </SignOutButton>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <SignInButton>
                      <button className="text-muted-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors">
                        Sign In
                      </button>
                    </SignInButton>
                    <Link href="/pricing">
                      <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
                        Join for Free
                      </button>
                    </Link>
                  </div>
                )}
              </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-brand-600 p-2 transition-colors min-h-12 min-w-12 flex items-center justify-center"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t max-h-96 overflow-y-auto">
              {/* Basic Navigation */}
              {(isSignedIn ? loggedInNavigation : navigation).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-brand-600 block px-3 py-2 text-base font-medium transition-colors min-h-12 flex items-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {/* App Navigation - Only show when signed in */}
              {isSignedIn && (
                <div className="border-t pt-4 mt-4">
                  <div className="px-3 py-2 space-y-1">
                    {getFilteredNavigationCategories().map((category) => (
                      <div key={category.name} className="space-y-1">
                        {/* Category Header */}
                        <button
                          onClick={() => toggleCategory(category.name)}
                          className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-600 rounded-lg transition-colors min-h-12"
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
                            {category.items.map((item) => {
                              if (item.isModal) {
                                return (
                                  <button
                                    key={item.name}
                                    onClick={() => {
                                      handleCreateListingClick();
                                      setIsMobileMenuOpen(false);
                                    }}
                                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left min-h-12 text-gray-700 hover:text-brand-600"
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
                                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-12 text-gray-700 hover:text-brand-600"
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  <item.icon className="h-5 w-5" />
                                  <span>{item.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Section */}
              <div className="border-t pt-4">
                {isSignedIn ? (
                  <div className="px-3 py-2">
                    <div className="mb-3">
                      <StatusIndicator />
                    </div>
                    <div className="space-y-2">
                      {bottomNavigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center space-x-2 text-sm text-gray-700 hover:text-brand-600 transition-colors min-h-12 px-2 py-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      ))}
                      <SignOutButton>
                        <button className="flex items-center space-x-2 text-sm text-gray-700 hover:text-brand-600 transition-colors min-h-12 px-2 py-2 w-full text-left">
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </SignOutButton>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-2 space-y-2">
                    <SignInButton>
                      <button className="text-gray-700 hover:text-brand-600 block px-3 py-2 text-base font-medium transition-colors min-h-12 w-full text-left">
                        Sign In
                      </button>
                    </SignInButton>
                    <Link href="/pricing">
                      <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors w-full min-h-12">
                        Join for Free
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export { Header };
