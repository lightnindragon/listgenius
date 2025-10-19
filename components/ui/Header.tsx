'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useUser, SignInButton, SignOutButton } from '@clerk/nextjs';
import { Menu, X, ChevronDown, User, Settings, LogOut, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusIndicator } from '@/components/StatusIndicator';

const Header: React.FC = () => {
  const { user, isSignedIn } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    ...(isSignedIn ? [
      { name: 'Generator', href: '/app' },
      { name: 'Rewrite', href: '/app/rewrite' },
      { name: 'My Listings', href: '/app/listings' }
    ] : [])
  ];

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
            {navigation.map((item) => (
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
                  <SignInButton>
                    <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
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
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-brand-600 block px-3 py-2 text-base font-medium transition-colors min-h-12 flex items-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
                  <div className="border-t pt-4">
                    {isSignedIn ? (
                      <div className="px-3 py-2">
                        <div className="mb-3">
                          <StatusIndicator />
                        </div>
                        <div className="space-y-2">
                      <Link
                        href="/app/profile"
                        className="flex items-center space-x-2 text-sm text-gray-700 hover:text-brand-600 transition-colors min-h-12 px-2 py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                          <Link
                            href="/app/settings"
                            className="flex items-center space-x-2 text-sm text-gray-700 hover:text-brand-600 transition-colors min-h-12 px-2 py-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Settings className="h-4 w-4" />
                            <span>Settings</span>
                          </Link>
                          <Link
                            href="/app/billing"
                            className="flex items-center space-x-2 text-sm text-gray-700 hover:text-brand-600 transition-colors min-h-12 px-2 py-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <CreditCard className="h-4 w-4" />
                            <span>Billing</span>
                          </Link>
                          <SignOutButton>
                            <button className="flex items-center space-x-2 text-sm text-gray-700 hover:text-brand-600 transition-colors min-h-12 px-2 py-2 w-full text-left">
                              <LogOut className="h-4 w-4" />
                              <span>Sign Out</span>
                            </button>
                          </SignOutButton>
                        </div>
                      </div>
                    ) : (
                      <div className="px-3 py-2">
                        <SignInButton>
                          <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors w-full min-h-12">
                            Sign In
                          </button>
                        </SignInButton>
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
