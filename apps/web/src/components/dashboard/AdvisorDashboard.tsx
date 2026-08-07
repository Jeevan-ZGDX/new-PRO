'use client'

import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { StatCard, Card, CardHeader, CardTitle, Badge, Button } from '@comp-dash/design-system'
import { useDashboardStats } from '@comp-dash/api'
import { PendingVerificationsTable } from '@/components/dashboard/PendingVerificationsTable'
import { RecentVerifiedTable } from '@/components/dashboard/RecentVerifiedTable'
import { ClipboardList, Users, CheckCircle, Clock, Mail, UserCheck, Send, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

export default function AdvisorDashboard() {
  const { t } = useTranslation()
  const { data: stats, isLoading } = useDashboardStats()
  const [expandedVr, setExpandedVr] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('advisor.title')}</h1>
        <p className="text-gray-500 mt-1">{t('advisor.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('advisor.pendingVerifications')}
          value={stats?.pendingVerifications?.length || 0}
          change={3}
          changeLabel={t('dashboard.fromLastWeek')}
          icon={<ClipboardList className="w-5 h-5" />}
        />
        <StatCard
          title={t('advisor.verifiedThisWeek')}
          value={stats?.recentVerified?.length || 0}
          change={2}
          changeLabel={t('dashboard.fromLastWeek')}
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <StatCard
          title={t('advisor.assignedStudents')}
          value={45}
          change={5}
          changeLabel={t('advisor.total')}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title={t('advisor.responseTime')}
          value="2.4h"
          change={-15}
          changeLabel={t('dashboard.fromLastWeek')}
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PendingVerificationsTable data={stats?.pendingVerifications || []} />
        </div>
          <Card>
            <CardHeader>
              <CardTitle>Submitted Email Proofs</CardTitle>
            </CardHeader>
            <div className="mt-4 space-y-2">
              {(stats?.selfVerificationRequests?.length ?? 0) > 0 ? (
                stats!.selfVerificationRequests.map((vr: any) => (
                  <div key={vr.id}>
                    <div
                      className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl cursor-pointer hover:bg-blue-100/50 transition-colors"
                      onClick={() => setExpandedVr(expandedVr === vr.id ? null : vr.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{vr.studentName}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="info" size="sm">Pending</Badge>
                          {expandedVr === vr.id ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{vr.department} · {vr.competitionTitle}</p>
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-600">
                        <Send className="w-3 h-3" />
                        <span>Submitted email proof</span>
                      </div>
                    </div>

                    {expandedVr === vr.id && vr.emailProof && (
                      <div className="mx-2 mt-1 p-3 bg-white border border-gray-200 rounded-xl space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Metadata</p>
                        <div className="space-y-1.5">
                          <div>
                            <p className="text-xs text-gray-400">From</p>
                            <p className="text-sm text-gray-900">{vr.emailProof.from}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">To</p>
                            <p className="text-sm text-gray-900">{vr.emailProof.to}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Subject</p>
                            <p className="text-sm font-medium text-gray-900">{vr.emailProof.subject}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Date & Time</p>
                            <p className="text-sm text-gray-900">{vr.emailProof.date ? new Date(vr.emailProof.date).toLocaleString() : 'N/A'}</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                          <button className="w-full px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Verify & Approve
                          </button>
                        </div>
                      </div>
                    )}

                    {expandedVr === vr.id && !vr.emailProof && (
                      <div className="mx-2 mt-1 p-3 bg-white border border-gray-200 rounded-xl">
                        <p className="text-xs text-gray-400 text-center py-2">No email proof submitted</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center">
                  <Mail className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-400">No pending requests</p>
                </div>
              )}
            </div>
          </Card>
      </div>
      <RecentVerifiedTable data={stats?.recentVerified || []} />
    </div>
  )
}
