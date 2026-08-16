'use client'

import { useTranslation } from 'react-i18next'
import { StatCard, Card, CardHeader, CardTitle, StatCardSkeleton } from '@comp-dash/design-system'
import { useStudentDashboardStats } from '@comp-dash/api'
import { Trophy, UserCheck, Target, Medal, Calendar, Mail, CheckCircle, Clock } from 'lucide-react'

export default function StudentDashboard() {
  const { t } = useTranslation()
  const { data: stats, isLoading } = useStudentDashboardStats()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="h-5 w-64 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  const registered = stats?.totalRegistered ?? 0
  const verified = stats?.totalVerified ?? 0
  const pending = stats?.totalPending ?? 0
  const wins = stats?.totalWins ?? 0
  const odRequests = stats?.odRequests ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('home.greeting', { name: 'Student' })}</h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-1">{t('home.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('home.registered')}
          value={registered}
          change={2}
          changeLabel={t('dashboard.fromLastWeek')}
          icon={<Trophy className="w-5 h-5" />}
        />
        <StatCard
          title={t('home.verified')}
          value={verified}
          change={1}
          changeLabel={t('dashboard.fromLastWeek')}
          icon={<UserCheck className="w-5 h-5" />}
        />
        <StatCard
          title={t('home.pending')}
          value={pending}
          change={1}
          changeLabel={t('dashboard.fromLastWeek')}
          icon={<Target className="w-5 h-5" />}
        />
        <StatCard
          title={t('home.wins')}
          value={wins}
          change={0}
          changeLabel={t('dashboard.fromLastWeek')}
          icon={<Medal className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('home.upcomingDeadlines')}</CardTitle>
          </CardHeader>
          <div className="mt-4 space-y-3">
            {(stats?.upcomingCompetitions?.length ?? 0) > 0 ? (
              stats!.upcomingCompetitions.map((comp) => (
                <div key={comp.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{comp.title}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-zinc-400">
                    {new Date(comp.registrationDeadline).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-center">
                <span className="text-sm text-gray-400 dark:text-zinc-500">{t('home.noUpcoming')}</span>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('home.recentlyVerified')}</CardTitle>
          </CardHeader>
          <div className="mt-4 space-y-3">
            {(stats?.recentVerifiedRegs?.length ?? 0) > 0 ? (
              stats!.recentVerifiedRegs.map((reg) => (
                <div key={reg.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                      <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{reg.competition.title}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-zinc-400">
                    {reg.verifiedAt ? new Date(reg.verifiedAt).toLocaleDateString() : '-'}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-center">
                <span className="text-sm text-gray-400 dark:text-zinc-500">{t('home.noVerified')}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* OD Requests Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-accent" />
            OD Requests
          </CardTitle>
        </CardHeader>
        <div className="mt-4 space-y-3">
          {odRequests.length > 0 ? (
            odRequests.map((vr: any) => (
              <div key={vr.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                <div className="flex items-center gap-3">
                  {vr.status === 'verified' ? (
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{vr.competitionTitle}</span>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{vr.department}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  vr.status === 'verified' 
                    ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' 
                    : vr.status === 'under_review'
                    ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                    : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                }`}>
                  {vr.status === 'verified' ? 'Approved' : vr.status === 'under_review' ? 'Under Review' : 'Pending'}
                </span>
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-center">
              <span className="text-sm text-gray-400 dark:text-zinc-500">No OD requests yet</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
