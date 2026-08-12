import { NextRequest, NextResponse } from 'next/server'
import {
  buildGoogleLoginUrl,
  isGoogleAuthConfigured,
} from '@/lib/google-auth'

const STATE_COOKIE = 'google_oauth_state'
const STATE_MAX_AGE = 10 * 60 // 10 minutes

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get('next') || '/dashboard'
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  if (!isGoogleAuthConfigured()) {
    const errorUrl = new URL('/sign-in', request.url)
    errorUrl.searchParams.set('error', 'google_not_configured')
    return NextResponse.redirect(errorUrl)
  }

  const state = Buffer.from(
    JSON.stringify({ nonce: crypto.randomUUID(), next: safeNext })
  ).toString('base64url')

  const response = NextResponse.redirect(buildGoogleLoginUrl(state))
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: STATE_MAX_AGE,
  })

  return response
}
