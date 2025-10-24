import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  title,
  description,
  variant = 'info',
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Allow fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const variants = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm w-full bg-white border rounded-lg shadow-lg p-4 transition-all duration-300 ease-in-out transform',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        variants[variant]
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-lg font-semibold">{icons[variant]}</span>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{title}</p>
          {description && (
            <p className="mt-1 text-sm opacity-90">{description}</p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={() => onClose(id)}
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast container component
interface ToastContainerProps {
  toasts: Array<{
    id: string;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  }>;
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts = [], onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.slice(0, 3).map((toast, index) => (
        <div
          key={toast.id}
          className="transform transition-transform duration-300"
          style={{
            transform: `translateY(${index * 8}px) scale(${1 - index * 0.05})`,
            zIndex: 50 - index
          }}
        >
          <Toast
            {...toast}
            onClose={onClose}
          />
        </div>
      ))}
    </div>
  );
};

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  }>>([]);

  const addToast = (toast: Omit<typeof toasts[0], 'id'>) => {
    const id = Math.random().toString(36).substring(2, 15);
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const toast = {
    success: (title: string, description?: string) => addToast({ title, description, variant: 'success' }),
    error: (title: string, description?: string) => addToast({ title, description, variant: 'error' }),
    warning: (title: string, description?: string) => addToast({ title, description, variant: 'warning' }),
    info: (title: string, description?: string) => addToast({ title, description, variant: 'info' })
  };

  return { toasts, toast, removeToast };
}

export { Toast };
