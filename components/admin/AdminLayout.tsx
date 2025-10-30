'use client';

import React, { useState } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { Button } from '@/components/ui/Button';
import { 
  Users, 
  DollarSign, 
  Settings, 
  BarChart3, 
  TrendingUp,
  Menu,
  X,
  LogOut,
  FileText,
  Plus,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  {
    name: 'Dashboard',
    href: '/adm1n796',
    icon: BarChart3,
  },
  {
    name: 'Users',
    href: '/adm1n796/users',
    icon: Users,
  },
  {
    name: 'Affiliates',
    href: '/adm1n796/affiliates',
    icon: DollarSign,
  },
  {
    name: 'Email Templates',
    href: '/adm1n796/email-templates',
    icon: Mail,
  },
  {
    name: 'Blog Posts',
    href: '/adm1n796/blog',
    icon: FileText,
  },
  {
    name: 'Create Post',
    href: '/adm1n796/blog/create',
    icon: Plus,
  },
  {
    name: 'Environment Variables',
    href: '/adm1n796/environment-variables',
    icon: Settings,
  },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    // Clear admin session
    document.cookie = 'admin-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/adm1n796/login');
  };

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Mobile menu button */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            {/* Sidebar header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="lg:hidden p-2"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${typeof window !== 'undefined' && window.location.pathname === item.href
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Sidebar footer */}
            <div className="p-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full justify-start"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 lg:ml-0">
          {/* Mobile header spacing */}
          <div className="lg:hidden h-16" />
          
          {/* Page content */}
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
      
      {/* Toast notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
              color: '#fff',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#ef4444',
              color: '#fff',
            },
          },
        }}
      />
    </AdminAuthGuard>
  );
};
