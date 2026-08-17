import { useQuery } from '@tanstack/react-query'
import type { LeaderboardEntry, DepartmentLeaderboardEntry } from '@comp-dash/types'

/**
 * Leaderboard hooks.
 *
 * These used to read Firestore straight from the browser: every student
 * document (1,087 in the active cohort) plus the whole `winners` collection, joined and
 * scored in JavaScript, on every visit, per user. Firestore bills per document
 * read, so a single page view cost ~1,088 reads against a 50k/day quota.
 *
 * The work now lives behind `GET /api/leaderboard`, which serves precomputed
 * rows from a small collection — 15 reads, cached server-side and shared by
 * every visitor.
 */

/** Mirrors LEADERBOARD_LIMIT on the server. */
export const LEADERBOARD_LIMIT = 15

/** Enough to cover every ranked student for aggregate views. */
const AGGREGATE_LIMIT = 200

async function fetchLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
  const response = await fetch(`/api/leaderboard?limit=${limit}`, {
    credentials: 'same-origin',
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || 'Could not load the leaderboard.')
  }

  const body = await response.json()
  return (body.data || []) as LeaderboardEntry[]
}

export function useLeaderboardOverall(limit: number = LEADERBOARD_LIMIT) {
  return useQuery({
    queryKey: ['leaderboard', 'overall', limit],
    queryFn: () => fetchLeaderboard(limit),
    staleTime: 2 * 60 * 1000,
  })
}

export function useLeaderboardDepartment(params?: { department?: string }) {
  return useQuery({
    queryKey: ['leaderboard', 'department', params],
    queryFn: async () => {
      const all = await fetchLeaderboard(AGGREGATE_LIMIT)
      const dept = params?.department
      if (!dept) return all
      return all.filter((e) => e.department === dept || e.section === dept)
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useLeaderboardDepartments() {
  return useQuery({
    queryKey: ['leaderboard', 'departments'],
    queryFn: async (): Promise<DepartmentLeaderboardEntry[]> => {
      const all = await fetchLeaderboard(AGGREGATE_LIMIT)
      const byDept = new Map<string, DepartmentLeaderboardEntry>()

      for (const entry of all) {
        const existing = byDept.get(entry.department) || {
          department: entry.department,
          totalPoints: 0,
          totalCompetitions: 0,
          totalWins: 0,
          studentCount: 0,
        }
        existing.totalPoints += entry.points
        existing.totalCompetitions += entry.competitionsCount
        existing.totalWins += entry.wins
        existing.studentCount++
        byDept.set(entry.department, existing)
      }

      return Array.from(byDept.values())
    },
    staleTime: 2 * 60 * 1000,
  })
}
