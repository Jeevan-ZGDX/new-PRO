'use client'

import { useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, Badge, Button } from '@comp-dash/design-system'
import { useCompetitionSections } from '@comp-dash/api'
import { exportToCSV } from '@/lib/export-csv'
import { AlertTriangle, ArrowLeft, Download, Users } from 'lucide-react'

/**
 * Department-wide, section-wise registration breakdown for one competition.
 *
 * This is the HOD/admin counterpart to AdvisorRosterPanel: an advisor sees only
 * their own sections (resolved from their `advisors` row), whereas a HOD has no
 * advisors row at all and needs every section in the department. Rendering the
 * advisor panel for a HOD produced "no advisor record is mapped to this
 * account", which read as a broken page.
 */
export function HodSectionsPanel({
  competitionId,
  competitionTitle,
}: {
  competitionId: string
  competitionTitle?: string
}) {
  const { data, isLoading, error } = useCompetitionSections(competitionId)
  const [selected, setSelected] = useState<string | null>(null)

  const totals = useMemo(() => {
    const sections = data?.sections ?? []
    return {
      sections: sections.length,
      students: sections.reduce((n, s) => n + s.totalCount, 0),
      registered: sections.reduce((n, s) => n + s.registeredCount, 0),
    }
  }, [data])

  if (isLoading) {
    return (
      <Card data-testid="hod-sections-panel">
        <div className="h-6 w-56 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-zinc-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      </Card>
    )
  }

  if (error) {
    const err = (error as any)?.response?.data?.error
    return (
      <Card data-testid="hod-sections-panel">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {err?.message || 'Could not load section data'}
            </p>
            {err?.detail && <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{err.detail}</p>}
          </div>
        </div>
      </Card>
    )
  }

  if (!data) return null

  // The competition admits no cohort we hold data for.
  if (data.notEligible) {
    return (
      <Card data-testid="hod-sections-panel">
        <CardHeader>
          <CardTitle>Section-wise Registrations</CardTitle>
        </CardHeader>
        <div className="mt-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            This competition does not admit any year we currently hold student data for, so there are
            no sections to report.
          </p>
        </div>
      </Card>
    )
  }

  const handleExport = () => {
    const headers = ['Section', 'Students', 'Registered', 'Not registered', 'Coverage %']
    const rows = data.sections.map((s) => [
      s.section,
      String(s.totalCount),
      String(s.registeredCount),
      String(s.totalCount - s.registeredCount),
      s.totalCount ? String(Math.round((s.registeredCount / s.totalCount) * 100)) : '0',
    ])
    exportToCSV(`sections-${competitionId}`, headers, rows)
  }

  const active = selected ? data.sections.find((s) => s.section === selected) : null

  return (
    <Card data-testid="hod-sections-panel">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <CardTitle>Section-wise Registrations</CardTitle>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1" data-testid="hod-sections-scope">
            {competitionTitle ? `${competitionTitle} · ` : ''}
            {data.eligibleYears.join(', ') || '—'} · {totals.sections} sections · {totals.students} students ·{' '}
            {totals.registered} registered
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-1.5" /> Export CSV
        </Button>
      </div>

      {active ? (
        <div className="mt-5">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to all sections
          </button>

          <div className="mt-4 flex items-baseline gap-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Section {active.section}</h3>
            <span className="text-sm text-gray-500 dark:text-zinc-400">
              {active.registeredCount} / {active.totalCount} registered
            </span>
          </div>

          {active.registered && active.registered.length > 0 ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-zinc-400">
                    <th className="py-2 pr-4 font-medium">Student</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {active.registered.map((s) => (
                    <tr
                      key={s.id}
                      className="border-t border-gray-100 dark:border-zinc-800/60"
                      data-testid="hod-section-student-row"
                    >
                      <td className="py-2.5 pr-4 text-gray-900 dark:text-white">{s.name}</td>
                      <td className="py-2.5 pr-4 text-gray-500 dark:text-zinc-400">{s.email}</td>
                      <td className="py-2.5">
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
            <div className="mt-6 text-center py-8">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-zinc-700" />
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                No student in section {active.section} has registered for this competition yet.
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-4">
            Click a section to view its registered students
          </p>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="hod-sections-grid">
            {data.sections.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-zinc-500">
                No section data available
              </div>
            ) : (
              data.sections.map((s) => {
                const pct = s.totalCount ? Math.round((s.registeredCount / s.totalCount) * 100) : 0
                return (
                  <button
                    key={s.section}
                    onClick={() => setSelected(s.section)}
                    data-testid={`hod-section-card-${s.section}`}
                    className="text-left p-4 bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-700/50 rounded-xl transition-transform duration-200 hover:scale-[1.03] cursor-pointer"
                  >
                    <p
                      className="text-base font-bold text-gray-900 dark:text-white"
                      data-testid="hod-section-label"
                    >
                      {s.section}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{s.totalCount} students</p>
                    <p className="text-xs text-accent font-medium mt-1">
                      {s.registeredCount} registered &middot; {pct}%
                    </p>
                    <div className="mt-2 h-1.5 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </>
      )}
    </Card>
  )
}
