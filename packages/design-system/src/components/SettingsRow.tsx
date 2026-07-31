import { type ReactNode } from 'react'
import { cn } from '../utils/cn'
import { ChevronRight } from 'lucide-react'

interface SettingsRowProps {
  icon: ReactNode
  label: string
  value?: string
  onPress?: () => void
  showChevron?: boolean
  className?: string
  rightElement?: ReactNode
}

export function SettingsRow({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
  className,
  rightElement,
}: SettingsRowProps) {
  return (
    <button
      onClick={onPress}
      disabled={!onPress}
      className={cn(
        'w-full flex items-center gap-3 p-4 text-left',
        'transition-colors duration-150',
        onPress && 'hover:bg-gray-50 dark:hover:bg-[#161B22] active:bg-gray-100 dark:active:bg-[#21262D]',
        !onPress && 'cursor-default',
        className
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#0D1117] border dark:border-[#30363D] flex items-center justify-center text-gray-600 dark:text-[#8B949E] flex-shrink-0">
        {icon}
      </div>
      <span className="flex-1 text-base font-medium text-gray-900 dark:text-[#F0F6FC]">{label}</span>
      {rightElement || (
        <div className="flex items-center gap-2">
          {value && (
            <span className="text-sm text-gray-500 dark:text-[#8B949E]">{value}</span>
          )}
          {showChevron && onPress && (
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-[#8B949E]" />
          )}
        </div>
      )}
    </button>
  )
}
