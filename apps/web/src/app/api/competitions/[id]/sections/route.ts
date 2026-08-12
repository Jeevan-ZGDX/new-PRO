import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'
import type { CompetitionSectionsResponse } from '@comp-dash/types'

/** Normalize section labels (strip "3%" prefix). */
function normalizeSection(section: string) {
  return section.startsWith('3%') ? section.slice(2) : section
}

/** Parse CSV of eligible years. */
function parseEligibleYears(eligible: string | null | undefined) {
  return eligible
    ? eligible.split(',').map(x => x.trim()).filter(Boolean)
    : []
}

export async function GET(request: NextRequest) {
  const competitionId = request.nextUrl.pathname.split('/').pop()
  if (!competitionId) return NextResponse.json({ error: 'Missing competition id' }, { status: 400 })
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  const compRes = await supabase
    .from('competition_dashboard')
    .select('eligible_year, competition_name')
    .eq('id', competitionId)
    .single()
  if (compRes.error || !compRes.data) {
    return NextResponse.json({ error: 'Competition not found' }, { status: 404 })
  }
  const { eligible_year: eligibleYearCsv } = compRes.data
  const eligibleYears = parseEligibleYears(eligibleYearCsv)

  const studentsRes = await supabase
    .from('students')
    .select('id,name,email,department,section,year')
    .in('year', eligibleYears)
  if (studentsRes.error || !studentsRes.data) {
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }
  const students = studentsRes.data

  const regRes = await supabase
    .from('student_competitions')
    .select('student_email,section')
    .eq('competition_id', competitionId)
  if (regRes.error) {
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 })
  }
  const registered = regRes.data || []

  const sectionMap = new Map<string, { total: number; registered: number; details: any[] }>()
  students.forEach(st => {
    const sec = normalizeSection(st.section ?? 'A')
    if (!sectionMap.has(sec)) {
      sectionMap.set(sec, { total: 0, registered: 0, details: [] })
    }
    const entry = sectionMap.get(sec)!
    entry.total++
  })

  registered.forEach(reg => {
    const sec = normalizeSection(reg.section ?? '')
    const entry = sectionMap.get(sec)
    if (entry) {
      entry.registered++
      // Find student for details
      const st = students.find(s => s.email === reg.student_email)
      if (st) {
        entry.details.push({
          id: st.email,
          name: st.name,
          email: st.email,
          department: st.department,
          section: sec,
        })
      }
    }
  })

  const sections = Array.from(sectionMap.entries()).map(([section, { total, registered, details }]) => ({
    section,
    totalCount: total,
    registeredCount: registered,
    registered: registered > 0 ? details : null,
  }))

  const response: CompetitionSectionsResponse = {
    competitionId,
    eligibleYears,
    sections,
  }

  return NextResponse.json(response)
}
