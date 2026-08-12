import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import {
  OFFICIAL_COLLEGE_DOMAIN,
  normalizeRole,
  type UserRole,
} from '@/lib/auth'

export interface GoogleUserInfo {
  email: string
  email_verified: boolean
  name: string
  idToken: string
  accessToken: string
}

export interface ResolvedUser {
  email: string
  name: string
  role: UserRole
  department: string
  denied: boolean
  reason?: string
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ''

const GOOGLE_LOGIN_REDIRECT_URI =
  process.env.GOOGLE_LOGIN_REDIRECT_URI || `${APP_URL}/api/auth/google/callback`

const LOGIN_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ')

export function isGoogleAuthConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && APP_URL)
}

/**
 * Builds the Google OAuth consent URL. The `hd` (hosted domain) parameter tells
 * Google to only show accounts belonging to @citchennai.net in the account
 * picker. This is a UX filter — the actual gate is the server-side domain check
 * in the callback.
 */
export function buildGoogleLoginUrl(state: string): string {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', GOOGLE_CLIENT_ID!)
  url.searchParams.set('redirect_uri', GOOGLE_LOGIN_REDIRECT_URI)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', LOGIN_SCOPES)
  url.searchParams.set('access_type', 'online')
  url.searchParams.set('prompt', 'select_account')
  url.searchParams.set('hd', OFFICIAL_COLLEGE_DOMAIN)
  url.searchParams.set('state', state)
  return url.toString()
}

/**
 * Exchanges the authorization code for tokens and returns the authenticated
 * Google user's profile plus the raw ID token (used to mint a Supabase session).
 */
export async function exchangeGoogleCode(code: string): Promise<GoogleUserInfo> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth is not configured')
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: GOOGLE_LOGIN_REDIRECT_URI,
    }).toString(),
  })

  const tokens = await tokenResponse.json()

  if (!tokenResponse.ok || !tokens.access_token || !tokens.id_token) {
    throw new Error(
      tokens.error_description || tokens.error || 'Failed to exchange Google code'
    )
  }

  const userInfoResponse = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  )
  const userInfo = await userInfoResponse.json()

  if (!userInfoResponse.ok || !userInfo.email) {
    throw new Error('Failed to fetch Google user info')
  }

  // Defend against a mismatch between the ID token (what Supabase verifies) and
  // the userinfo email (what we use to look the user up in the database).
  const idTokenEmail = decodeIdTokenEmail(tokens.id_token)
  if (
    idTokenEmail &&
    idTokenEmail.toLowerCase() !== String(userInfo.email).toLowerCase()
  ) {
    throw new Error('Google identity mismatch')
  }

  return {
    email: String(userInfo.email),
    email_verified: Boolean(userInfo.verified_email),
    name: userInfo.name || String(userInfo.email).split('@')[0],
    idToken: tokens.id_token,
    accessToken: tokens.access_token,
  }
}

function decodeIdTokenEmail(token: string): string | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return claims?.email ? String(claims.email) : null
  } catch {
    return null
  }
}

/**
 * Looks the authenticated email up in the database to resolve the correct
 * role/department and to verify the account is allowed to sign in.
 *
 * Priority: `role_access` (the explicit allowlist) → `profiles` → `user_profiles`.
 * Anyone with a college email who is not listed defaults to the student role.
 */
export async function resolveUserFromDatabase(email: string): Promise<ResolvedUser> {
  const cleanEmail = email.trim().toLowerCase()
  const fallback: ResolvedUser = {
    email: cleanEmail,
    name: cleanEmail.split('@')[0],
    role: 'student',
    department: '',
    denied: false,
  }

  const admin = createSupabaseAdminClient()
  if (!admin) return fallback

  const { data: access } = await admin
    .from('role_access')
    .select('role, department, granted')
    .eq('email', cleanEmail)
    .maybeSingle()

  if (access) {
    if (!access.granted) {
      return {
        ...fallback,
        denied: true,
        reason: 'Your account has not been granted access yet. Contact an administrator.',
      }
    }
    return {
      ...fallback,
      role: normalizeRole(access.role),
      department: access.department || fallback.department,
    }
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('name, role, department')
    .eq('email', cleanEmail)
    .maybeSingle()

  if (profile) {
    return {
      ...fallback,
      name: profile.name || fallback.name,
      role: normalizeRole(profile.role),
      department: profile.department || fallback.department,
    }
  }

  const { data: legacy } = await admin
    .from('user_profiles')
    .select('full_name, role, department')
    .eq('email', cleanEmail)
    .maybeSingle()

  if (legacy) {
    return {
      ...fallback,
      name: legacy.full_name || fallback.name,
      role: normalizeRole(legacy.role),
      department: legacy.department || fallback.department,
    }
  }

  return fallback
}

/**
 * Ensures a confirmed Supabase auth user exists for the email and syncs the
 * DB-resolved role into their metadata BEFORE the session is minted, so the
 * session token carries the correct role claims from the very first request.
 */
export async function ensureAuthUserAndSyncMetadata(
  email: string,
  metadata: { name: string; role: UserRole; department: string }
): Promise<void> {
  const admin = createSupabaseAdminClient()
  if (!admin) throw new Error('Supabase admin client is not configured')

  const { data: created } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: metadata,
  })

  if (created?.user?.id) return

  // The user already exists (e.g. from a previous email/password sign-up) — sync metadata.
  const { data: usersData } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  const existing = usersData?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  )

  if (!existing) {
    throw new Error('Could not find or create the auth user')
  }

  const { error } = await admin.auth.admin.updateUserById(existing.id, {
    user_metadata: metadata,
  })
  if (error) throw error
}
