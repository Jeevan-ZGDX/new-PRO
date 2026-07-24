import studentsData from './students-data.json'
import {
  isSupabaseConfigured,
  fetchStudentsFromSupabase,
  fetchAdvisorsFromSupabase,
  fetchCompetitionsFromSupabase,
  fetchRegistrationsFromSupabase,
  fetchWinnersFromSupabase,
  fetchNotificationsFromSupabase,
  fetchAuditLogsFromSupabase,
  fetchVerificationRequestsFromSupabase,
  upsertStudents,
  upsertAdvisor,
  upsertCompetition,
  upsertRegistration,
  upsertWinner,
  upsertNotification,
  upsertVerificationRequest,
  insertAuditLog,
} from './supabase-client'

// ─── In-memory caches ───────────────────────────────────────────────
export const departments: any[] = [
  {
    id: 'dept-1',
    name: 'CSE',
    fullName: 'Computer Science & Engineering',
    studentCount: studentsData.total_count,
    competitionCount: 0,
    head: '',
    email: '',
    establishedYear: 2000,
    website: ''
  }
]
export let students: any[] = [...studentsData.students]
export let advisors: any[] = []
export let competitions: any[] = []
export let registrations: any[] = []
export let winners: any[] = []
export let auditLogs: any[] = []
export let notifications: any[] = []
export let verificationRequests: any[] = []

let loaded = false

function hydrateFromStorage() {
  if (typeof window === 'undefined') return

  try {
    const cachedStudents = window.localStorage.getItem('comp_dash_students')
    if (cachedStudents) {
      const parsed = JSON.parse(cachedStudents)
      if (Array.isArray(parsed) && parsed.length > 0) {
        students.splice(0, students.length, ...parsed)
      }
    } else {
      window.localStorage.setItem('comp_dash_students', JSON.stringify(students))
    }

    const cachedAdvisors = window.localStorage.getItem('comp_dash_advisors')
    if (cachedAdvisors) {
      const parsed = JSON.parse(cachedAdvisors)
      if (Array.isArray(parsed) && parsed.length > 0) advisors.splice(0, advisors.length, ...parsed)
    }

    const cachedCompetitions = window.localStorage.getItem('comp_dash_competitions')
    if (cachedCompetitions) {
      const parsed = JSON.parse(cachedCompetitions)
      if (Array.isArray(parsed) && parsed.length > 0) competitions.splice(0, competitions.length, ...parsed)
    }

    const cachedRegistrations = window.localStorage.getItem('comp_dash_registrations')
    if (cachedRegistrations) {
      const parsed = JSON.parse(cachedRegistrations)
      if (Array.isArray(parsed) && parsed.length > 0) registrations.splice(0, registrations.length, ...parsed)
    }

    const cachedWinners = window.localStorage.getItem('comp_dash_winners')
    if (cachedWinners) {
      const parsed = JSON.parse(cachedWinners)
      if (Array.isArray(parsed) && parsed.length > 0) winners.splice(0, winners.length, ...parsed)
    }

    const cachedNotifications = window.localStorage.getItem('comp_dash_notifications')
    if (cachedNotifications) {
      const parsed = JSON.parse(cachedNotifications)
      if (Array.isArray(parsed) && parsed.length > 0) notifications.splice(0, notifications.length, ...parsed)
    }

    const cachedAuditLogs = window.localStorage.getItem('comp_dash_audit_logs')
    if (cachedAuditLogs) {
      const parsed = JSON.parse(cachedAuditLogs)
      if (Array.isArray(parsed) && parsed.length > 0) auditLogs.splice(0, auditLogs.length, ...parsed)
    }

    const cachedVRs = window.localStorage.getItem('comp_dash_verification_requests')
    if (cachedVRs) {
      const parsed = JSON.parse(cachedVRs)
      if (Array.isArray(parsed) && parsed.length > 0) verificationRequests.splice(0, verificationRequests.length, ...parsed)
    }

    if (departments[0]) departments[0].studentCount = students.length
  } catch (error) {
    console.error('Failed to hydrate from localStorage:', error)
  }
}

