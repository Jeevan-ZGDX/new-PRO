import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../utils/cn'
import { Search, X } from 'lucide-react'

export interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
  showClear?: boolean
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, onClear, showClear = false, value, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-gray-500" />
        <input
          ref={ref}
          type="text"
          value={value}
          className={cn(
            'w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-11 pr-10 text-base text-gray-900 dark:text-gray-100',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-800',
            className
          )}
          {...props}
        />
        {(showClear || (typeof value === 'string' && value.length > 0)) && onClear && (
          <button
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>
    )
  }
)

SearchBar.displayName = 'SearchBar'
