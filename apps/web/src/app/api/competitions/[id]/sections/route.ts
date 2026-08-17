import { apiOk, apiError } from '@/lib/api-response'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { supabase as anonClient } from '@/lib/supabase-client'
import { activeEligibleYears, normalizeSection, yearNumberToLabel } from '@comp-dash/utils'
import type { CompetitionSectionsResponse } from '@comp-dash/types'
import { fetchAllRows } from '@/lib/fetch-all-rows'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

/**
 * Section-wise registration breakdown for one competition, supporting Year filtering.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const competitionId = params.id
  if (!competitionId) {
    return apiError('BAD_REQUEST', 'Missing competition id', 400)
  }

  const url = new URL(request.url)
  const rawYear = url.searchParams.get('year') || 'all'

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

  let targetYears: string[] = []

  if (rawYear === '2' || rawYear.includes('2nd') || rawYear.includes('Second')) {
    targetYears = ['2nd Year']
  } else if (rawYear === '3' || rawYear.includes('3rd') || rawYear.includes('Third')) {
    targetYears = ['3rd Year']
  } else {
    const eligible = activeEligibleYears(compRes.data.eligible_year)
    if (eligible.excludesAllActive) {
      return apiOk<CompetitionSectionsResponse>({
        competitionId,
        eligibleYears: [],
        sections: [],
        notEligible: true,
      })
    }
    targetYears = eligible.yearLabels.length > 0 ? eligible.yearLabels : ['2nd Year', '3rd Year']
  }

  let studentQuery = db
    .from('students')
    .select('id,name,email,department,section,year')

  if (targetYears.length > 0) {
    studentQuery = studentQuery.in('year', targetYears)
  }

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
    eligibleYears: targetYears,
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
