'use client'

import { useRouter } from 'next/navigation'
import { Menu, Bell, Search, LogOut } from 'lucide-react'
import { useUnreadNotificationCount } from '@comp-dash/api'
import { logoutUser } from '@/lib/auth'
import { ThemeToggle } from '@/components/common/ThemeToggle'

interface DashboardHeaderProps {
  onMenuToggle: () => void
}

export function DashboardHeader({ onMenuToggle }: DashboardHeaderProps) {
  const router = useRouter()
  const { data: unreadData } = useUnreadNotificationCount()

  const unreadCount = unreadData?.count ?? 0

  const handleLogout = () => {
    logoutUser()
    router.push('/sign-in')
  }

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-[#010409] border-b border-gray-100 dark:border-[#30363D] transition-colors">
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#161B22] transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-[#8B949E]" />
          </button>
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#8B949E]" />
            <input
              type="text"
              placeholder="Search..."
              className="w-64 h-10 pl-10 pr-4 rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] text-sm text-gray-900 dark:text-[#F0F6FC] placeholder-gray-400 dark:placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => router.push('/notifications')}
            className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#161B22] text-gray-600 dark:text-[#8B949E] transition-colors"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-[#8B949E]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-[#8B949E] hover:bg-gray-100 dark:hover:bg-[#161B22] hover:dark:text-[#F0F6FC] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}

