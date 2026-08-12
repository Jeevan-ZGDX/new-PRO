import { apiOk, apiError } from '@/lib/api-response'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { supabase as anonClient } from '@/lib/supabase-client'
import { getSessionUser } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/fetch-all-rows'
import {
  normalizeSection,
  storedSectionVariants,
  parseEligibleYears,
  yearNumberToLabel,
} from '@comp-dash/utils'
import type {
  AdvisorCompetitionRosterResponse,
  AdvisorSectionRoster,
  AdvisorStudentRow,
  AdvisorStudentStatus,
} from '@comp-dash/types'

export const dynamic = 'force-dynamic'
// `dynamic` only controls route rendering. supabase-js goes through `fetch`,
// which Next caches separately, so without this a query's first result was
// replayed forever and rows written later stayed invisible.
export const fetchCache = 'force-no-store'

/**
 * Which academic year this roster covers. Scoped to 3rd year for now; the
 * section prefix convention ("3%A") and the advisors table both only cover it.
 * Overridable per-request with ?year=3 so widening later needs no code change.
 */
const DEFAULT_YEAR_NUMBER = 3

function mapStatus(verificationStatus: string | null | undefined): AdvisorStudentStatus {
  if (!verificationStatus) return 'not_registered'
  const s = verificationStatus.trim().toLowerCase()
  if (s === 'verified') return 'verified'
  if (s === 'rejected') return 'rejected'
  return 'registered'
}

