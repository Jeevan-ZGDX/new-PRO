import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
        primary: 'bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300',
        accent: 'bg-accentLight dark:bg-accent/20 text-accentDark dark:text-accent-light',
        success: 'bg-successLight dark:bg-emerald-950/50 text-successDark dark:text-emerald-400',
        warning: 'bg-warningLight dark:bg-amber-950/50 text-warningDark dark:text-amber-400',
        danger: 'bg-errorLight dark:bg-red-950/50 text-errorDark dark:text-red-400',
        info: 'bg-infoLight dark:bg-blue-950/50 text-infoDark dark:text-blue-400',
        outline: 'border border-gray-200 dark:border-gray-700 bg-transparent text-gray-600 dark:text-gray-300',
      },
      size: {
        xs: 'px-2 py-0.5 text-[10px]',
        sm: 'px-2.5 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
    },
  }
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

export function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size, className }))} {...props}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            variant === 'success' && 'bg-success',
            variant === 'warning' && 'bg-warning',
            variant === 'danger' && 'bg-error',
            variant === 'info' && 'bg-info',
            variant === 'primary' && 'bg-primary-500',
            variant === 'accent' && 'bg-accent',
            (!variant || variant === 'default') && 'bg-gray-500'
          )}
        />
      )}
      {children}
    </span>
  )
}
