import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient | null = null

/**
 * Service-role Supabase client for server-side reads/writes.
 *
 * supabase-js talks over `fetch`, and Next's App Router adds its own data cache
 * on top of `fetch` — so identical queries returned the *first* response
 * indefinitely, even across requests. That made rows written after a route's
 * first call invisible: the section breakdown kept reporting 0 registrations
 * for a competition whose first lookup happened while the table was empty,
 * while a competition first queried after seeding reported the right number.
 * `export const dynamic = 'force-dynamic'` does not cover this; it controls
 * route rendering, not the fetch cache.
 *
 * The fix lives on each route instead: `export const fetchCache =
 * 'force-no-store'`, which is Next's own opt-out and does not interfere with
 * request bodies the way overriding supabase-js's fetch does.
 */
export function createSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !serviceKey) return null
  if (!adminClient) {
    adminClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  }
  return adminClient
}
