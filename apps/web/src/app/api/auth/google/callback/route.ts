import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  exchangeGoogleCode,
  resolveUserFromDatabase,
  ensureAuthUserAndSyncMetadata,
  isGoogleAuthConfigured,
} from '@/lib/google-auth'
import { isAllowedEmail, OFFICIAL_COLLEGE_DOMAIN } from '@/lib/auth'

const STATE_COOKIE = 'google_oauth_state'
const USER_COOKIE = 'comp_dash_user'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30

interface GoogleState {
  nonce?: string
  next?: string
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const stateParam = searchParams.get('state')
  const googleError = searchParams.get('error')

  const fail = (error: string, message: string) => {
    const url = new URL('/sign-in', request.url)
    url.searchParams.set('error', error)
    url.searchParams.set('message', message)
    const response = NextResponse.redirect(url)
    response.cookies.set(STATE_COOKIE, '', { path: '/', maxAge: 0 })
    return response
  }

  if (googleError) {
    return fail('google_denied', 'Google sign in was cancelled.')
  }

  if (!isGoogleAuthConfigured()) {
    return fail(
      'google_not_configured',
      'Google sign in is not configured on this server.'
    )
  }

  const storedState = request.cookies.get(STATE_COOKIE)?.value
  if (!code || !stateParam || !storedState || stateParam !== storedState) {
    return fail(
      'google_invalid_state',
      'The sign in request has expired. Please try again.'
    )
  }

  try {
    const googleUser = await exchangeGoogleCode(code)
    const email = googleUser.email.trim().toLowerCase()

    if (!googleUser.email_verified) {
      return fail(
        'google_email_unverified',
        'Your Google email must be verified before signing in.'
      )
    }

    if (!isAllowedEmail(email)) {
      return fail(
        'google_domain_denied',
        `Only @${OFFICIAL_COLLEGE_DOMAIN} accounts can sign in. You signed in with ${email}.`
      )
    }

    // Fetch the user's record from the database to verify the account and
    // resolve the correct role + department.
    const resolved = await resolveUserFromDatabase(email)
    if (resolved.denied) {
      return fail(
        'google_access_denied',
        resolved.reason || 'This account is not authorized to sign in.'
      )
    }

    // Create (or update) the Supabase auth user with the DB-resolved role so the
    // session token below carries the correct role claims immediately.
    await ensureAuthUserAndSyncMetadata(email, {
      name: resolved.name,
      role: resolved.role,
      department: resolved.department,
    })

    const supabase = createSupabaseServerClient()
    const { error: signInError } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: googleUser.idToken,
      access_token: googleUser.accessToken,
    })

    if (signInError) {
      console.error('Google signInWithIdToken error:', signInError)
      return fail(
        'google_provider_unconfigured',
        'Google sign in could not be completed. Ask an administrator to enable the Google provider in Supabase (Auth → Providers) with the same Google client ID, then try again.'
      )
    }

    const profile = {
      email,
      name: resolved.name,
      role: resolved.role,
      department: resolved.department,
    }

    const next = resolveNext(stateParam)
    const response = NextResponse.redirect(new URL(next, request.url))

    response.cookies.set(USER_COOKIE, JSON.stringify(profile), {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_MAX_AGE,
    })
    response.cookies.set(STATE_COOKIE, '', { path: '/', maxAge: 0 })

    return response
  } catch (err) {
    console.error('Google sign-in callback error:', err)
    return fail('google_auth_failed', 'Google sign in failed. Please try again.')
  }
}

function resolveNext(stateParam: string): string {
  try {
    const parsed = JSON.parse(
      Buffer.from(stateParam, 'base64url').toString()
    ) as GoogleState
    const next = parsed.next || '/dashboard'
    return next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
  } catch {
    return '/dashboard'
  }
}
