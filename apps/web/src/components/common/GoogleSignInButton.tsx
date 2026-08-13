'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { OFFICIAL_COLLEGE_DOMAIN } from '@/lib/auth'

export function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 41.1 44 36 44 24c0-1.3-.1-2.6-.4-3.9z"
      />
    </svg>
  )
}

/**
 * Starts the Supabase-hosted Google OAuth flow. Supabase handles the exchange
 * with Google and returns the browser to `/auth/callback`, which trades the
 * PKCE code for a session, restricts sign-in to @citchennai.net and resolves
 * the account's role from the database before forwarding to `next`.
 */
export function GoogleSignInButton({ next }: { next?: string }) {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleClick = async () => {
    const requested = next || searchParams.get('next') || '/dashboard'

    const target =
      requested.startsWith('/') && !requested.startsWith('//')
        ? requested
        : '/dashboard'

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setError('Supabase is not configured, so Google sign in is unavailable.')
      return
    }

    setLoading(true)
    setError('')

    // The origin is read from the live document rather than hardcoded, so the
    // same build works on localhost and on the deployed host. Whatever it
    // resolves to must be listed under Supabase → Auth → URL Configuration →
    // Redirect URLs, otherwise Supabase silently falls back to the Site URL.
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}`,
        queryParams: {
          // Narrows Google's account picker to college accounts. This is a UX
          // filter only — /auth/callback performs the real domain check.
          hd: OFFICIAL_COLLEGE_DOMAIN,
          prompt: 'select_account',
        },
      },
    })

    if (oauthError) {
      console.error('Google OAuth error:', oauthError)
      setError(oauthError.message || 'Could not start Google sign in.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full h-11 flex items-center justify-center gap-3 rounded-xl border border-gray-300 dark:border-obsidian-border bg-white dark:bg-obsidian-hover text-gray-800 dark:text-ink-primary font-medium text-sm hover:bg-gray-50 dark:hover:bg-obsidian-surface disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        <GoogleIcon className="w-5 h-5" />
        {loading ? 'Redirecting to Google…' : 'Continue with Google'}
      </button>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
