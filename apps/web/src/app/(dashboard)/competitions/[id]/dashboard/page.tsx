'use client'

import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, Badge, Button, StatCard } from '@comp-dash/design-system'
import { useCompetitionDashboard, useSendReminder } from '@comp-dash/api'
import { Trophy, Users, UserCheck, UserX, Calendar, Building2, Send, Bell } from 'lucide-react'

const statusConfig: Record<string, { variant: 'warning' | 'success' | 'info' | 'danger'; label: string }> = {
  pending_verification: { variant: 'warning', label: 'Pending' },
  verified: { variant: 'success', label: 'Verified' },
  completed: { variant: 'info', label: 'Completed' },
  rejected: { variant: 'danger', label: 'Rejected' },
}

export default function CompetitionDashboardPage() {
  const params = useParams()
  const id = params.id as string
  const { data, isLoading } = useCompetitionDashboard(id)
  const sendReminder = useSendReminder()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-gray-500">Competition not found</div>
    )
  }

  const { competition, registeredStudents, unregisteredStudents, totalRegistered, totalUnregistered, registrationsByDepartment } = data
  const maxDeptCount = Math.max(...registrationsByDepartment.map((d) => d.count), 1)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{competition.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{competition.organizer}</span>
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(competition.startDate).toLocaleDateString()} - {new Date(competition.endDate).toLocaleDateString()}</span>
            <Badge variant="accent" size="sm">{competition.mode}</Badge>
            <Badge variant="primary" size="sm">{competition.category}</Badge>
          </div>
          {competition.prizePool && (
            <p className="mt-2 text-sm font-semibold text-yellow-600">Prize Pool: {competition.prizePool}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Registered"
          value={totalRegistered}
          icon={<UserCheck className="w-5 h-5" />}
        />
        <StatCard
          title="Total Unregistered"
          value={totalUnregistered}
          icon={<UserX className="w-5 h-5" />}
        />
        <StatCard
          title="Total Students"
          value={totalRegistered + totalUnregistered}
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Registrations by Department</CardTitle>
          </CardHeader>
          <div className="mt-4 space-y-3">
            {registrationsByDepartment.length > 0 ? (
              registrationsByDepartment.map((dept) => (
                <div key={dept.department} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-medium">{dept.department}</span>
                    <span className="text-gray-500">{dept.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-500"
                      style={{ width: `${(dept.count / maxDeptCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">No registration data</div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <div className="mt-4 space-y-3">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => sendReminder.mutate(id)}
              isLoading={sendReminder.isPending}
              disabled={unregisteredStudents.length === 0}
            >
              <Send className="w-4 h-4" />
              Send Reminder ({unregisteredStudents.length} unregistered)
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Students ({registeredStudents.length})</CardTitle>
        </CardHeader>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Student</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Department</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Registered At</th>
              </tr>
            </thead>
            <tbody>
              {registeredStudents.length > 0 ? (
                registeredStudents.map((reg) => {
                  const config = statusConfig[reg.status] || { variant: 'default' as const, label: reg.status }
                  return (
                    <tr key={reg.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors even:bg-gray-50/30">
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-gray-900">{reg.userName}</p>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="primary" size="sm">{reg.department}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={config.variant} size="sm">{config.label}</Badge>
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-500">
                        {new Date(reg.registeredAt).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">No registered students</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Unregistered Students ({unregisteredStudents.length})</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendReminder.mutate(id)}
              isLoading={sendReminder.isPending}
              disabled={unregisteredStudents.length === 0}
            >
              <Bell className="w-4 h-4" />
              Send Reminder
            </Button>
          </div>
        </CardHeader>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Student</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Email</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Department</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Section</th>
              </tr>
            </thead>
            <tbody>
              {unregisteredStudents.length > 0 ? (
                unregisteredStudents.map((student) => (
                  <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors even:bg-gray-50/30">
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-gray-900">{student.name}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{student.email}</td>
                    <td className="px-4 py-4">
                      <Badge variant="primary" size="sm">{student.department}</Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{student.section}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">All students are registered</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
