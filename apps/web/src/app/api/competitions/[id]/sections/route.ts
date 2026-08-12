import { apiOk, apiError } from '@/lib/api-response'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { supabase as anonClient } from '@/lib/supabase-client'
import { activeEligibleYears, normalizeSection } from '@comp-dash/utils'
import type { CompetitionSectionsResponse } from '@comp-dash/types'
import { fetchAllRows } from '@/lib/fetch-all-rows'

export const dynamic = 'force-dynamic'
// `dynamic` only controls route rendering. supabase-js goes through `fetch`,
// which Next caches separately, so without this a query's first result was
// replayed forever and rows written later stayed invisible.
export const fetchCache = 'force-no-store'

/**
 * Section-wise registration breakdown for one competition.
 *
 * Registration status is joined through `student_competitions.student_email`
 * → `students.email`; `student_competitions` has no section column of its own.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  // Read the id from the route params. Deriving it from the pathname breaks here
  // because the last segment is "sections", not the competition id.
  const competitionId = params.id
  if (!competitionId) {
    return apiError('BAD_REQUEST', 'Missing competition id', 400)
  }

  const db = createSupabaseAdminClient() ?? anonClient
  if (!db) return apiError('NOT_CONFIGURED', 'Supabase not configured', 500)

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

  // eligible_year holds Roman numerals ("I, II, III, IV") plus free text
  // ("StartUp", "Startups, MSME") — it is never a students.year label, so it has
  // to be translated before it can filter students.
  //
  // Then intersect with the cohorts we actually report on. Without that, a
  // competition open to "I, II, III, IV" pulled in both stored section
  // conventions — bare 1st-year "A" and prefixed 3rd-year "3%A" both normalize
  // to "A" — so every section double-counted (A showed 127 instead of 65).
  const eligible = activeEligibleYears(compRes.data.eligible_year)

  if (eligible.excludesAllActive) {
    return apiOk<CompetitionSectionsResponse>({
      competitionId,
      eligibleYears: [],
      sections: [],
      notEligible: true,
    })
  }

  const studentQuery = db
    .from('students')
    .select('id,name,email,department,section,year')
    .in('year', eligible.yearLabels)

  // Paginated: PostgREST caps a plain select at 1000 rows and there are 2,200+ students.
  const students = await fetchAllRows(studentQuery)
  if (students.error) {
    return apiError('DB_ERROR', students.error, 500)
  }

  const registrations = await fetchAllRows(
    db
      .from('student_competitions')
      .select('student_email, verification_status')
      .eq('competition_id', competitionId)
  )
  if (registrations.error) {
    return apiError('DB_ERROR', registrations.error, 500)
  }

  const statusByEmail = new Map<string, string>()
  for (const reg of registrations.rows) {
    const email = String(reg.student_email ?? '').trim().toLowerCase()
    if (email) statusByEmail.set(email, reg.verification_status ?? 'pending')
  }

  const sectionMap = new Map<
    string,
    { total: number; registered: number; details: CompetitionSectionsResponse['sections'][number]['registered'] }
  >()

  for (const student of students.rows) {
    const section = normalizeSection(student.section) || 'Unassigned'
    let entry = sectionMap.get(section)
    if (!entry) {
      entry = { total: 0, registered: 0, details: [] }
      sectionMap.set(section, entry)
    }
    entry.total++

    const status = statusByEmail.get(String(student.email ?? '').trim().toLowerCase())
    if (status) {
      entry.registered++
      entry.details!.push({
        id: student.id,
        name: student.name,
        email: student.email,
        department: student.department,
        section,
      })
    }
  }

  const response: CompetitionSectionsResponse = {
    competitionId,
    eligibleYears: eligible.yearLabels,
    sections: Array.from(sectionMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([section, { total, registered, details }]) => ({
        section,
        totalCount: total,
        registeredCount: registered,
        registered: registered > 0 ? details : null,
      })),
  }

  return apiOk(response)
}
