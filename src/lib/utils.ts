import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS conflict resolution.
 * Combines clsx for conditional classes with tailwind-merge
 * to intelligently resolve Tailwind class conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string into a human-readable format.
 * @param dateString - ISO date string or Date-parseable string
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Format a number as currency.
 * @param amount - Amount in cents
 * @param currency - ISO 4217 currency code (default: 'USD')
 * @returns Formatted currency string (e.g., "$9.99")
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100);
}

/**
 * Truncate text to a specified length with an ellipsis.
 * @param text - Text to truncate
 * @param maxLength - Maximum character length (default: 100)
 * @returns Truncated text with "..." appended if it exceeds maxLength
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}
