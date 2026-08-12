import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient, isSupabaseEnabled } from '../supabase-manager'
import { apiClient } from '../client'
import { ACTIVE_YEAR_LABELS, normalizeSection } from '@comp-dash/utils'
import type { LeaderboardEntry, DepartmentLeaderboardEntry } from '@comp-dash/types'

function parsePrizeValue(prizeStr: string): number {
  if (!prizeStr) return 0
  const cleaned = prizeStr
    .replace(/[₹,]/g, '')
    .replace(/\s*Lakhs?\s*/gi, '00000')
    .replace(/\s*Lakh\s*/gi, '00000')
    .replace(/\s*Crore\s*/gi, '0000000')
    .replace(/\+.*$/, '')
    .replace(/\s*Lakhs$/gi, '00000')
    .trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function extractNumericPrize(prizeStr: string): number {
  if (!prizeStr) return 0

  const upper = prizeStr.toUpperCase()

  // Handle Crore
  const croreMatch = upper.match(/([\d,.]+)\s*CRORE/)
  if (croreMatch) return parseFloat(croreMatch[1].replace(/,/g, '')) * 10000000

  // Handle Lakh/Lakhs
  const lakhMatch = upper.match(/([\d,.]+)\s*LAKH/)
  if (lakhMatch) return parseFloat(lakhMatch[1].replace(/,/g, '')) * 100000

  // Handle ₹ symbol with commas
  const rupeeMatch = upper.match(/₹\s*([\d,]+)/)
  if (rupeeMatch) return parseFloat(rupeeMatch[1].replace(/,/g, ''))

  // Handle $ symbol
  const dollarMatch = prizeStr.match(/\$\s*([\d,]+)/)
  if (dollarMatch) return parseFloat(dollarMatch[1].replace(/,/g, ''))

  // Handle bare numbers
  const numMatch = prizeStr.match(/([\d,]+)/)
  if (numMatch) return parseFloat(numMatch[1].replace(/,/g, ''))

  return 0
}

async function fetchLeaderboardOverallFromSupabase(): Promise<LeaderboardEntry[]> {
  const sb = getSupabaseClient()
  if (!sb) return []

  // Paged and scoped to the cohorts we report on. Previously this was an
  // unbounded select, so PostgREST's 1,000-row cap silently truncated 2,200+
  // students and every section count was partial.
  const students: any[] = []
  const PAGE = 1000
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await sb
      .from('students')
      .select('id, name, email, department, section, year')
      .in('year', ACTIVE_YEAR_LABELS as string[])
      .order('name')
      .range(offset, offset + PAGE - 1)
    if (error) break
    const batch = data ?? []
    students.push(...batch)
    if (batch.length < PAGE) break
  }

  const { data: winners } = await sb
    .from('winners')
    .select('student_name, email, competition, prize, date')
    .order('date', { ascending: false })

  if (!students.length) return []

  const winsByEmail = new Map<string, { count: number; totalPrize: number; recentComp: string; recentDate: string }>()

  for (const w of winners || []) {
    const email = (w.email || '').toLowerCase().trim()
    if (!email) continue
    const existing = winsByEmail.get(email) || { count: 0, totalPrize: 0, recentComp: '', recentDate: '' }
    existing.count++
    existing.totalPrize += extractNumericPrize(w.prize || '')
    if (!existing.recentDate || (w.date && w.date > existing.recentDate)) {
      existing.recentDate = w.date || ''
      existing.recentComp = w.competition || ''
    }
    winsByEmail.set(email, existing)
  }

  const entries: LeaderboardEntry[] = students.map((s: any) => {
    const email = (s.email || '').toLowerCase().trim()
    const winData = winsByEmail.get(email) || { count: 0, totalPrize: 0, recentComp: '', recentDate: '' }
    return {
      rank: 0,
      studentName: s.name || '',
      email: s.email || '',
      department: s.department || '',
      // Stored as "3%A" for 3rd year and bare "A" for 1st; normalize to "A".
      // The old code prepended a year digit guessed from the email batch, which
      // produced "33%A" for 3rd years and a phantom "2A" for 1st years.
      section: normalizeSection(s.section),
      points: winData.totalPrize,
      competitionsCount: winData.count,
      wins: winData.count,
      recentCompetition: winData.recentComp,
    }
  })

  entries.sort((a, b) => b.points - a.points || b.wins - a.wins)

  entries.forEach((e, i) => {
    e.rank = i + 1
  })

  return entries
}

async function fetchDepartmentLeaderboardFromSupabase(dept?: string): Promise<LeaderboardEntry[]> {
  const all = await fetchLeaderboardOverallFromSupabase()
  if (!dept) return all
  return all.filter((e) => e.department === dept || e.section === dept)
}

async function fetchDepartmentsFromSupabase(): Promise<DepartmentLeaderboardEntry[]> {
  const all = await fetchLeaderboardOverallFromSupabase()
  const deptMap = new Map<string, { totalPoints: number; totalCompetitions: number; totalWins: number; studentCount: number }>()

  for (const entry of all) {
    const dept = entry.department
    const existing = deptMap.get(dept) || { totalPoints: 0, totalCompetitions: 0, totalWins: 0, studentCount: 0 }
    existing.totalPoints += entry.points
    existing.totalCompetitions += entry.competitionsCount
    existing.totalWins += entry.wins
    existing.studentCount++
    deptMap.set(dept, existing)
  }

  return Array.from(deptMap.entries()).map(([dept, data]) => ({
    department: dept,
    totalPoints: data.totalPoints,
    totalCompetitions: data.totalCompetitions,
    totalWins: data.totalWins,
    studentCount: data.studentCount,
  }))
}

export function useLeaderboardOverall() {
  return useQuery({
    queryKey: ['leaderboard', 'overall'],
    // Resolved at fetch time, not render time: Providers registers the Supabase
    // client in an effect, so reading isSupabaseEnabled() during the first
    // render sent this down the apiClient path, which 404s because the
    // catch-all API has no /leaderboard route.
    queryFn: () => {
      if (isSupabaseEnabled()) return fetchLeaderboardOverallFromSupabase()
      return apiClient.get<LeaderboardEntry[]>('/leaderboard/overall')
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useLeaderboardDepartment(params?: { department?: string }) {
  return useQuery({
    queryKey: ['leaderboard', 'department', params],
    queryFn: () => {
      if (isSupabaseEnabled()) return fetchDepartmentLeaderboardFromSupabase(params?.department)
      return apiClient.get<LeaderboardEntry[]>('/leaderboard/department', params as Record<string, unknown>)
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useLeaderboardDepartments() {
  return useQuery({
    queryKey: ['leaderboard', 'departments'],
    queryFn: () => {
      if (isSupabaseEnabled()) return fetchDepartmentsFromSupabase()
      return apiClient.get<DepartmentLeaderboardEntry[]>('/leaderboard/departments')
    },
    staleTime: 2 * 60 * 1000,
  })
}
