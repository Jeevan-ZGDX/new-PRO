'use client'

import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, Skeleton } from '@comp-dash/design-system'
import { useAdminDepartments } from '@comp-dash/api'
import { Users, Trophy, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DepartmentsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: departments, isLoading } = useAdminDepartments()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F0F6FC]">{t('sidebar.departments')}</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} padding="lg">
              <div className="space-y-3">
                <div className="h-5 bg-gray-100 rounded w-1/3 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      ) : departments && departments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <Card key={dept.id} variant="interactive" padding="lg" onClick={() => router.push(`/departments/${dept.id}`)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{dept.name}</CardTitle>
                  <span className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-sm">
                    {dept.name.slice(0, 2)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{dept.fullName}</p>
              </CardHeader>
              <div className="mt-4 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{dept.studentCount} Students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{dept.competitionCount} Competitions</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No departments found
        </div>
      )}
    </div>
  )
}
