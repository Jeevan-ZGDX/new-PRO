import { apiOk, apiError } from '@/lib/api-response'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { supabase as anonClient } from '@/lib/supabase-client'
import { getSessionUser } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/fetch-all-rows'
import { normalizeSection, storedSectionVariants, yearNumberToLabel } from '@comp-dash/utils'
import type { AdvisorRecentRegistration, AdvisorSummaryResponse } from '@comp-dash/types'

export const dynamic = 'force-dynamic'
// `dynamic` only controls route rendering. supabase-js goes through `fetch`,
// which Next caches separately, so without this a query's first result was
// replayed forever and rows written later stayed invisible.
export const fetchCache = 'force-no-store'

const DEFAULT_YEAR_NUMBER = 3
/** How many recent registrations to return for the activity table. */
const RECENT_LIMIT = 20

/**
 * Dashboard summary for the signed-in advisor, across every competition.
 *
 * Reads `student_competitions` — the table the app actually writes
 * registrations to. The older `/advisor/dashboard/stats` handler counted the
 * legacy `registrations` table, which is empty, so the dashboard rendered
 * zeroes even when an advisor's students had registered.
 */
export async function GET(request: Request) {
  const sessionUser = await getSessionUser()
  const email = sessionUser?.email?.trim().toLowerCase()
  if (!email) return apiError('UNAUTHENTICATED', 'Not authenticated', 401)

  const db = createSupabaseAdminClient() ?? anonClient
  if (!db) return apiError('NOT_CONFIGURED', 'Supabase not configured', 500)

  const advisorRes = await db
    .from('advisors')
    .select('id,name,email,department,assigned_sections')
    .ilike('email', email)
    .maybeSingle()
  if (advisorRes.error) return apiError('DB_ERROR', advisorRes.error.message, 500)
  if (!advisorRes.data) {
    return apiError('ADVISOR_NOT_MAPPED', 'No advisor record is mapped to this account', 404, {
      detail: `No row in public.advisors has email ${email}.`,
    })
  }
  const advisor = advisorRes.data

  const assignedSections: string[] = ((advisor.assigned_sections ?? []) as string[])
    .map((s) => normalizeSection(s))
    .filter((s): s is string => Boolean(s))
    .sort((a, b) => a.localeCompare(b))

  const yearNumber = Number(new URL(request.url).searchParams.get('year')) || DEFAULT_YEAR_NUMBER
  const yearScope = yearNumberToLabel(yearNumber)

  const base = {
    advisor: {
      id: advisor.id,
      name: advisor.name,
      email: advisor.email,
      department: advisor.department ?? 'CSE',
      assignedSections,
    },
    yearScope,
  }

  if (assignedSections.length === 0) {
    return apiOk<AdvisorSummaryResponse>({
      ...base,
      totals: {
        totalStudents: 0,
        registeredStudents: 0,
        verifiedRegistrations: 0,
        pendingRegistrations: 0,
        rejectedRegistrations: 0,
        totalRegistrations: 0,
        competitionsEntered: 0,
      },
      sections: [],
      recentRegistrations: [],
    })
  }

  const students = await fetchAllRows<{
    id: string
    name: string
    email: string
    section: string | null
  }>(
    db
      .from('students')
      .select('id,name,email,section')
      .eq('year', yearScope)
      .in('section', assignedSections.flatMap((s) => storedSectionVariants(s)))
  )
  if (students.error) return apiError('DB_ERROR', students.error, 500)

  const byEmail = new Map(
    students.rows.map((s) => [String(s.email ?? '').trim().toLowerCase(), s])
  )

  // One pass over this advisor's students' registrations, across all competitions.
  const emails = [...byEmail.keys()]
  const registrations: Array<{
    student_email: string | null
    student_name: string | null
    competition_id: string | null
    verification_status: string | null
    created_at: string | null
    verified_at: string | null
  }> = []

  // Chunked: a single .in() with 1000+ values overflows the query string.
  const CHUNK = 200
  for (let i = 0; i < emails.length; i += CHUNK) {
    const slice = emails.slice(i, i + CHUNK)
    const page = await fetchAllRows<(typeof registrations)[number]>(
      db
        .from('student_competitions')
        .select('student_email, student_name, competition_id, verification_status, created_at, verified_at')
        .in('student_email', slice)
    )
    if (page.error) return apiError('DB_ERROR', page.error, 500)
    registrations.push(...page.rows)
  }

  const competitionIds = new Set<string>()
  const registeredStudentEmails = new Set<string>()
  let verified = 0
  let pending = 0
  let rejected = 0

  for (const reg of registrations) {
    const key = String(reg.student_email ?? '').trim().toLowerCase()
    if (!byEmail.has(key)) continue
    registeredStudentEmails.add(key)
    if (reg.competition_id) competitionIds.add(reg.competition_id)
    const status = (reg.verification_status ?? '').toLowerCase()
    if (status === 'verified') verified++
    else if (status === 'rejected') rejected++
    else pending++
  }

  // Per-section rollup.
  const sectionBuckets = new Map<string, { total: number; registered: Set<string>; verified: number }>()
  for (const section of assignedSections) {
    sectionBuckets.set(section, { total: 0, registered: new Set(), verified: 0 })
  }
  for (const student of students.rows) {
    const bucket = sectionBuckets.get(normalizeSection(student.section))
    if (bucket) bucket.total++
  }
  for (const reg of registrations) {
    const key = String(reg.student_email ?? '').trim().toLowerCase()
    const student = byEmail.get(key)
    if (!student) continue
    const bucket = sectionBuckets.get(normalizeSection(student.section))
    if (!bucket) continue
    bucket.registered.add(key)
    if ((reg.verification_status ?? '').toLowerCase() === 'verified') bucket.verified++
  }

  // Competition names for the activity table.
  const nameById = new Map<string, string>()
  if (competitionIds.size) {
    const comps = await fetchAllRows<{ id: string; competition_name: string | null }>(
      db.from('competition_dashboard').select('id,competition_name').in('id', [...competitionIds])
    )
    if (!comps.error) {
      for (const c of comps.rows) nameById.set(c.id, c.competition_name ?? c.id)
    }
  }

  const recentRegistrations = registrations
    .filter((r) => byEmail.has(String(r.student_email ?? '').trim().toLowerCase()))
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .slice(0, RECENT_LIMIT)
    .map((r) => {
      const student = byEmail.get(String(r.student_email ?? '').trim().toLowerCase())!
      const raw = (r.verification_status ?? '').toLowerCase()
      const status: AdvisorRecentRegistration['status'] =
        raw === 'verified' ? 'verified' : raw === 'rejected' ? 'rejected' : 'pending'
      return {
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        section: normalizeSection(student.section),
        competitionId: r.competition_id ?? '',
        competitionName: r.competition_id ? nameById.get(r.competition_id) ?? r.competition_id : '',
        status,
        registeredAt: r.created_at,
        verifiedAt: r.verified_at,
      }
    })

  return apiOk<AdvisorSummaryResponse>({
    ...base,
    totals: {
      totalStudents: students.rows.length,
      registeredStudents: registeredStudentEmails.size,
      verifiedRegistrations: verified,
      pendingRegistrations: pending,
      rejectedRegistrations: rejected,
      totalRegistrations: registrations.length,
      competitionsEntered: competitionIds.size,
    },
    sections: assignedSections.map((section) => {
      const b = sectionBuckets.get(section)!
      return {
        section,
        totalCount: b.total,
        registeredCount: b.registered.size,
        verifiedCount: b.verified,
        notRegisteredCount: b.total - b.registered.size,
      }
    }),
    recentRegistrations,
  })
}
