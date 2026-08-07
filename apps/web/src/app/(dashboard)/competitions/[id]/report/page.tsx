'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, Badge, Button } from '@comp-dash/design-system'
import { useAdvisorCompetitionStats } from '@comp-dash/api'
import { getCurrentUser } from '@/lib/auth'
import { exportToCSV } from '@/lib/export-csv'
import { Download, ArrowLeft, Users, CheckCircle, UserX } from 'lucide-react'

export default function CompetitionReportPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [user, setUser] = useState<any>(null)

  useEffect(() => { setUser(getCurrentUser()) }, [])

  const { data: stats, isLoading } = useAdvisorCompetitionStats(id)

  const handleExport = () => {
    if (!stats) return
    const headers = ['Metric', 'Count']
    const rows = [
      ['Total Students', String(stats.totalStudents || 0)],
      ['Applied Students', String(stats.appliedStudents || 0)],
      ['Not Applied', String(stats.unregisteredStudents || 0)],
    ]
    if (stats.registrationsByDepartment?.length > 0) {
      headers.push('Department', 'Count')
      stats.registrationsByDepartment.forEach((dept: any) => {
        rows.push([dept.department, String(dept.count)])
      })
    }
    exportToCSV(`competition-${id}-report`, headers, rows)
  }

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Competition Report</h1>
      </div>

      {user?.role === 'advisor' && (
        <div className="flex items-center justify-between">
          <Button onClick={handleExport} variant="primary" size="sm" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV Report
          </Button>
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStudents || 0}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Applied Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.appliedStudents || 0}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                  <UserX className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Not Applied</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.unregisteredStudents || 0}</p>
                </div>
              </div>
            </Card>
          </div>

          {stats.registrationsByDepartment?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Registrations by Department</CardTitle>
              </CardHeader>
              <div className="mt-4 space-y-3">
                {stats.registrationsByDepartment.map((dept: any) => (
                  <div key={dept.department} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-medium">{dept.department}</span>
                    <span className="text-gray-500">{dept.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}