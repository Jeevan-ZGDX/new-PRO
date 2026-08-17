'use client'

import { Card } from '@comp-dash/design-system'
import { useLeaderboardOverall, LEADERBOARD_LIMIT } from '@comp-dash/api'
import { Star } from 'lucide-react'

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-white font-bold text-xs shadow-sm">1</span>
  if (rank === 2) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-700 font-bold text-xs shadow-sm">2</span>
  if (rank === 3) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600 text-white font-bold text-xs shadow-sm">3</span>
  return <span className="text-sm font-semibold text-gray-500 dark:text-zinc-400 pl-2">#{rank}</span>
}

export default function LeaderboardPage() {
  const { data: overallData, isLoading } = useLeaderboardOverall()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Top {LEADERBOARD_LIMIT} by points
          </p>
        </div>
      </div>

      <Card padding="none" className="overflow-hidden bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-800">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400">
                  <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Rank</th>
                  <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Student</th>
                  <th className="text-right text-xs font-medium uppercase tracking-wider px-4 py-3">Points</th>
                  <th className="text-right text-xs font-medium uppercase tracking-wider px-4 py-3">Wins</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-zinc-800/50">
                      <td colSpan={4} className="px-4 py-4">
                        <div className="h-10 bg-gray-100 dark:bg-zinc-800/50 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : overallData && overallData.length > 0 ? (
                  overallData.map((entry) => (
                    <tr key={entry.rank} className="border-b border-gray-100 dark:border-zinc-800/60">
                      <td className="px-4 py-4">
                        <RankBadge rank={entry.rank} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                            <Star className="w-4 h-4 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{entry.studentName}</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-500">{entry.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-semibold text-accent">{entry.points}</span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-600 dark:text-zinc-400 font-medium">{entry.wins}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-gray-500 dark:text-zinc-500">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}
