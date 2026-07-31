'use client'

import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle } from '@comp-dash/design-system'
import { Avatar } from '@comp-dash/design-system'
import type { Registration } from '@comp-dash/types'

interface RecentVerifiedTableProps {
  data: Registration[]
}

export function RecentVerifiedTable({ data }: RecentVerifiedTableProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.recentVerified')}</CardTitle>
      </CardHeader>
      <div className="mt-4 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-[#30363D]">
              <th className="text-left text-xs font-medium text-gray-500 dark:text-[#8B949E] uppercase tracking-wider px-4 py-3">
                Student
              </th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-[#8B949E] uppercase tracking-wider px-4 py-3">
                Competition
              </th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-[#8B949E] uppercase tracking-wider px-4 py-3">
                Department
              </th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-[#8B949E] uppercase tracking-wider px-4 py-3">
                Verified On
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500 dark:text-[#8B949E]">
                  {t('common.noData')}
                </td>
              </tr>
            ) : (
              data.map((reg) => (
                <tr key={reg.id} className="border-b border-gray-50 dark:border-[#30363D] hover:bg-gray-50/50 hover:dark:bg-[#161B22]/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={reg.userId} size="sm" />
                      <span className="text-sm font-medium text-gray-900 dark:text-[#F0F6FC]">{reg.userId}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-[#8B949E]">{reg.competition.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-[#8B949E]">{reg.competition.organizer}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-[#8B949E]">
                    {reg.verifiedAt ? new Date(reg.verifiedAt).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
