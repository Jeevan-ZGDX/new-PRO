import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { resolveUserFromDatabase } from '@/lib/google-auth'
import { isAllowedEmail, OFFICIAL_COLLEGE_DOMAIN } from '@/lib/auth'

const USER_COOKIE = 'comp_dash_user'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30

// The Supabase session cookies are written through `cookies()`, which only
// works on a dynamically rendered request.
export const dynamic = 'force-dynamic'

/**
 * OAuth landing route for the Supabase-hosted Google flow.
 *
 * Google redirects to Supabase (`<project>.supabase.co/auth/v1/callback` — the
 * only URI registered in Google Cloud), Supabase completes the provider
 * handshake and bounces the browser here with `?code=`. `@supabase/ssr` uses
 * PKCE, so that code is worthless until it is traded for a session — which is
 * what this route exists to do. Without it the browser lands on `/dashboard`
 * holding a code, no session cookie is ever written, and the middleware sends
 * it straight back to `/sign-in`.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const providerError =
    searchParams.get('error_description') || searchParams.get('error')

  const origin = resolveOrigin(request)

  const fail = (error: string, message: string) => {
    const url = new URL('/sign-in', origin)
    url.searchParams.set('error', error)
    url.searchParams.set('message', message)
    return NextResponse.redirect(url)
  }

  if (providerError) {
    return fail('google_denied', providerError)
  }

  if (!code) {
    return fail(
      'google_invalid_state',
      'The sign in request has expired. Please try again.'
    )
  }

  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user?.email) {
    console.error('OAuth code exchange failed:', error)
    return fail(
      'google_auth_failed',
      error?.message || 'Google sign in failed. Please try again.'
    )
  }

  const email = data.user.email.trim().toLowerCase()

  // Supabase has already minted a session by this point, so every rejection
  // below has to tear it down again — otherwise a denied account keeps a valid
  // session cookie and the middleware waves it through.
  if (!isAllowedEmail(email)) {
    await supabase.auth.signOut()
    return fail(
      'google_domain_denied',
      `Only @${OFFICIAL_COLLEGE_DOMAIN} accounts can sign in. You signed in with ${email}.`
    )
  }

  const resolved = await resolveUserFromDatabase(email)

  if (resolved.denied) {
    await supabase.auth.signOut()
    return fail(
      'google_access_denied',
      resolved.reason || 'This account is not authorized to sign in.'
    )
  }

  const profile = {
    email,
    name: resolved.name || data.user.user_metadata?.full_name || email.split('@')[0],
    role: resolved.role,
    department: resolved.department,
  }

  // Google owns `name`/`avatar_url` on the auth user, but the role and
  // department come from our own tables — write them onto the user so the
  // middleware and the session JWT agree with the cookie set below.
  const admin = createSupabaseAdminClient()
  if (admin) {
    const { error: metadataError } = await admin.auth.admin.updateUserById(
      data.user.id,
      {
        user_metadata: {
          ...data.user.user_metadata,
          name: profile.name,
          role: profile.role,
          department: profile.department,
        },
      }
    )
    if (metadataError) {
      console.error('Failed to sync role metadata:', metadataError.message)
    } else {
      // The access token issued a moment ago still carries the pre-sync
      // metadata; refresh so the JWT claims match the resolved role. A failure
      // here is not fatal — the cookie below already carries the right role,
      // and the existing session cookies are left intact.
      const { error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        console.error('Session refresh after role sync failed:', refreshError.message)
      }
    }
  }

  const response = NextResponse.redirect(new URL(resolveNext(searchParams), origin))

  response.cookies.set(USER_COOKIE, JSON.stringify(profile), {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
  })

  return response
}

/**
 * Render terminates TLS at its proxy, so `request.url` reports the internal
 * origin. Trusting it would build redirects onto an unreachable host.
 */
function resolveOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured) return configured.replace(/\/$/, '')

  const forwardedHost = request.headers.get('x-forwarded-host')
  if (forwardedHost) {
    const proto = request.headers.get('x-forwarded-proto') || 'https'
    return `${proto}://${forwardedHost}`
  }

  return request.nextUrl.origin
}

/** Only same-origin paths are honoured, so `next` cannot be used as an open redirect. */
function resolveNext(searchParams: URLSearchParams): string {
  const next = searchParams.get('next') || '/dashboard'
  return next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
}
