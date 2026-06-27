import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

const variantStyles = {
  default: 'bg-primary/15 text-primary border-primary/20',
  success: 'bg-success/15 text-success border-success/20',
  warning: 'bg-warning/15 text-warning border-warning/20',
  danger: 'bg-destructive/15 text-destructive border-destructive/20',
  info: 'bg-accent/15 text-accent border-accent/20',
  outline: 'bg-transparent text-foreground border-border',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variantStyles;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1',
        'rounded-full border px-2.5 py-0.5',
        'text-xs font-medium',
        'transition-colors duration-200',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
);

Badge.displayName = 'Badge';
