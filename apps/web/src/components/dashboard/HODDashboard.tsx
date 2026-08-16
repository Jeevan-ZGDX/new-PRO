'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, StatCard, Badge } from '@comp-dash/design-system'
import { useHodDashboardStats } from '@comp-dash/api'
import { Users, UserCheck, BookOpen, GraduationCap, Mail, Trophy, CheckCircle, Clock } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'

const YEARS = ['2nd Year', '3rd Year']

export default function HODDashboard() {
  const { data: stats, isLoading } = useHodDashboardStats()
  const [user] = useState(() => getCurrentUser())
  const [selectedYear, setSelectedYear] = useState<string>('3rd Year')

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const departmentName = user?.department || 'CSE'

  const yearData = selectedYear === 'all'
    ? null
    : stats?.yearWise?.find((y: any) => y.year === selectedYear)

  const filteredRegistrations = selectedYear === 'all'
    ? stats?.registrations || []
    : (stats?.registrations || []).filter((r: any) => {
        const s = r.userId && r.userName
        return true
      }).slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{departmentName} Dashboard</h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-1">Departmental competition overview and verification management</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {YEARS.map(year => {
          const yw = stats?.yearWise?.find((y: any) => y.year === year)
          const isActive = selectedYear === year
          return (
            <button key={year} onClick={() => setSelectedYear(year)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors flex items-center gap-2 ${isActive ? 'bg-accent text-white' : 'bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
            >
              <GraduationCap className="w-4 h-4" />
              {year}
              {yw && <span className="text-xs opacity-70">({yw.studentCount})</span>}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title={selectedYear === 'all' ? 'Total Students' : `${selectedYear} Students`}
          value={selectedYear === 'all' ? (stats?.totalStudents || 0) : (yearData?.studentCount || 0)}
          change={5}
          changeLabel="CSE"
          icon={<UserCheck className="w-5 h-5" />}
        />
        <StatCard
          title="Registrations"
          value={selectedYear === 'all' ? (stats?.registeredCount || 0) : (yearData?.registrationCount || 0)}
          change={-2}
          changeLabel="total"
          icon={<BookOpen className="w-5 h-5" />}
        />
        <StatCard
          title="OD Requests"
          value={selectedYear === 'all'
            ? (stats?.selfVerificationRequests?.length || 0)
            : (yearData?.pendingCount || 0)}
          change={0}
          changeLabel="need review"
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Year-wise Breakdown</CardTitle>
          </CardHeader>
          <div className="mt-4 space-y-2 px-4 pb-6">
            {stats?.yearWise?.length ? (
              stats.yearWise.map((yw: any) => (
                <div key={yw.year} className="p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-accent" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{yw.year}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-zinc-400">{yw.studentCount} students</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="p-2 bg-white dark:bg-zinc-700 rounded-lg border border-gray-200 dark:border-zinc-600">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{yw.registrationCount}</p>
                      <p className="text-gray-500 dark:text-zinc-400">Registered</p>
                    </div>
                    <div className="p-2 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/20">
                      <p className="text-lg font-bold text-green-700 dark:text-green-400">{yw.verifiedCount}</p>
                      <p className="text-green-600 dark:text-green-400">Verified</p>
                    </div>
                    <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/20">
                      <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{yw.pendingCount}</p>
                      <p className="text-amber-600 dark:text-amber-400">Pending</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-zinc-400 text-sm">No data available</div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>OD Approval Requests</CardTitle>
          </CardHeader>
          <div className="mt-4 space-y-2">
            {(stats?.selfVerificationRequests?.length ?? 0) > 0 ? (
              stats!.selfVerificationRequests.map((vr: any) => (
                <div key={vr.id} className="px-4 py-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-black rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{vr.studentName}</span>
                    <Badge variant="info" size="sm">Pending</Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">{vr.department} · {vr.competitionTitle}</p>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center">
                <Mail className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-zinc-600" />
                <p className="text-sm text-gray-400 dark:text-zinc-500">No pending requests</p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Registrations</CardTitle>
          </CardHeader>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-700">
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider px-4 py-3">Student</th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider px-4 py-3">Competition</th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.registrations?.length ?? 0) > 0 ? (
                  stats!.registrations.slice(0, 10).map((reg: any) => (
                    <tr key={reg.id} className="border-b border-gray-50 dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{reg.userName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-zinc-400">{reg.competition?.title}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={reg.status === 'verified' || reg.status === 'completed' ? 'success' : reg.status === 'rejected' ? 'danger' : 'warning'}
                          size="sm"
                        >
                          {reg.status?.replace('_', ' ') || 'Unknown'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-gray-500 dark:text-zinc-400 text-sm">No recent registrations</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
