'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-6xl font-extrabold text-accent dark:text-[#38BDF8] mb-2">404</h1>
      <h2 className="text-xl font-bold text-gray-900 dark:text-[#F0F6FC] mb-2">Page Not Found</h2>
      <p className="text-sm text-gray-500 dark:text-[#8B949E] max-w-md mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent dark:bg-[#38BDF8] text-white dark:text-[#010409] font-medium rounded-xl hover:opacity-90 transition-opacity text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  )
}
