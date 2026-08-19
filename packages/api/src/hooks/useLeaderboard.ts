import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient, isSupabaseEnabled } from '../supabase-manager'
import { apiClient } from '../client'
import type { PrizeLeaderboardEntry, RecentWinnerEntry } from '@comp-dash/types'

function extractNumericPrize(prizeStr: string): number {
  if (!prizeStr) return 0

  const upper = prizeStr.toUpperCase()

  const croreMatch = upper.match(/([\d,.]+)\s*CRORE/)
  if (croreMatch) return parseFloat(croreMatch[1].replace(/,/g, '')) * 10000000

  const lakhMatch = upper.match(/([\d,.]+)\s*LAKH/)
  if (lakhMatch) return parseFloat(lakhMatch[1].replace(/,/g, '')) * 100000

  const rupeeMatch = upper.match(/₹\s*([\d,]+)/)
  if (rupeeMatch) return parseFloat(rupeeMatch[1].replace(/,/g, ''))

  const dollarMatch = prizeStr.match(/\$\s*([\d,]+)/)
  if (dollarMatch) return parseFloat(dollarMatch[1].replace(/,/g, ''))

  const numMatch = prizeStr.match(/([\d,]+)/)
  if (numMatch) return parseFloat(numMatch[1].replace(/,/g, ''))

  return 0
}

async function fetchPrizeLeaderboardFromSupabase(): Promise<PrizeLeaderboardEntry[]> {
  const sb = getSupabaseClient()
  if (!sb) return []

  const { data: winners, error } = await sb
    .from('winners')
    .select('student_name, email, competition, prize, date')
    .order('date', { ascending: false })

  if (error || !winners?.length) return []

  // Fetch student sections for these emails
  const emails = [...new Set(winners.map(w => w.email?.toLowerCase().trim()).filter(Boolean))]
  const { data: studentsData } = await sb
    .from('students')
    .select('email, section')
    .in('email', emails)

  const sectionByEmail = new Map<string, string>()
  for (const s of studentsData || []) {
    sectionByEmail.set(s.email?.toLowerCase().trim() || '', s.section || '')
  }

  const prizeByEmail = new Map<string, { totalPrize: number; studentName: string; competitions: string[]; section: string }>()

  for (const w of winners) {
    const email = (w.email || '').toLowerCase().trim()
    if (!email) continue
    const section = sectionByEmail.get(email) || ''
    const existing = prizeByEmail.get(email) || { totalPrize: 0, studentName: w.student_name || '', competitions: [], section }
    existing.totalPrize += extractNumericPrize(w.prize || '')
    if (w.competition && !existing.competitions.includes(w.competition)) {
      existing.competitions.push(w.competition)
    }
    prizeByEmail.set(email, existing)
  }

  const entries = Array.from(prizeByEmail.entries())
    .map(([email, data]) => ({
      studentName: data.studentName,
      email,
      section: data.section,
      competitionsWon: data.competitions.length,
      totalPrizeAmount: data.totalPrize,
    }))
    .sort((a, b) => b.totalPrizeAmount - a.totalPrizeAmount)
    .slice(0, 25)
    .map((e, i) => ({ rank: i + 1, ...e }))

  return entries
}

async function fetchRecentWinnersFromSupabase(): Promise<RecentWinnerEntry[]> {
  const sb = getSupabaseClient()
  if (!sb) return []

  const { data: winners, error } = await sb
    .from('winners')
    .select('student_name, email, competition, position, prize, date')
    .order('date', { ascending: false })
    .limit(25)

  if (error || !winners?.length) return []

  // Fetch student sections for these emails
  const emails = [...new Set(winners.map(w => w.email?.toLowerCase().trim()).filter(Boolean))]
  const { data: studentsData } = await sb
    .from('students')
    .select('email, section')
    .in('email', emails)

  const sectionByEmail = new Map<string, string>()
  for (const s of studentsData || []) {
    sectionByEmail.set(s.email?.toLowerCase().trim() || '', s.section || '')
  }

  return winners.map((w, i) => ({
    rank: i + 1,
    studentName: w.student_name || '',
    email: w.email || '',
    section: sectionByEmail.get(w.email?.toLowerCase().trim() || '') || '',
    competition: w.competition || '',
    prize: w.prize || '',
    date: w.date || '',
  }))
}

export function usePrizeLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard', 'prize'],
    queryFn: () => {
      if (isSupabaseEnabled()) return fetchPrizeLeaderboardFromSupabase()
      return apiClient.get<PrizeLeaderboardEntry[]>('/leaderboard')
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useRecentWinners() {
  return useQuery({
    queryKey: ['leaderboard', 'recent-winners'],
    queryFn: () => {
      if (isSupabaseEnabled()) return fetchRecentWinnersFromSupabase()
      return apiClient.get<RecentWinnerEntry[]>('/leaderboard/recent-winners')
    },
    staleTime: 2 * 60 * 1000,
  })
}