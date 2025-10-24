'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: number;
}

interface TopRightToastProps {
  className?: string;
}

export function TopRightToast({ className }: TopRightToastProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleToastEvent = (event: CustomEvent) => {
      const newToast: Toast = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        message: event.detail.message,
        type: event.detail.type,
        timestamp: Date.now()
      };

      setToasts(prev => [...prev, newToast]);

      // Auto-remove after 4 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== newToast.id));
      }, 4000);
    };

    window.addEventListener('topRightToast', handleToastEvent as EventListener);
    return () => {
      window.removeEventListener('topRightToast', handleToastEvent as EventListener);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getToastColors = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 ${className}`}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg max-w-md min-w-80 ${getToastColors(toast.type)} animate-in slide-in-from-right-full duration-300`}
        >
          {getToastIcon(toast.type)}
          <span className="text-sm font-medium flex-1 break-words leading-relaxed">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// Helper function to emit top-right toast events
export function emitTopRightToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  const event = new CustomEvent('topRightToast', {
    detail: { message, type }
  });
  window.dispatchEvent(event);
}
