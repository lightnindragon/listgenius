'use client';

import React from 'react';
import { Save, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface SaveStatusIndicatorProps {
  isSaving: boolean;
  isSaved: boolean;
  hasUnsavedChanges: boolean;
  lastSaved?: Date;
  error?: string;
  className?: string;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  isSaving,
  isSaved,
  hasUnsavedChanges,
  lastSaved,
  error,
  className = ''
}) => {
  const getStatusInfo = () => {
    if (isSaving) {
      return {
        icon: Loader2,
        text: 'Saving...',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        iconClass: 'animate-spin'
      };
    }

    if (error) {
      return {
        icon: AlertCircle,
        text: `Save failed: ${error}`,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        iconClass: ''
      };
    }

    if (hasUnsavedChanges) {
      return {
        icon: Clock,
        text: 'Unsaved changes',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        iconClass: ''
      };
    }

    if (isSaved) {
      return {
        icon: CheckCircle,
        text: lastSaved 
          ? `Saved ${formatLastSaved(lastSaved)}`
          : 'Saved',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        iconClass: ''
      };
    }

    return {
      icon: Save,
      text: 'Not saved',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      iconClass: ''
    };
  };

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const statusInfo = getStatusInfo();
  const IconComponent = statusInfo.icon;

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color} ${className}`}>
      <IconComponent className={`h-4 w-4 ${statusInfo.iconClass}`} />
      <span>{statusInfo.text}</span>
    </div>
  );
};

export default SaveStatusIndicator;
