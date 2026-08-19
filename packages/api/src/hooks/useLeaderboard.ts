import { useQuery } from '@tanstack/react-query'
import { isSupabaseEnabled } from '../supabase-manager'
import { apiClient } from '../client'
import type { PrizeLeaderboardEntry, RecentWinnerEntry } from '@comp-dash/types'

// Use the new Firestore-based leaderboard endpoint
async function fetchPrizeLeaderboardFromFirestore(): Promise<PrizeLeaderboardEntry[]> {
  try {
    const response = await fetch('/api/leaderboard?type=prize&limit=25', {
      credentials: 'same-origin',
    })
    if (!response.ok) throw new Error('Failed to fetch prize leaderboard')
    const body = await response.json()
    return (body.data || []) as PrizeLeaderboardEntry[]
  } catch {
    return []
  }
}

async function fetchRecentWinnersFromFirestore(): Promise<RecentWinnerEntry[]> {
  try {
    const response = await fetch('/api/leaderboard?type=recent&limit=25', {
      credentials: 'same-origin',
    })
    if (!response.ok) throw new Error('Failed to fetch recent winners')
    const body = await response.json()
    return (body.data || []) as RecentWinnerEntry[]
  } catch {
    return []
  }
}

export function usePrizeLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard', 'prize'],
    queryFn: () => {
      if (isSupabaseEnabled()) {
        // Fallback to Supabase if enabled (legacy)
        return fetch('/api/leaderboard?type=prize&limit=25').then(r => r.json()).then(b => b.data || [])
      }
      return fetchPrizeLeaderboardFromFirestore()
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useRecentWinners() {
  return useQuery({
    queryKey: ['leaderboard', 'recent-winners'],
    queryFn: () => {
      if (isSupabaseEnabled()) {
        return fetch('/api/leaderboard?type=recent&limit=25').then(r => r.json()).then(b => b.data || [])
      }
      return fetchRecentWinnersFromFirestore()
    },
    staleTime: 2 * 60 * 1000,
  })
}