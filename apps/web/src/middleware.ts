import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import type { UserRole } from '@/lib/auth'

const PUBLIC_ROUTES = ['/', '/sign-in', '/sign-up', '/login', '/policy', '/terms']

function normalizeRole(role: unknown): UserRole {
  return role === 'advisor' || role === 'hod' || role === 'super_admin' ? role : 'student'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  if (pathname.startsWith('/_next')) return NextResponse.next()
  if (pathname.startsWith('/api')) return NextResponse.next()

  // Supabase not configured — let the app render and surface setup guidance in the UI.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next()
  }

  const { supabaseResponse, user } = await updateSession(request)

  if (isPublic) {
    return supabaseResponse
  }

  if (!user?.email) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  const metadata = (user.user_metadata || {}) as Record<string, unknown>
  const profile = {
    email: user.email,
    name: metadata.name || user.email.split('@')[0] || '',
    role: normalizeRole(metadata.role),
    department: metadata.department || '',
  }

  supabaseResponse.cookies.set('comp_dash_user', JSON.stringify(profile), {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  })

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!.*\\..*|_next|api).*)', '/'],
}
