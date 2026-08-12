import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

export const OFFICIAL_COLLEGE_DOMAIN = 'citchennai.net'

export function isAllowedEmail(email: string): boolean {
  const clean = email.trim().toLowerCase()
  return clean.endsWith(`@${OFFICIAL_COLLEGE_DOMAIN.toLowerCase()}`)
}

export type UserRole = 'student' | 'advisor' | 'hod' | 'super_admin'

export interface CurrentUser {
  email: string
  role: UserRole
  name: string
  department: string
}

export function normalizeRole(role: unknown): UserRole {
  return role === 'advisor' || role === 'hod' || role === 'super_admin' ? role : 'student'
}

const USER_COOKIE = 'comp_dash_user'

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))
  if (!match) return null
  try {
    return decodeURIComponent(match.slice(name.length + 1))
  } catch {
    return match.slice(name.length + 1)
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'))
  } catch {
    return null
  }
}

/**
 * Synchronously reads the current user from the `comp_dash_user` cookie that the
 * middleware sets for every authenticated request. Falls back to decoding the
 * Supabase access-token cookie so callers work even before the first middleware pass.
 */
export function getCurrentUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null

  const fromCookie = readCookie(USER_COOKIE)
  if (fromCookie) {
    try {
      const parsed = JSON.parse(fromCookie)
      if (parsed?.email) {
        return {
          email: parsed.email,
          role: normalizeRole(parsed.role),
          name: parsed.name || parsed.email.split('@')[0],
          department: parsed.department || '',
        }
      }
    } catch {
      // fall through to JWT decoding
    }
  }

  // Fallback: decode the Supabase session cookie (sb-<ref>-auth-token).
  const sessionCookie = document.cookie
    .split('; ')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith('sb-') && entry.includes('-auth-token='))
  if (sessionCookie) {
    try {
      const raw = sessionCookie.slice(sessionCookie.indexOf('=') + 1)
      const decoded = decodeURIComponent(raw)
      const [accessToken] = JSON.parse(decoded)
      const claims = accessToken ? decodeJwtPayload(accessToken) : null
      const metadata = (claims?.user_metadata || {}) as Record<string, unknown>
      if (claims?.email) {
        const claimEmail = String(claims.email)
        return {
          email: claimEmail,
          role: normalizeRole(metadata.role),
          name: String(metadata.name || claimEmail.split('@')[0]),
          department: String(metadata.department || ''),
        }
      }
    } catch {
      return null
    }
  }

  return null
}

export function isAuthenticated(): boolean {
  return !!getCurrentUser()
}

export async function getSessionUser() {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function logoutUser(): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (supabase) {
    await supabase.auth.signOut()
  }
  if (typeof window !== 'undefined') {
    document.cookie = `${USER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
    localStorage.removeItem('auth_token')
    window.location.href = '/sign-in'
  }
}
