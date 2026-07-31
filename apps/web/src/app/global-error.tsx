'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="bg-[#0D1117] text-[#F0F6FC] flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold text-red-500 mb-2">Application Error</h1>
        <p className="text-sm text-gray-400 mb-6">An unexpected error occurred in the application shell.</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-[#38BDF8] text-[#010409] font-semibold rounded-xl text-sm"
        >
          Reload
        </button>
      </body>
    </html>
  )
}