function persistToStorage() {
  if (typeof window === 'undefined') return
  localStorage.setItem('comp_dash_students', JSON.stringify(students))
  localStorage.setItem('comp_dash_advisors', JSON.stringify(advisors))
  localStorage.setItem('comp_dash_competitions', JSON.stringify(competitions))
  localStorage.setItem('comp_dash_registrations', JSON.stringify(registrations))
  localStorage.setItem('comp_dash_winners', JSON.stringify(winners))
  localStorage.setItem('comp_dash_notifications', JSON.stringify(notifications))
  localStorage.setItem('comp_dash_audit_logs', JSON.stringify(auditLogs))
  localStorage.setItem('comp_dash_verification_requests', JSON.stringify(verificationRequests))
}

export async function ensureLoaded() {
  if (loaded) return
  loaded = true

  hydrateFromStorage()

  if (!isSupabaseConfigured()) {
    console.log('[Comp-Dash] Supabase not configured — using local data only')
    return
  }

  console.log('[Comp-Dash] Loading data from Supabase...')

  const [sStudents, sAdvisors, sComps, sRegs, sWinners, sNotifs, sLogs, sVRs] = await Promise.all([
    fetchStudentsFromSupabase(),
    fetchAdvisorsFromSupabase(),
    fetchCompetitionsFromSupabase(),
    fetchRegistrationsFromSupabase(),
    fetchWinnersFromSupabase(),
    fetchNotificationsFromSupabase(),
    fetchAuditLogsFromSupabase(),
    fetchVerificationRequestsFromSupabase(),
  ])

  if (sStudents.length > 0) {
    students.splice(0, students.length, ...sStudents)
    if (departments[0]) departments[0].studentCount = students.length
  }
  if (sAdvisors.length > 0) advisors.splice(0, advisors.length, ...sAdvisors)
  if (sComps.length > 0) competitions.splice(0, competitions.length, ...sComps)
  if (sRegs.length > 0) registrations.splice(0, registrations.length, ...sRegs)
  if (sWinners.length > 0) winners.splice(0, winners.length, ...sWinners)
  if (sNotifs.length > 0) notifications.splice(0, notifications.length, ...sNotifs)
  if (sLogs.length > 0) auditLogs.splice(0, auditLogs.length, ...sLogs)
  if (sVRs.length > 0) verificationRequests.splice(0, verificationRequests.length, ...sVRs)

  persistToStorage()
  console.log(`[Comp-Dash] Loaded: ${students.length} students, ${advisors.length} advisors, ${competitions.length} competitions`)
}

// ─── Sync functions ────────────────────────────────────────────────
export async function syncRegistration(id: string) {
  const item = registrations.find(r => r.id === id)
  if (item) {
    await upsertRegistration(item)
    persistToStorage()
  }
}

export async function syncRegistrations() {
  await Promise.all(registrations.map(r => upsertRegistration(r)))
  persistToStorage()
}

export async function syncNotifications() {
  await Promise.all(notifications.map(n => upsertNotification(n)))
  persistToStorage()
}

export async function syncVerificationRequests() {
  await Promise.all(verificationRequests.map(v => upsertVerificationRequest(v)))
  persistToStorage()
}

export async function syncWinners() {
  await Promise.all(winners.map(w => upsertWinner(w)))
  persistToStorage()
}

export async function syncStudents() {
  await upsertStudents(students)
  persistToStorage()
}

export async function syncAdvisors() {
  await Promise.all(advisors.map(a => upsertAdvisor(a)))
  persistToStorage()
}

export async function pushRegistration(item: any) {
  registrations.push(item)
  await upsertRegistration(item)
  persistToStorage()
}

export async function pushNotification(item: any) {
  notifications.push(item)
  await upsertNotification(item)
  persistToStorage()
}

export async function pushVerificationRequest(item: any) {
  verificationRequests.push(item)
  await upsertVerificationRequest(item)
  persistToStorage()
}

export async function pushWinner(item: any) {
  winners.push(item)
  await upsertWinner(item)
  persistToStorage()
}

export async function pushStudent(item: any) {
  students.push(item)
  await upsertStudents([item])
  persistToStorage()
}

export async function pushAdvisor(item: any) {
  advisors.push(item)
  await upsertAdvisor(item)
  persistToStorage()
}

export async function pushCompetition(item: any) {
  competitions.push(item)
  await upsertCompetition(item)
  persistToStorage()
}

export async function syncCompetition(id: string) {
  const item = competitions.find(c => c.id === id)
  if (item) {
    await upsertCompetition(item)
    persistToStorage()
  }
}
