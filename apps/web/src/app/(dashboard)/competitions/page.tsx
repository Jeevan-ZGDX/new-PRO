'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Card, Badge } from '@comp-dash/design-system'
import { useCompetitions, isSupabaseEnabled } from '@comp-dash/api'
import { getCurrentUser } from '@/lib/auth'
import { Calendar, MapPin, Users, Clock, ArrowRight, Search, Pencil } from 'lucide-react'
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
  const [user, setUser] = useState<any>(null)
  useEffect(() => { setUser(getCurrentUser()) }, [])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const realtime = isSupabaseEnabled()

  const { data, isLoading } = useCompetitions({
    category: selectedCategory === 'all' ? undefined : (selectedCategory as CompetitionCategory),
    search: search || undefined,
  })

  const competitions = data?.data ?? []

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('sidebar.competitions')}</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Browse competitions from across the world</p>
        </div>
        {realtime && (
          <div className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-full text-xs text-emerald-700 dark:text-emerald-400 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live from Supabase
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search competitions..."
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categoryOptions.map(cat => (
            <button 
              key={cat.value} 
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                selectedCategory === cat.value 
                  ? 'bg-accent text-white shadow-sm' 
                  : 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
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
            <div key={i} className="h-64 bg-gray-100 dark:bg-zinc-800/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : competitions.length === 0 ? (
        <Card className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-800">
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-zinc-500">
            <Calendar className="w-12 h-12 mb-3 text-gray-300 dark:text-zinc-600" />
            <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">{search ? 'No matching competitions' : 'No competitions yet'}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">{search ? 'Try a different search term' : 'Check back later for new competitions'}</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {competitions.map((comp: any) => {
            const deadline = comp.registrationDeadline ? new Date(comp.registrationDeadline) : null
            const isOpen = deadline ? deadline > new Date() : true
            const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

            return (
              <div 
                key={comp.id}
                className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-accent/40 cursor-pointer group flex flex-col justify-between"
                onClick={() => router.push(`/competitions/${comp.id}`)}
              >
                <div>
                  <div className={`h-2 bg-gradient-to-r ${categoryGradients[comp.category?.toLowerCase()] || 'from-gray-400 to-gray-500'}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <Badge variant="primary" size="sm">{comp.category || 'Competition'}</Badge>
                      {daysLeft !== null && (
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                          isOpen 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60' 
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                        }`}>
                          {isOpen ? `${daysLeft > 0 ? `${daysLeft}d left` : 'Closing soon'}` : 'Closed'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-accent dark:group-hover:text-accent transition-colors">
                      {comp.title}
                    </h3>

                    {comp.eligibility?.yearOfStudy?.filter(Boolean).length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">
                        Eligible: {comp.eligibility.yearOfStudy.filter(Boolean).join(', ')}
                      </p>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500 shrink-0" />
                        <span>
                          {formatDate(comp.startDate) || 'TBA'}
                          {comp.endDate ? ` - ${formatDate(comp.endDate)}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
                        <Users className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500 shrink-0" />
                        <span className="truncate">{comp.organizer}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800/80">
                    <div>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">Prize Pool</p>
                      <p className="text-sm font-bold text-accent">{comp.prizePool || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {comp.registrationUrl && (
                        <a 
                          href={comp.registrationUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent/90 transition-transform duration-200 hover:scale-105 active:scale-95 shadow-sm"
                        >
                          Register Now
                        </a>
                      )}
                      {user?.role === 'super_admin' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); router.push(`/create-competition?edit=${comp.id}`) }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-gray-600 dark:text-zinc-300 hover:text-accent dark:hover:text-accent transition-transform duration-200 hover:scale-105 active:scale-95"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                      )}
                      <div className="flex items-center gap-1 text-sm font-medium text-accent group-hover:gap-2 transition-all">
                        View Details <ArrowRight className="w-4 h-4" />
                      </div>
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