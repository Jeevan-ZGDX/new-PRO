'use client'

import { useState, useEffect } from 'react'
import { Card, Badge } from '@comp-dash/design-system'
import { useLeaderboardOverall, useCompetitionDashboard, useCompetitions } from '@comp-dash/api'
import type { LeaderboardEntry } from '@comp-dash/types'
import { Trophy, Users, Award, ChevronDown, Search, Medal, Star } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'

type Tab = 'overall' | 'department' | 'competition'

const tabs: { key: Tab; label: string; icon: typeof Trophy }[] = [
  { key: 'overall', label: 'Overall', icon: Trophy },
  { key: 'department', label: 'Section-wise', icon: Users },
  { key: 'competition', label: 'Competition-wise', icon: Award },
]

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Medal className="w-5 h-5 text-yellow-500" />
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
  return <span className="text-sm font-medium text-gray-500 w-5 text-center">{rank}</span>
}

export default function LeaderboardPage() {
  const [isStudent, setIsStudent] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('department')
  const [selectedComp, setSelectedComp] = useState('')

  useEffect(() => {
    const user = getCurrentUser()
    setIsStudent(user?.role === 'student')
  }, [])

  const { data: overallData, isLoading: overallLoading } = useLeaderboardOverall()
  const { data: compsData } = useCompetitions()

  const handleCompetitionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedComp(e.target.value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
      </div>

      <Card padding="none" className="overflow-hidden">
        {!isStudent && (
          <div className="flex border-b border-gray-100">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'text-accent border-b-2 border-accent bg-accent/5'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        )}

        <div className="p-6">
          {(activeTab === 'overall' || isStudent) && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Rank</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Student</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Section</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Points</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Competitions</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Wins</th>
                  </tr>
                </thead>
                <tbody>
                  {overallLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="h-10 bg-gray-100 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : overallData && overallData.length > 0 ? (
                    overallData.map((entry) => (
                      <tr key={entry.rank} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors even:bg-gray-50/30">
                        <td className="px-4 py-4">
                          <RankBadge rank={entry.rank} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                              <Star className="w-4 h-4 text-accent" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{entry.studentName}</p>
                              <p className="text-xs text-gray-500">{entry.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="primary" size="sm">
                            {entry.section || entry.department}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-semibold text-accent">{entry.points}</span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 max-w-[200px] truncate">
                          {entry.recentCompetition || '-'}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-gray-600">{entry.wins}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-500">No leaderboard data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'department' && (
            <SectionWiseLeaderboard data={overallData} loading={overallLoading} />
          )}

          {activeTab === 'competition' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <select
                  value={selectedComp}
                  onChange={handleCompetitionSelect}
                  className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                >
                  <option value="">Select a competition...</option>
                  {compsData?.data?.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              {selectedComp ? (
                <CompetitionLeaderboardTable competitionId={selectedComp} />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Select a competition to view rankings</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function SectionWiseLeaderboard({ data, loading }: { data: LeaderboardEntry[] | undefined; loading: boolean }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return <div className="text-center py-12 text-gray-500">No section data available</div>
  }

  const sections = [...new Set(data.map(e => e.section).filter(Boolean))].sort() as string[]

  const sectionData = sections.map(sec => {
    const students = data.filter(e => e.section === sec)
    const ranked = [...students].sort((a, b) => b.points - a.points || b.wins - a.wins)
      .map((s, i) => ({ ...s, rank: i + 1 }))
    const totalPts = students.reduce((sum, s) => sum + s.points, 0)
    const totalWins = students.reduce((sum, s) => sum + s.wins, 0)
    const topStudent = ranked[0]
    return { sec, students: ranked, totalPts, totalWins, studentCount: students.length, topStudent }
  })

  sectionData.sort((a, b) => b.totalPts - a.totalPts)

  return (
    <div className="space-y-4">
      {sectionData.map(({ sec, students, totalPts, totalWins, studentCount, topStudent }) => {
        const isExpanded = expandedSection === sec
        return (
          <div key={sec} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
              onClick={() => setExpandedSection(isExpanded ? null : sec)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Section {sec}</h3>
                    <p className="text-xs text-gray-500">{studentCount} students</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent">{totalPts.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Total Points</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-700">{totalWins}</p>
                    <p className="text-xs text-gray-400">Total Wins</p>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>
              {topStudent && !isExpanded && (
                <p className="text-xs text-gray-400 mt-2 ml-16">
                  Top: {topStudent.studentName} · {topStudent.points.toLocaleString()} pts
                </p>
              )}
            </div>

            {isExpanded && (
              <div className="border-t border-gray-100">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 w-16">Rank</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Student</th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Points</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Recent Competition</th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Wins</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((entry) => (
                        <tr key={entry.rank} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors even:bg-gray-50/30">
                          <td className="px-4 py-4">
                            <RankBadge rank={entry.rank} />
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm font-medium text-gray-900">{entry.studentName}</p>
                            <p className="text-xs text-gray-500">{entry.email}</p>
                          </td>
                          <td className="px-4 py-4 text-right text-sm font-semibold text-accent">{entry.points}</td>
                          <td className="px-4 py-4 text-sm text-gray-600 max-w-[200px] truncate">
                            {entry.recentCompetition || '-'}
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-gray-600 font-medium">{entry.wins}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function CompetitionLeaderboardTable({ competitionId }: { competitionId: string }) {
  const { data: compData } = useCompetitionDashboard(competitionId)

  if (!compData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const sorted = [...compData.registeredStudents].sort(
    (a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime()
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">#</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Student</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Department</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
            <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Registered</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length > 0 ? (
            sorted.map((reg, idx) => (
              <tr key={reg.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors even:bg-gray-50/30">
                <td className="px-4 py-4">
                  <RankBadge rank={idx + 1} />
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-medium text-gray-900">{reg.userName}</p>
                </td>
                <td className="px-4 py-4">
                  <Badge variant="primary" size="sm">{reg.department}</Badge>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={reg.status} />
                </td>
                <td className="px-4 py-4 text-right text-sm text-gray-500">
                  {new Date(reg.registeredAt).toLocaleDateString()}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center py-12 text-gray-500">No registrations yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: 'warning' | 'success' | 'info' | 'danger'; label: string }> = {
    pending_verification: { variant: 'warning', label: 'Pending' },
    verified: { variant: 'success', label: 'Verified' },
    completed: { variant: 'info', label: 'Completed' },
    rejected: { variant: 'danger', label: 'Rejected' },
  }
  const config = variants[status] || { variant: 'default' as const, label: status }
  return <Badge variant={config.variant as any} size="sm">{config.label}</Badge>
}
