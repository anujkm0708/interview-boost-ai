import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      iconLeft,
      iconRight,
      inputSize = 'md',
      id,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const sizeStyles = {
      sm: 'h-8 text-xs px-3',
      md: 'h-10 text-sm px-3.5',
      lg: 'h-12 text-base px-4',
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
        <div className="relative">
          {iconLeft && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
              {iconLeft}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              'w-full rounded-lg border bg-background text-foreground',
              'placeholder:text-muted-foreground/60',
              'transition-all duration-200 ease-in-out',
              'focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring',
              sizeStyles[inputSize],
              iconLeft && 'pl-10',
              iconRight && 'pr-10',
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
          {iconRight && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
              {iconRight}
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-destructive animate-slide-up"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
