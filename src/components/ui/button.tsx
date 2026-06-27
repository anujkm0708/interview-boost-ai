import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const variantStyles = {
  primary: [
    'bg-gradient-to-r from-gradient-start to-gradient-end',
    'text-primary-foreground font-medium',
    'shadow-md shadow-primary/25',
    'hover:shadow-lg hover:shadow-primary/30 hover:brightness-110',
    'active:shadow-sm active:brightness-95',
  ].join(' '),
  secondary: [
    'bg-secondary text-secondary-foreground',
    'hover:bg-secondary/80',
    'active:bg-secondary/70',
  ].join(' '),
  outline: [
    'border border-border bg-transparent text-foreground',
    'hover:bg-accent/10 hover:border-accent/50',
    'active:bg-accent/20',
  ].join(' '),
  ghost: [
    'bg-transparent text-foreground',
    'hover:bg-muted',
    'active:bg-muted/80',
  ].join(' '),
  destructive: [
    'bg-destructive text-destructive-foreground',
    'shadow-md shadow-destructive/25',
    'hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/30',
    'active:bg-destructive/80 active:shadow-sm',
  ].join(' '),
};

const sizeStyles = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
};

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-200 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'cursor-pointer select-none',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          isDisabled && 'pointer-events-none opacity-50',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Spinner className={cn(size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4')} />
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span className="shrink-0">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && icon && iconPosition === 'right' && (
          <span className="shrink-0">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