/**
 * The advisor's own roster for one competition: every student in the sections
 * they are assigned, with each student's registration status.
 *
 * The advisor is resolved from the signed-in session, never from a query
 * param — otherwise any caller could read another advisor's roster.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const competitionId = params.id
  if (!competitionId) {
    return apiError('BAD_REQUEST', 'Missing competition id', 400)
  }

  const sessionUser = await getSessionUser()
  const email = sessionUser?.email?.trim().toLowerCase()
  if (!email) {
    return apiError('UNAUTHENTICATED', 'Not authenticated', 401)
  }

  const db = createSupabaseAdminClient() ?? anonClient
  if (!db) return apiError('NOT_CONFIGURED', 'Supabase not configured', 500)

  // ── Advisor row (identity → assigned sections) ──────────────────────────
  const advisorRes = await db
    .from('advisors')
    .select('id,name,email,department,assigned_sections')
    .ilike('email', email)
    .maybeSingle()

  if (advisorRes.error) {
    return apiError('DB_ERROR', advisorRes.error.message, 500)
  }
  if (!advisorRes.data) {
    return apiError(
      'ADVISOR_NOT_MAPPED',
      'No advisor record is mapped to this account',
      404,
      { detail: `No row in public.advisors has email ${email}.` }
    )
  }
  const advisor = advisorRes.data

  // advisors.assigned_sections stores bare labels ("A"), students.section stores
  // them year-prefixed ("3%A"). Comparing them directly matches nothing.
  const assignedSections: string[] = ((advisor.assigned_sections ?? []) as string[])
    .map((s) => normalizeSection(s))
    .filter((s): s is string => Boolean(s))
    .sort((a, b) => a.localeCompare(b))

  // ── Competition + eligibility ───────────────────────────────────────────
  const compRes = await db
    .from('competition_dashboard')
    .select('id, competition_name, eligible_year')
    .eq('id', competitionId)
    .maybeSingle()

  if (compRes.error) {
    return apiError('DB_ERROR', compRes.error.message, 500)
  }
  if (!compRes.data) {
    return apiError('NOT_FOUND', 'Competition not found', 404)
  }

  const eligible = parseEligibleYears(compRes.data.eligible_year)
  const yearNumber = Number(new URL(request.url).searchParams.get('year')) || DEFAULT_YEAR_NUMBER
  const yearScope = yearNumberToLabel(yearNumber)

  const base = {
    competitionId,
    competitionName: compRes.data.competition_name ?? '',
    eligibleYears: eligible.yearLabels,
    openToAllYears: eligible.openToAllYears,
    advisor: {
      id: advisor.id,
      name: advisor.name,
      email: advisor.email,
      department: advisor.department ?? 'CSE',
      assignedSections,
    },
    yearScope,
  }

  // An advisor with no sections has no roster — report it rather than
  // returning an empty list that looks like "nobody registered".
  if (assignedSections.length === 0) {
    const empty: AdvisorCompetitionRosterResponse = {
      ...base,
      totals: { totalStudents: 0, registeredCount: 0, verifiedCount: 0, notRegisteredCount: 0 },
      sections: [],
    }
    return apiOk(empty)
  }

  // Competition not open to this year: say so explicitly.
  if (!eligible.openToAllYears && !eligible.yearNumbers.includes(yearNumber)) {
    const notEligible: AdvisorCompetitionRosterResponse = {
      ...base,
      totals: { totalStudents: 0, registeredCount: 0, verifiedCount: 0, notRegisteredCount: 0 },
      sections: [],
      notEligible: true,
    }
    return apiOk(notEligible)
  }

  // ── Students in the advisor's sections ──────────────────────────────────
  // Both spellings are queried, then filtered by year — normalizing alone would
  // pull 1st-year "A" in alongside 3rd-year "3%A".
  const sectionVariants = assignedSections.flatMap((s) => storedSectionVariants(s))

  const students = await fetchAllRows<{
    id: string
    name: string
    email: string
    department: string | null
    section: string | null
    year: string | null
  }>(
    db
      .from('students')
      .select('id,name,email,department,section,year')
      .eq('year', yearScope)
      .in('section', sectionVariants)
      .order('name')
  )
  if (students.error) {
    return apiError('DB_ERROR', students.error, 500)
  }

  // ── Registration status for this competition ────────────────────────────
  const registrations = await fetchAllRows<{
    student_email: string | null
    verification_status: string | null
    created_at: string | null
    verified_at: string | null
  }>(
    db
      .from('student_competitions')
      .select('student_email, verification_status, created_at, verified_at')
      .eq('competition_id', competitionId)
  )
  if (registrations.error) {
    return apiError('DB_ERROR', registrations.error, 500)
  }

  const regByEmail = new Map<string, (typeof registrations.rows)[number]>()
  for (const reg of registrations.rows) {
    const key = String(reg.student_email ?? '').trim().toLowerCase()
    if (!key) continue
    // Keep the most advanced record if a student somehow has duplicates.
    const existing = regByEmail.get(key)
    if (!existing || (!existing.verified_at && reg.verified_at)) regByEmail.set(key, reg)
  }

  // ── Group into sections ─────────────────────────────────────────────────
  const bySection = new Map<string, AdvisorStudentRow[]>()
  for (const section of assignedSections) bySection.set(section, [])

  for (const student of students.rows) {
    const section = normalizeSection(student.section)
    const bucket = bySection.get(section)
    if (!bucket) continue // section outside this advisor's assignment

    const reg = regByEmail.get(String(student.email ?? '').trim().toLowerCase())
    bucket.push({
      id: student.id,
      name: student.name,
      email: student.email,
      section,
      year: student.year ?? yearScope,
      department: student.department ?? 'CSE',
      status: mapStatus(reg?.verification_status),
      verificationStatus: reg?.verification_status ?? null,
      registeredAt: reg?.created_at ?? null,
      verifiedAt: reg?.verified_at ?? null,
    })
  }

  const sections: AdvisorSectionRoster[] = assignedSections.map((section) => {
    const rows = bySection.get(section) ?? []
    const verifiedCount = rows.filter((r) => r.status === 'verified').length
    const registeredCount = rows.filter(
      (r) => r.status === 'registered' || r.status === 'verified'
    ).length
    return {
      section,
      totalCount: rows.length,
      registeredCount,
      verifiedCount,
      notRegisteredCount: rows.length - registeredCount,
      students: rows,
    }
  })

  const response: AdvisorCompetitionRosterResponse = {
    ...base,
    totals: {
      totalStudents: sections.reduce((n, s) => n + s.totalCount, 0),
      registeredCount: sections.reduce((n, s) => n + s.registeredCount, 0),
      verifiedCount: sections.reduce((n, s) => n + s.verifiedCount, 0),
      notRegisteredCount: sections.reduce((n, s) => n + s.notRegisteredCount, 0),
    },
    sections,
  }

  return apiOk(response)
}
