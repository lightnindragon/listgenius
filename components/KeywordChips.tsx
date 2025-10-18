'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface KeywordChipsProps {
  keywords: string[];
  onRemove?: (index: number) => void;
  className?: string;
}

const KeywordChips: React.FC<KeywordChipsProps> = ({ 
  keywords, 
  onRemove, 
  className 
}) => {
  if (keywords.length === 0) {
    return (
      <div className={cn('text-gray-500 text-sm italic', className)}>
        No keywords added yet
      </div>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {keywords.map((keyword, index) => (
        <div
          key={index}
          className="inline-flex items-center gap-1 bg-brand-100 text-brand-800 px-3 py-1 rounded-full text-sm"
        >
          <span>{keyword}</span>
          {onRemove && (
            <button
              onClick={() => onRemove(index)}
              className="ml-1 hover:text-brand-600 transition-colors"
              aria-label={`Remove ${keyword}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export { KeywordChips };
