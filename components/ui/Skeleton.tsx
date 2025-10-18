import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  lines?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ className, lines = 1 }) => {
  if (lines === 1) {
    return (
      <div
        className={cn(
          'animate-pulse bg-gray-200 rounded',
          className
        )}
      />
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse bg-gray-200 rounded',
            i === lines - 1 ? 'w-3/4' : 'w-full',
            className
          )}
        />
      ))}
    </div>
  );
};

// Predefined skeleton components
export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <Skeleton className="h-4" lines={lines} />
);

export const SkeletonTitle: React.FC = () => (
  <Skeleton className="h-8 w-3/4" />
);

export const SkeletonButton: React.FC = () => (
  <Skeleton className="h-12 w-32" />
);

export const SkeletonCard: React.FC = () => (
  <div className="p-6 border rounded-lg">
    <SkeletonTitle />
    <div className="mt-4 space-y-2">
      <SkeletonText lines={3} />
    </div>
    <div className="mt-4 flex space-x-2">
      <SkeletonButton />
      <Skeleton className="h-12 w-24" />
    </div>
  </div>
);

export { Skeleton };
