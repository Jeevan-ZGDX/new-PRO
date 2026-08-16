'use client'

import { useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, Badge, Button } from '@comp-dash/design-system'
import { useCompetitionSections } from '@comp-dash/api'
import { exportToCSV } from '@/lib/export-csv'
import { AlertTriangle, ArrowLeft, Download, GraduationCap, Users } from 'lucide-react'

const YEAR_OPTIONS = [
  { value: '2', label: 'Year 2', sublabel: '2nd Year' },
  { value: '3', label: 'Year 3', sublabel: '3rd Year' },
]

/**
 * Department-wide, section-wise registration breakdown for one competition,
 * with Year-wise filter for 2nd and 3rd Year.
 */
export function HodSectionsPanel({
  competitionId,
  competitionTitle,
}: {
  competitionId: string
  competitionTitle?: string
}) {
  const [selectedYear, setSelectedYear] = useState<string>('3')
  const { data, isLoading, error } = useCompetitionSections(competitionId, selectedYear)
  const [selected, setSelected] = useState<string | null>(null)

  const totals = useMemo(() => {
    const sections = data?.sections ?? []
    return {
      sections: sections.length,
      students: sections.reduce((n, s) => n + s.totalCount, 0),
      registered: sections.reduce((n, s) => n + s.registeredCount, 0),
    }
  }, [data])

  const handleExport = () => {
    if (!data) return
    const headers = ['Section', 'Students', 'Registered', 'Not registered', 'Coverage %']
    const rows = data.sections.map((s) => [
      s.section,
      String(s.totalCount),
      String(s.registeredCount),
      String(s.totalCount - s.registeredCount),
      s.totalCount ? String(Math.round((s.registeredCount / s.totalCount) * 100)) : '0',
    ])
    exportToCSV(`sections-${competitionId}-year-${selectedYear}`, headers, rows)
  }

  const active = selected ? data?.sections.find((s) => s.section === selected) : null

  return (
    <Card data-testid="hod-sections-panel" className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              Section-wise Registrations
            </CardTitle>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Year-wise Filter Toggle */}
          <div className="flex items-center p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
            {YEAR_OPTIONS.map((y) => {
              const isSelected = selectedYear === y.value
              return (
                <button
                  key={y.value}
                  type="button"
                  onClick={() => {
                    setSelectedYear(y.value)
                    setSelected(null)
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{y.label}</span>
                </button>
              )
            })}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            disabled={!data || data.sections.length === 0}
            className="flex items-center gap-1.5 text-xs h-9 rounded-xl border-gray-200 dark:border-zinc-700"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 py-4">
          <div className="h-6 w-56 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-24 bg-gray-100 dark:bg-zinc-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {(error as any)?.response?.data?.error?.message || 'Could not load section data'}
            </p>
            {(error as any)?.response?.data?.error?.detail && (
              <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                {(error as any).response.data.error.detail}
              </p>
            )}
          </div>
        </div>
      ) : !data || data.notEligible || data.sections.length === 0 ? (
        <div className="text-center py-10 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
          <p className="text-sm font-semibold text-gray-800 dark:text-white">
            No sections found for this filter
          </p>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            This competition does not have enrolled students for the selected academic cohort.
          </p>
        </div>
      ) : active ? (
        <div className="space-y-4 pt-1">
          <button
            onClick={() => setSelected(null)}
            className="text-sm text-accent hover:underline mb-4 flex items-center gap-1 transition-transform duration-200 hover:scale-[1.02] origin-left"
          >
            &larr; Back to all sections
          </button>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Section {active.section} Student Roster</h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">
            {active.registeredCount} / {active.totalCount} registered ({active.totalCount ? Math.round((active.registeredCount / active.totalCount) * 100) : 0}% coverage)
          </p>

          {active.registered && active.registered.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-700">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-700">
                  <tr>
                    <th className="py-3 px-4 font-medium">Student</th>
                    <th className="py-3 px-4 font-medium">Email</th>
                    <th className="py-3 px-4 font-medium">Department</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {active.registered.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/50 transition-colors"
                      data-testid="hod-section-student-row"
                    >
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{s.name}</td>
                      <td className="py-3 px-4 text-gray-500 dark:text-zinc-400 font-mono">{s.email}</td>
                      <td className="py-3 px-4 text-gray-700 dark:text-zinc-300">{s.department || 'CSE'}</td>
                      <td className="py-3 px-4">
                        <Badge variant="success" size="sm">
                          Registered
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-6 text-center py-8 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-zinc-600" />
              <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                No student in Section {active.section} has registered for this competition yet.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          <p className="text-sm text-gray-500 dark:text-zinc-400">Click a section to view registered students</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="hod-sections-grid">
            {data.sections.map((s) => {
              const pct = s.totalCount ? Math.round((s.registeredCount / s.totalCount) * 100) : 0
              return (
                <button
                  key={s.section}
                  onClick={() => setSelected(s.section)}
                  data-testid={`hod-section-card-${s.section}`}
                  className="text-left p-4 bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-700/50 rounded-xl transition-transform duration-200 hover:scale-[1.03] cursor-pointer"
                >
                  <p className="text-base font-bold text-gray-900 dark:text-white">{s.section}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{s.totalCount} students</p>
                  <p className="text-xs text-accent font-medium mt-1">{s.registeredCount} registered &middot; {pct}%</p>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}
