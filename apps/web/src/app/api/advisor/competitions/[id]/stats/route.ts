import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const competitionId = params.id
  if (!competitionId) {
    return NextResponse.json({ error: 'Missing competition id' }, { status: 400 })
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  // Fetch competition to get eligible_year
  const { data: competition, error: compError } = await supabase
    .from('competition_dashboard')
    .select('eligible_year')
    .eq('id', competitionId)
    .single()

  if (compError || !competition) {
    return NextResponse.json({ error: 'Competition not found' }, { status: 404 })
  }

  const eligibleYears = competition.eligible_year
    ? competition.eligible_year.split(',').map(y => y.trim()).filter(Boolean)
    : []

  if (eligibleYears.length === 0) {
    return NextResponse.json({
      totalStudents: 0,
      appliedStudents: 0,
      unregisteredStudents: 0,
      registrationsByDepartment: [],
      studentsWithDetails: [],
    })
  }

  // Total eligible students
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, name, email, department, section, year')
    .in('year', eligibleYears)

  if (studentsError) {
    console.error('Supabase fetch students error:', studentsError)
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }

  const totalStudents = students?.length || 0

  // Registrations for this competition
  const { data: registrations, error: regError } = await supabase
    .from('student_competitions')
    .select('student_email, section')
    .eq('competition_id', competitionId)

  if (regError) {
    console.error('Supabase fetch registrations error:', regError)
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 })
  }

  const registeredEmails = new Set((registrations || []).map(r => r.student_email))
  const appliedStudents = registeredEmails.size
  const unregisteredStudents = totalStudents - appliedStudents

  // Registrations by department
  const deptMap = new Map<string, number>()
  students?.forEach(s => {
    if (registeredEmails.has(s.email)) {
      deptMap.set(s.department, (deptMap.get(s.department) || 0) + 1)
    }
  })
  const registrationsByDepartment = Array.from(deptMap.entries()).map(([department, count]) => ({
    department,
    count,
  }))

  // Students with details (only registered)
  const studentsWithDetails = (students || [])
    .filter(s => registeredEmails.has(s.email))
    .map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      department: s.department,
      section: s.section,
      year: s.year,
    }))

  return NextResponse.json({
    totalStudents,
    appliedStudents,
    unregisteredStudents,
    registrationsByDepartment,
    studentsWithDetails,
  })
}