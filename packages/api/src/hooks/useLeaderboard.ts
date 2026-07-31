import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient, isSupabaseEnabled } from '../supabase-manager'
import { apiClient } from '../client'
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

function yearToDigit(year: string): string {
  const match = year.match(/(\d+)/)
  const digit = match ? match[1] : '1'
  // shift 2nd Year → 2, 2nd year → 3, etc.
  return String(Number(digit) + 1)
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

  const { data: students } = await sb
    .from('students')
    .select('id, name, email, department, section, year')
    .order('name')

  const { data: winners } = await sb
    .from('winners')
    .select('student_name, email, competition, prize, date')
    .order('date', { ascending: false })

  if (!students) return []

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

  const entries: LeaderboardEntry[] = students.map((s) => {
    const email = (s.email || '').toLowerCase().trim()
    const winData = winsByEmail.get(email) || { count: 0, totalPrize: 0, recentComp: '', recentDate: '' }
    const yearDigit = email.includes('2024') ? '3' : email.includes('2025') ? '2' : yearToDigit(s.year || '1')
    return {
      rank: 0,
      studentName: s.name || '',
      email: s.email || '',
      department: s.department || '',
      section: `${yearDigit}${s.section || ''}`,
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
  const useSupabase = isSupabaseEnabled()

  return useQuery({
    queryKey: useSupabase ? ['supabase-leaderboard', 'overall'] : ['leaderboard', 'overall'],
    queryFn: () => {
      if (useSupabase) return fetchLeaderboardOverallFromSupabase()
      return apiClient.get<LeaderboardEntry[]>('/leaderboard/overall')
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useLeaderboardDepartment(params?: { department?: string }) {
  const useSupabase = isSupabaseEnabled()

  return useQuery({
    queryKey: useSupabase ? ['supabase-leaderboard', 'department', params] : ['leaderboard', 'department', params],
    queryFn: () => {
      if (useSupabase) return fetchDepartmentLeaderboardFromSupabase(params?.department)
      return apiClient.get<LeaderboardEntry[]>('/leaderboard/department', params as Record<string, unknown>)
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useLeaderboardDepartments() {
  const useSupabase = isSupabaseEnabled()

  return useQuery({
    queryKey: useSupabase ? ['supabase-leaderboard', 'departments'] : ['leaderboard', 'departments'],
    queryFn: () => {
      if (useSupabase) return fetchDepartmentsFromSupabase()
      return apiClient.get<DepartmentLeaderboardEntry[]>('/leaderboard/departments')
    },
    staleTime: 2 * 60 * 1000,
  })
}
