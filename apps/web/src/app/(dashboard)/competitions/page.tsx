'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Card, Badge } from '@comp-dash/design-system'
import { useCompetitions, isSupabaseEnabled } from '@comp-dash/api'
import { Calendar, MapPin, Users, Clock, ArrowRight, Search } from 'lucide-react'
import type { CompetitionCategory } from '@comp-dash/types'

const categoryOptions = [
  { label: 'All', value: 'all' },
  { label: 'Competition', value: 'competition' },
  { label: 'C + P', value: 'c + p' },
  { label: 'C + I', value: 'c + i' },
  { label: 'Start-up', value: 'start-up' },
]

const categoryGradients: Record<string, string> = {
  competition: 'from-violet-500 to-purple-600',
  'c + p': 'from-emerald-500 to-teal-600',
  'c + i': 'from-blue-500 to-cyan-600',
  'start-up': 'from-amber-500 to-orange-600',
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function CompetitionsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const realtime = isSupabaseEnabled()

  const { data, isLoading } = useCompetitions({
    category: selectedCategory === 'all' ? undefined : (selectedCategory as CompetitionCategory),
    search: search || undefined,
  })

  const competitions = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('sidebar.competitions')}</h1>
          <p className="text-gray-500 mt-1">Browse competitions from across India</p>
        </div>
        {realtime && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-xs text-green-700">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live from Supabase
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search competitions..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categoryOptions.map(cat => (
            <button key={cat.value} onClick={() => setSelectedCategory(cat.value)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedCategory === cat.value ? 'bg-accent text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : competitions.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Calendar className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">{search ? 'No matching competitions' : 'No competitions yet'}</p>
            <p className="text-xs mt-1">{search ? 'Try a different search term' : 'Check back later for new competitions'}</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {competitions.map((comp: any) => {
            const deadline = comp.registrationDeadline ? new Date(comp.registrationDeadline) : null
            const isOpen = deadline ? deadline > new Date() : true
            const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

            return (
              <div key={comp.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-accent/20 transition-all cursor-pointer group"
                onClick={() => router.push(`/competitions/${comp.id}`)}
              >
                <div className={`h-2 bg-gradient-to-r ${categoryGradients[comp.category?.toLowerCase()] || 'from-gray-400 to-gray-500'}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="primary" size="sm">{comp.category || 'Competition'}</Badge>
                    {daysLeft !== null && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isOpen ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {isOpen ? `${daysLeft > 0 ? `${daysLeft}d left` : 'Closing soon'}` : 'Closed'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                    {comp.title}
                  </h3>

                  {comp.eligibility?.yearOfStudy?.filter(Boolean).length > 0 && (
                    <p className="text-xs text-gray-500 mb-4">
                      Eligible: {comp.eligibility.yearOfStudy.filter(Boolean).join(', ')}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        {formatDate(comp.startDate) || 'TBA'}
                        {comp.endDate ? ` - ${formatDate(comp.endDate)}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span>{comp.organizer}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400">Prize Pool</p>
                      <p className="text-sm font-bold text-accent">{comp.prizePool || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium text-accent group-hover:gap-2 transition-all">
                      View Details <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
