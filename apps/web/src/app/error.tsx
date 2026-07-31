'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-4xl font-bold text-red-600 dark:text-red-400 mb-2">Something went wrong</h1>
      <p className="text-sm text-gray-500 dark:text-[#8B949E] max-w-md mb-6">
        An unexpected error occurred.
      </p>
      <button
        onClick={() => reset()}
        className="px-5 py-2.5 bg-accent dark:bg-[#38BDF8] text-white dark:text-[#010409] font-medium rounded-xl hover:opacity-90 transition-opacity text-sm"
      >
        Try Again
      </button>
    </div>
  )
}
