'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, Badge, Button } from '@comp-dash/design-system'
import { useLeaderboardOverall, useCompetitionDashboard, useCompetitions } from '@comp-dash/api'
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
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400 dark:text-[#8B949E]" />
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600 dark:text-amber-400" />
  return <span className="text-sm font-medium text-gray-500 dark:text-[#8B949E] w-5 text-center">{rank}</span>
}

export default function LeaderboardPage() {
  const [isStudent, setIsStudent] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('overall')
  const [selectedDept, setSelectedDept] = useState('')
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F0F6FC]">Leaderboard</h1>
      </div>

      <Card padding="none" className="overflow-hidden">
        {!isStudent && (
          <div className="flex border-b border-gray-100 dark:border-[#30363D]">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'text-accent dark:text-[#38BDF8] border-b-2 border-accent dark:border-[#38BDF8] bg-accent/5 dark:bg-[#161B22]'
                      : 'text-gray-500 dark:text-[#8B949E] hover:text-gray-700 dark:hover:text-[#F0F6FC] hover:bg-gray-50 dark:hover:bg-[#21262D]'
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
                  <tr className="border-b border-gray-100 dark:border-[#30363D]">
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-[#8B949E] uppercase tracking-wider px-4 py-3">Rank</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-[#8B949E] uppercase tracking-wider px-4 py-3">Student</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-[#8B949E] uppercase tracking-wider px-4 py-3">Section</th>
                    <th className="text-right text-xs font-medium text-gray-500 dark:text-[#8B949E] uppercase tracking-wider px-4 py-3">Points</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-[#8B949E] uppercase tracking-wider px-4 py-3">Competitions</th>
                    <th className="text-right text-xs font-medium text-gray-500 dark:text-[#8B949E] uppercase tracking-wider px-4 py-3">Wins</th>
                  </tr>
                </thead>
                <tbody>
                  {overallLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-[#30363D]">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="h-10 bg-gray-100 dark:bg-[#161B22] rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : overallData && overallData.length > 0 ? (
                    overallData.map((entry) => (
                      <tr key={entry.rank} className="border-b border-gray-50 dark:border-[#30363D] hover:bg-gray-50/50 hover:dark:bg-[#161B22]/50 transition-colors">
                        <td className="px-4 py-4">
                          <RankBadge rank={entry.rank} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/10 dark:bg-[#38BDF8]/10 flex items-center justify-center">
                              <Star className="w-4 h-4 text-accent dark:text-[#38BDF8]" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-[#F0F6FC]">{entry.studentName}</p>
                              <p className="text-xs text-gray-500 dark:text-[#8B949E]">{entry.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="primary" size="sm">
                            {entry.section || entry.department}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-semibold text-accent dark:text-[#38BDF8]">{entry.points}</span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-[#8B949E] max-w-[200px] truncate">
                          {entry.recentCompetition || '-'}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-gray-600 dark:text-[#8B949E] font-medium">{entry.wins}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-500 dark:text-[#8B949E]">No leaderboard data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'department' && (
            <div className="space-y-6">
              {selectedDept ? (
                <>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDept('')}>
                      ← Back to Sections
                    </Button>
                    <span className="text-sm font-semibold text-gray-700 dark:text-[#F0F6FC]">Section {selectedDept}</span>
                  </div>
                  <SectionDetailTable sectionId={selectedDept} />
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500 dark:text-[#8B949E]">Click a section to view its students</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {overallLoading ? (
                      Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="h-20 bg-gray-100 dark:bg-[#161B22] rounded-xl animate-pulse" />
                      ))
                    ) : overallData && overallData.length > 0 ? (
                      (() => {
                        const sections = [...new Set(overallData.map(e => e.section).filter(Boolean))].sort() as string[]
                        return sections.map((sec) => {
                          const students = overallData.filter(e => e.section === sec)
                          const totalPts = students.reduce((sum, s) => sum + s.points, 0)
                          const totalWins = students.reduce((sum, s) => sum + s.wins, 0)
                          return (
                            <div
                              key={sec}
                              className="p-4 bg-white dark:bg-[#161B22] border border-gray-100 dark:border-[#30363D] rounded-xl hover:shadow-md hover:border-accent/20 dark:hover:border-[#38BDF8]/40 transition-all cursor-pointer"
                              onClick={() => setSelectedDept(sec)}
                            >
                              <p className="text-base font-bold text-gray-900 dark:text-[#F0F6FC]">{sec}</p>
                              <p className="text-xs text-gray-500 dark:text-[#8B949E] mt-1">{students.length} students</p>
                              <p className="text-xs text-accent dark:text-[#38BDF8] font-medium mt-1">{totalPts} pts · {totalWins} wins</p>
                            </div>
                          )
                        })
                      })()
                    ) : (
                      <div className="col-span-full text-center py-12 text-gray-500 dark:text-[#8B949E]">No section data available</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'competition' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <select
                  value={selectedComp}
                  onChange={handleCompetitionSelect}
                  className="flex-1 px-4 py-2 bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D] rounded-xl text-sm text-gray-700 dark:text-[#F0F6FC] focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
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
                <div className="text-center py-12 text-gray-500 dark:text-[#8B949E]">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-[#30363D]" />
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

function SectionDetailTable({ sectionId }: { sectionId: string }) {
  const { data: overallData, isLoading } = useLeaderboardOverall()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-[#161B22] rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  const students = overallData?.filter(e => e.section === sectionId) || []
  if (students.length === 0) {
    return <div className="text-center py-12 text-gray-500 dark:text-[#8B949E]">No students in this section</div>
  }

  const ranked = [...students].sort((a, b) => b.points - a.points || b.wins - a.wins)
    .map((s, i) => ({ ...s, rank: i + 1 }))

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 dark:border-[#30363D]">
            <th className="text-left text-xs font-medium text-gray-500 dark:text-[#8B949E] uppercase tracking-wider px-4 py-3">Rank</th>
            <th className="text-left text-xs font-medium text-gray-500 dark:text-[#8B949E] uppercase tracking-wider px-4 py-3">Student</th>
            <th className="text-right text-xs font-medium text-gray-500 dark:text-[#8B949E] uppercase tracking-wider px-4 py-3">Points</th>
            <th className="text-left text-xs font-medium text-gray-500 dark:text-[#8B949E] uppercase tracking-wider px-4 py-3">Competitions</th>
            <th className="text-right text-xs font-medium text-gray-500 dark:text-[#8B949E] uppercase tracking-wider px-4 py-3">Wins</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((entry) => (
            <tr key={entry.rank} className="border-b border-gray-50 dark:border-[#30363D] hover:bg-gray-50/50 hover:dark:bg-[#161B22]/50 transition-colors">
              <td className="px-4 py-4">
                <RankBadge rank={entry.rank} />
              </td>
              <td className="px-4 py-4">
                <p className="text-sm font-medium text-gray-900 dark:text-[#F0F6FC]">{entry.studentName}</p>
                <p className="text-xs text-gray-500 dark:text-[#8B949E]">{entry.email}</p>
              </td>
              <td className="px-4 py-4 text-right text-sm font-semibold text-accent dark:text-[#38BDF8]">{entry.points}</td>
              <td className="px-4 py-4 text-sm text-gray-600 dark:text-[#8B949E] max-w-[200px] truncate">
                {entry.recentCompetition || '-'}
              </td>
              <td className="px-4 py-4 text-right text-sm text-gray-600 dark:text-[#8B949E] font-medium">{entry.wins}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CompetitionLeaderboardTable({ competitionId }: { competitionId: string }) {
  const { data: compData } = useCompetitionDashboard(competitionId)

  if (!compData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-accent dark:border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
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
          <tr className="border-b border-gray-100 dark:border-[#30363D]">
            <th className="text-left text-xs font-medium text-gray-500 dark:text-[#8B949E] uppercase tracking-wider px-4 py-3">#</th>
            <th className="text-left text-xs font-medium text-gray-500 dark:text-[#8B949E] uppercase tracking-wider px-4 py-3">Student</th>
            <th className="text-left text-xs font-medium text-gray-500 dark:text-[#8B949E] uppercase tracking-wider px-4 py-3">Department</th>
            <th className="text-left text-xs font-medium text-gray-500 dark:text-[#8B949E] uppercase tracking-wider px-4 py-3">Status</th>
            <th className="text-right text-xs font-medium text-gray-500 dark:text-[#8B949E] uppercase tracking-wider px-4 py-3">Registered</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length > 0 ? (
            sorted.map((reg, idx) => (
              <tr key={reg.id} className="border-b border-gray-50 dark:border-[#30363D] hover:bg-gray-50/50 hover:dark:bg-[#161B22]/50 transition-colors">
                <td className="px-4 py-4">
                  <RankBadge rank={idx + 1} />
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-[#F0F6FC]">{reg.userName}</p>
                </td>
                <td className="px-4 py-4">
                  <Badge variant="primary" size="sm">{reg.department}</Badge>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={reg.status} />
                </td>
                <td className="px-4 py-4 text-right text-sm text-gray-500 dark:text-[#8B949E]">
                  {new Date(reg.registeredAt).toLocaleDateString()}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center py-12 text-gray-500 dark:text-[#8B949E]">No registrations yet</td>
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
