import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format word count for display
 */
export function formatWordCount(text: string): string {
  const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  return `${words} word${words !== 1 ? 's' : ''}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Sanitize Etsy tag by removing forbidden symbols and truncating
 */
export function sanitizeTag(tag: string): string {
  const forbiddenSymbols = ['&', '#', '@', '%', '^', '*', '!', '~', '`', '|', '\\', '<', '>'];
  let sanitized = tag;
  
  // Remove forbidden symbols
  forbiddenSymbols.forEach(symbol => {
    sanitized = sanitized.replace(new RegExp('\\' + symbol, 'g'), '');
  });
  
  // Trim and truncate to 20 characters
  sanitized = sanitized.trim();
  if (sanitized.length > 20) {
    sanitized = sanitized.substring(0, 20).trim();
  }
  
  return sanitized;
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate Etsy tag rules
 */
export function isValidEtsyTag(tag: string): boolean {
  // Check length (including spaces)
  if (tag.length === 0 || tag.length > 20) return false;
  
  // Check for forbidden symbols
  const forbiddenSymbols = ['&', '#', '@', '%', '^', '*', '!', '~', '`', '|', '\\', '<', '>'];
  const hasForbiddenSymbol = forbiddenSymbols.some(symbol => tag.includes(symbol));
  
  return !hasForbiddenSymbol;
}

/**
 * Extract focus keywords from user input
 */
export function extractFocusKeywords(keywords: string[]): string[] {
  return keywords
    .map(keyword => keyword.trim())
    .filter(keyword => keyword.length > 0)
    .map(keyword => {
      // Ensure minimum 2 words for long-tail keywords
      const words = keyword.split(/\s+/);
      if (words.length < 2) {
        // If single word, we'll let the AI expand it in context
        return keyword;
      }
      return keyword;
    });
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amount / 100);
}

/**
 * Get base URL for API calls
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side
    return window.location.origin;
  }
  
  // Server-side
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  return 'http://localhost:3000';
}
