'use client';

import { forwardRef, type TextareaHTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      showCount = false,
      maxLength,
      id,
      onChange,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const [charCount, setCharCount] = useState(
      () => String(value ?? defaultValue ?? '').length
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          onChange={handleChange}
          className={cn(
            'w-full min-h-[80px] rounded-lg border bg-background text-foreground',
            'px-3.5 py-2.5 text-sm',
            'placeholder:text-muted-foreground/60',
            'transition-all duration-200 ease-in-out',
            'focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring',
            'resize-y',
            error
              ? 'border-destructive focus:ring-destructive/50 focus:border-destructive'
              : 'border-input hover:border-muted-foreground/30',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        <div className="flex items-center justify-between">
          {error ? (
            <p
              id={`${inputId}-error`}
              className="text-xs text-destructive animate-slide-up"
              role="alert"
            >
              {error}
            </p>
          ) : (
            <span />
          )}
          {showCount && (
            <span
              className={cn(
                'text-xs text-muted-foreground',
                maxLength && charCount >= maxLength && 'text-destructive'
              )}
            >
              {charCount}
              {maxLength ? `/${maxLength}` : ''}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
