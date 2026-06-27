import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  size?: keyof typeof sizeStyles;
  showLabel?: boolean;
  indeterminate?: boolean;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      size = 'md',
      showLabel = false,
      indeterminate = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div className="flex flex-col gap-1.5">
        {showLabel && !indeterminate && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Progress
            </span>
            <span className="text-xs font-semibold text-foreground">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <div
          ref={ref}
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : value}
          aria-valuemin={0}
          aria-valuemax={max}
          className={cn(
            'w-full overflow-hidden rounded-full bg-muted',
            sizeStyles[size],
            className
          )}
          {...props}
        >
          {indeterminate ? (
            <div
              className={cn(
                'h-full w-1/3 rounded-full',
                'bg-gradient-to-r from-gradient-start via-gradient-end to-gradient-start',
                'animate-shimmer',
                'bg-[length:200%_100%]'
              )}
            />
          ) : (
            <div
              className={cn(
                'h-full rounded-full',
                'bg-gradient-to-r from-gradient-start to-gradient-end',
                'transition-all duration-500 ease-out'
              )}
              style={{ width: `${percentage}%` }}
            />
          )}
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';
