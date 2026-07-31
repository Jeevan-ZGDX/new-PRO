'use client'

import { useParams, useRouter } from 'next/navigation'
import { Card, Badge } from '@comp-dash/design-system'
import { useCompetition } from '@comp-dash/api'
import { Calendar, MapPin, Users, Clock, Trophy, ArrowLeft, ExternalLink, Tag, Info, Globe, Building2, Target } from 'lucide-react'

const categoryGradients: Record<string, string> = {
  competition: 'from-violet-500 to-purple-600',
  'c + p': 'from-emerald-500 to-teal-600',
  'c + i': 'from-blue-500 to-cyan-600',
  'start-up': 'from-amber-500 to-orange-600',
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return 'TBA'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'TBA'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function CompetitionDetailPage() {
  const params = useParams()
  const router = useRouter()

  const { data: comp, isLoading, error } = useCompetition(params.id as string)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-24 bg-gray-200 dark:bg-[#161B22] rounded animate-pulse" />
        <div className="h-64 bg-gray-100 dark:bg-[#161B22] rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!comp || error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-[#8B949E]">
        <Info className="w-12 h-12 mb-3" />
        <p className="text-sm font-medium">Competition not found</p>
        <button onClick={() => router.back()} className="text-sm text-accent dark:text-[#38BDF8] mt-2 hover:underline">Go back</button>
      </div>
    )
  }

  const deadline = comp.registrationDeadline ? new Date(comp.registrationDeadline) : null
  const isOpen = deadline ? deadline > new Date() : true
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-[#8B949E] hover:text-gray-700 dark:hover:text-[#F0F6FC] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Competitions
      </button>

      <div className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D] rounded-2xl overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${categoryGradients[comp.category?.toLowerCase()] || 'from-gray-400 to-gray-500'}`} />
        
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="primary" size="sm">{comp.category || 'Competition'}</Badge>
                {daysLeft !== null && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    isOpen ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 border dark:border-green-800/50' : 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border dark:border-red-800/50'
                  }`}>
                    {isOpen ? (daysLeft > 0 ? `${daysLeft} days left` : 'Closing soon') : 'Registration closed'}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-[#F0F6FC]">{comp.title}</h1>
              <p className="text-sm text-gray-500 dark:text-[#8B949E] mt-1">by {comp.organizer}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gray-50 dark:bg-[#0D1117] border border-transparent dark:border-[#30363D] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#8B949E] mb-1">
                <Calendar className="w-3.5 h-3.5" />
                Dates
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-[#F0F6FC]">
                {formatDate(comp.startDate)}{comp.endDate ? ` - ${formatDate(comp.endDate)}` : ''}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#0D1117] border border-transparent dark:border-[#30363D] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#8B949E] mb-1">
                <Clock className="w-3.5 h-3.5" />
                Deadline
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-[#F0F6FC]">
                {formatDate(comp.registrationDeadline)}
                {deadline && !isOpen && <span className="text-red-500 dark:text-red-400 ml-1">(Closed)</span>}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#0D1117] border border-transparent dark:border-[#30363D] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#8B949E] mb-1">
                <Trophy className="w-3.5 h-3.5" />
                Prize Pool
              </div>
              <p className="text-sm font-bold text-accent dark:text-[#38BDF8]">{comp.prizePool || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 dark:bg-[#0D1117] border border-transparent dark:border-[#30363D] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#8B949E] mb-1">
                <Building2 className="w-3.5 h-3.5" />
                Organizer
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-[#F0F6FC]">{comp.organizer}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#0D1117] border border-transparent dark:border-[#30363D] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#8B949E] mb-1">
                <Globe className="w-3.5 h-3.5" />
                Category
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-[#F0F6FC] capitalize">{comp.category || 'Competition'}</p>
            </div>
          </div>

          {comp.eligibility?.yearOfStudy?.filter(Boolean).length > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/40 rounded-xl mb-6">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Eligibility</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {comp.eligibility.yearOfStudy.filter(Boolean).map((y: string) => (
                      <span key={y} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium">{y}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
