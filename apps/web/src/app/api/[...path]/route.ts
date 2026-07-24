import { NextRequest, NextResponse } from 'next/server'
import {
  departments, students, advisors, competitions, registrations,
  winners, auditLogs, notifications, verificationRequests,
  ensureLoaded, pushRegistration, pushNotification,
  pushVerificationRequest, pushWinner, pushStudent, pushAdvisor,
  pushCompetition, syncRegistration, syncVerificationRequests, syncNotifications,
} from '@/lib/firebase-data'
import { getAllRoleAccessData, setUserAccess, checkUserAccess } from '@/lib/firestore-service'
import type { UserRole } from '@/lib/auth'

const userProfile = {
  id: 'user-1',
  email: 'admin@citchennai.net',
  name: 'Admin User',
  avatarUrl: null as string | null,
  department: 'CSE',
  section: 'A',
  academicYear: '2024-2025',
  role: 'super_admin' as const,
  organizationId: 'org-cit',
  createdAt: '2023-06-01T09:00:00Z',
  updatedAt: '2025-07-01T09:00:00Z',
  notificationPreferences: { emailNotifications: true, pushNotifications: true, deadlineReminders: true, verificationUpdates: true, newCompetitions: false },
  language: 'en' as const,
}

// ─── Types & Helper Functions ───────────────────────────────────────
type RouteHandler = (req: NextRequest, segments: string[]) => Promise<NextResponse>

function ok(data: unknown) {
  return NextResponse.json({ success: true, data })
}

function paginated<T>(items: T[], page: number, limit: number) {
  const total = items.length
  const totalPages = Math.ceil(total / limit)
  const start = (page - 1) * limit
  return {
    data: items.slice(start, start + limit),
    total,
    page,
    limit,
    totalPages,
  }
}

function filterRegs(list: typeof registrations, qs: URLSearchParams) {
  let result = [...list]
  const status = qs.get('status')
  if (status && status !== 'all') result = result.filter(r => r.status === status)
  return result
}

function filterStudents(list: typeof students, qs: URLSearchParams) {
  let result = [...list]
  const s = qs.get('search')?.toLowerCase()
  if (s) result = result.filter(x => x.name.toLowerCase().includes(s) || x.email.toLowerCase().includes(s))
  const dept = qs.get('department')
  if (dept) result = result.filter(x => x.department === dept)
  return result
}

function filterAdvisors(list: typeof advisors, qs: URLSearchParams) {
  let result = [...list]
  const s = qs.get('search')?.toLowerCase()
  if (s) result = result.filter(x => x.name.toLowerCase().includes(s) || x.email.toLowerCase().includes(s))
  return result
}

function filterComps(list: typeof competitions, qs: URLSearchParams) {
  let result = [...list]
  const cat = qs.get('category')
  if (cat) result = result.filter(c => c.category === cat)
  const s = qs.get('search')?.toLowerCase()
  if (s) result = result.filter(c => c.title.toLowerCase().includes(s) || c.organizer.toLowerCase().includes(s))
  return result
}

const routes: Record<string, RouteHandler> = {}

function register(method: string, pattern: string, handler: RouteHandler) {
  const key = `${method}:${pattern}`
  routes[key] = handler
}

async function handle(request: NextRequest, pathSegments: string[]) {
  await ensureLoaded()
  const method = request.method
  const qs = new URL(request.url).searchParams
  const path = '/' + pathSegments.join('/')

  const exactKey = `${method}:${path}`
  if (routes[exactKey]) return routes[exactKey](request, pathSegments)

  for (const [key, handler] of Object.entries(routes)) {
    const colonIdx = key.indexOf(':')
    const m = key.slice(0, colonIdx)
    const pattern = key.slice(colonIdx + 1)
    if (m !== method) continue
    const patternParts = pattern.split('/')
    if (patternParts.length !== pathSegments.length + 1) continue
    let match = true
    for (let i = 0; i < pathSegments.length; i++) {
      const pp = patternParts[i + 1]
      if (pp?.startsWith(':')) continue
      if (pp !== pathSegments[i]) { match = false; break }
    }
    if (match) return handler(request, pathSegments)
  }

  return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: `No handler for ${method} ${path}` } }, { status: 404 })
}

function getProfileByEmail(email: string) {
  const roleMap: Record<string, { id: string; email: string; name: string; role: UserRole; department: string }> = {
    'hod@cit.in': { id: 'user-hod', email: 'hod@cit.in', name: 'Dr. HOD Kumar', role: 'hod', department: 'CSE' },
    'advisor@cit.in': { id: 'user-adv', email: 'advisor@cit.in', name: 'Dr. Priya Sharma', role: 'advisor', department: 'CSE' },
    'student@cit.in': { id: 'user-stu', email: 'student@cit.in', name: 'Jeevan R', role: 'student', department: 'CSE' },
  }
  return roleMap[email] || { ...userProfile, email, id: 'user-' + email.split('@')[0] }
}

function getEmailFromToken(req: NextRequest): string {
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')
  const parts = token.split('-')
  return parts[2] || 'hod@cit.in'
}

// --- AUTH ---
register('POST', '/auth/google', async (req) => {
  const body = await req.json()
  const email = body.email || 'hod@cit.in'
  const profile = getProfileByEmail(email)
  const token = 'mock-jwt-' + email + '-' + Date.now()
  return ok({ user: profile, token, refreshToken: 'mock-refresh-' + Date.now() })
})

register('GET', '/auth/check-access', async (req) => {
  const url = new URL(req.url)
  const email = url.searchParams.get('email') || getEmailFromToken(req)
  const result = await checkUserAccess(email)
  return ok(result)
})

register('GET', '/auth/me', async (req) => {
  const email = getEmailFromToken(req)
  return ok({ ...getProfileByEmail(email), ...userProfile, email, role: getProfileByEmail(email).role })
})

register('PUT', '/auth/profile', async (req) => {
  const body = await req.json()
  Object.assign(userProfile, body)
  return ok(userProfile)
})

register('PUT', '/auth/notification-preferences', async (req) => {
  const body = await req.json()
  if (userProfile.notificationPreferences) Object.assign(userProfile.notificationPreferences, body)
  return ok(userProfile.notificationPreferences)
})

register('PUT', '/auth/language', async (req) => {
  const body = await req.json()
  userProfile.language = body.language
  return ok({ language: body.language })
})

register('POST', '/auth/logout', async () => ok(null))

// --- COMPETITIONS ---
register('POST', '/competitions', async (req) => {
  const body = await req.json()
  const { title, description, shortDescription, category, scope, mode, organizer, websiteUrl, registrationUrl, teamSizeMin, teamSizeMax, prizePool, registrationDeadline, startDate, endDate, eligibility, tags } = body
  if (!title || !category || !scope || !mode || !organizer) {
    return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'title, category, scope, mode, and organizer are required' } }, { status: 400 })
  }
  const now = new Date().toISOString()
  const newCompetition = {
    id: 'comp-' + Date.now(),
    title,
    description: description || '',
    shortDescription: shortDescription || '',
    category,
    scope,
    mode,
    organizer,
    organizerLogo: null,
    bannerUrl: null,
    websiteUrl: websiteUrl || '',
    registrationUrl: registrationUrl || '',
    teamSizeMin: teamSizeMin || 1,
    teamSizeMax: teamSizeMax || 1,
    prizePool: prizePool || '',
    registrationDeadline: registrationDeadline || '',
    startDate: startDate || '',
    endDate: endDate || '',
    eligibility: eligibility || { departments: [], yearOfStudy: [], description: '' },
    tags: tags || [],
    createdAt: now,
    updatedAt: now,
  }
  await pushCompetition(newCompetition)
  return ok(newCompetition)
})

register('GET', '/competitions', async (req) => {
  const qs = new URL(req.url).searchParams
  const filtered = filterComps(competitions, qs)
  const page = parseInt(qs.get('page') || '1')
  const limit = parseInt(qs.get('limit') || '10')
  return ok(paginated(filtered, page, limit))
})

register('GET', '/competitions/upcoming', async () => {
  const upcoming = competitions.filter(c => new Date(c.startDate) > new Date()).slice(0, 5)
  return ok(upcoming)
})

register('GET', '/competitions/trending', async () => {
  const trending = competitions.filter(c => c.scope === 'national' || c.scope === 'international').slice(0, 4)
  return ok(trending)
})

register('GET', '/competitions/search', async (req) => {
  const q = new URL(req.url).searchParams.get('q')?.toLowerCase() || ''
  const results = competitions.filter(c => c.title.toLowerCase().includes(q))
  return ok(results)
})

register('GET', '/competitions/:id', async (req, seg) => {
  const id = seg[1]
  const comp = competitions.find(c => c.id === id)
  if (!comp) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Competition not found' } }, { status: 404 })
  return ok({
    ...comp,
    registrationCount: registrations.filter(r => r.competitionId === id).length,
    isBookmarked: false,
    bookmarkCount: 0,
  })
})

register('POST', '/competitions/:id/bookmark', async (req, seg) => {
  const id = seg[1]
  return ok({ message: 'Competition bookmarked', id })
})

register('GET', '/competitions/:id/match-feedback', async (req, seg) => {
  const id = seg[1]
  return ok({ feedback: `Your performance in ${competitions.find(c => c.id === id)?.title || 'this competition'}` })
})

// ─── REGISTRATIONS ───────────────────────────────────────────────────
register('GET', '/registrations', async (req) => {
  const qs = new URL(req.url).searchParams
  const filtered = filterRegs(registrations, qs)
  const page = parseInt(qs.get('page') || '1')
  const limit = parseInt(qs.get('limit') || '10')
  return ok(paginated(filtered, page, limit))
})

register('POST', '/registrations', async (req) => {
  const body = await req.json()
  const { competitionId, userId, verificationMethod, confirmationScreenshot, confirmationEmail } = body
  if (!competitionId || !userId || !verificationMethod) {
    return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'competitionId, userId, and verificationMethod are required' } }, { status: 400 })
  }
  const existing = registrations.find(r => r.competitionId === competitionId && r.userId === userId)
  if (existing) return ok({ ...existing, alreadyRegistered: true })
  const comp = competitions.find(c => c.id === competitionId)
  if (!comp) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Competition not found' } }, { status: 404 })
  const user = students.find(s => s.id === userId)
  if (!user) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 })
  const newRegistration = {
    id: 'reg-' + Date.now(),
    competitionId,
    userId,
    userName: user.name,
    department: user.department,
    status: 'pending_verification' as const,
    registeredAt: new Date().toISOString(),
    verifiedAt: null,
    verificationMethod,
    extractedConfirmationId: null,
    extractedEmail: null,
    rejectionReason: null,
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  await pushRegistration(newRegistration)
  await pushNotification({
    id: 'notif-' + Date.now(),
    userId,
    type: 'verification_update',
    title: 'Registration Submitted',
    message: `Your registration for ${comp.title} has been submitted and is pending verification.`,
    data: null,
    isRead: false,
    createdAt: new Date().toISOString(),
  })
  return ok({ ...newRegistration, alreadyRegistered: false })
})

register('GET', '/registrations/user/:userId', async (req, seg) => {
  const userId = seg[1]
  const userRegs = registrations.filter(r => r.userId === userId)
  return ok(userRegs.map(r => ({
    ...r,
    competition: competitions.find(c => c.id === r.competitionId) || null,
  })))
})

register('GET', '/registrations/:id', async (req, seg) => {
  const id = seg[1]
  const reg = registrations.find(r => r.id === id)
  if (!reg) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Registration not found' } }, { status: 404 })
  return ok({
    ...reg,
    competition: competitions.find(c => c.id === reg.competitionId) || null,
    user: students.find(s => s.id === reg.userId) || null,
  })
})

register('PUT', '/registrations/:id', async (req, seg) => {
  const id = seg[1]
  const updates = await req.json()
  const item = registrations.find(r => r.id === id)
  if (!item) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Registration not found' } }, { status: 404 })
  const updated = { ...item, ...updates, updatedAt: new Date().toISOString() }
  const idx = registrations.indexOf(item)
  registrations[idx] = updated
  await syncRegistration(updated.id)
  return ok(updated)
})

// ─── VERIFICATION REQUESTS ───────────────────────────────────────────
register('POST', '/verification-requests', async (req) => {
  const body = await req.json()
  const { registrationId, studentEmail } = body
  if (!registrationId || !studentEmail) return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'registrationId and studentEmail required' } }, { status: 400 })
  const student = students.find(s => s.email.toLowerCase() === studentEmail.toLowerCase())
  if (!student) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Student not found' } }, { status: 404 })
  const reg = registrations.find(r => r.id === registrationId)
  if (!reg) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Registration not found' } }, { status: 404 })
  const existingVr = verificationRequests.find(v => v.registrationId === registrationId && v.studentId === student.id)
  if (existingVr) return ok({ ...existingVr, alreadyRequested: true })
  const newVr = {
    id: 'vr-' + (verificationRequests.length + 1),
    registrationId,
    studentId: student.id,
    studentName: student.name,
    department: student.department,
    competitionTitle: reg.competition?.title || 'Unknown',
    advisorNotified: false,
    emailProof: null,
    status: 'pending' as const,
    requestedAt: new Date().toISOString(),
  }
  await pushVerificationRequest(newVr as any)
  await pushNotification({
    id: 'notif-' + (notifications.length + 1),
    userId: student.id,
    type: 'verification_update' as const,
    title: 'Verification Requested',
    message: `${student.name} has requested verification for ${reg.competition?.title || 'a competition'}.`,
    data: null,
    isRead: false,
    createdAt: new Date().toISOString(),
  })
  return ok({ ...newVr, alreadyRequested: false })
})

register('POST', '/verification-requests/with-proof', async (req) => {
  const body = await req.json()
  const { registrationId, emailProof, studentId } = body
  if (!registrationId || !emailProof || !studentId) return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'registrationId, emailProof, and studentId required' } }, { status: 400 })
  const vr = verificationRequests.find(v => v.registrationId === registrationId && v.studentId === studentId)
  if (!vr) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Verification request not found' } }, { status: 404 })
  const student = students.find(s => s.id === studentId)
  if (!student) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Student not found' } }, { status: 404 })
  vr.emailProof = emailProof
  vr.status = 'under_review'
  vr.advisorNotified = true
  vr.reviewedAt = new Date().toISOString()
  await syncVerificationRequests()
  await pushNotification({
    id: 'notif-' + (notifications.length + 1),
    userId: student.id,
    type: 'verification_update' as const,
    title: 'Verification Under Review',
    message: `Your verification request for ${vr.competitionTitle} has been received and is under review.`,
    data: null,
    isRead: false,
    createdAt: new Date().toISOString(),
  })
  return ok(vr)
})

register('PUT', '/verification-requests/:id', async (req, seg) => {
  const id = seg[1]
  const updates = await req.json()
  const item = verificationRequests.find(v => v.id === id)
  if (!item) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Verification request not found' } }, { status: 404 })
  const updated = { ...item, ...updates }
  const idx = verificationRequests.indexOf(item)
  verificationRequests[idx] = updated
  await syncVerificationRequests()
  return ok(updated)
})

register('GET', '/verification-requests/user/:userId', async (req, seg) => {
  const userId = seg[1]
  const userVrs = verificationRequests.filter(v => v.studentId === userId)
  return ok(userVrs)
})

// ─── NOTIFICATIONS ───────────────────────────────────────────────────
register('GET', '/notifications', async (req) => {
  const qs = new URL(req.url).searchParams
  const userId = qs.get('userId')
  if (!userId) return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'userId required' } }, { status: 400 })
  const userNotifications = notifications.filter(n => n.userId === userId)
  return ok(userNotifications)
})

register('PUT', '/notifications/:id/read', async (req, seg) => {
  const id = seg[1]
  const item = notifications.find(n => n.id === id)
  if (!item) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } }, { status: 404 })
  item.isRead = true
  const idx = notifications.indexOf(item)
  notifications[idx] = item
  await syncNotifications()
  return ok(item)
})

// ─── AUDIT LOGS ───────────────────────────────────────────────────────
register('GET', '/audit-logs', async (req) => {
  const qs = new URL(req.url).searchParams
  const page = parseInt(qs.get('page') || '1')
  const limit = parseInt(qs.get('limit') || '10')
  return ok(paginated(auditLogs, page, limit))
})

register('GET', '/audit-logs/:id', async (req, seg) => {
  const id = seg[1]
  const log = auditLogs.find(l => l.id === id)
  if (!log) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Audit log not found' } }, { status: 404 })
  return ok(log)
})

// ─── ADMIN ROUTES (legacy - mapped to COE) ───────────────────────────────────
register('GET', '/admin/dashboard/stats', async () => {
  const totalCompetitions = competitions.length
  const totalRegistrations = registrations.length
  const verifiedRegistrations = registrations.filter(r => r.status === 'verified' || r.status === 'completed').length
  const verificationRate = totalRegistrations > 0 ? Math.round((verifiedRegistrations / totalRegistrations) * 100) : 0
  const registrationsOverTime = [
    { date: '2025-04-01', count: 2 }, { date: '2025-04-08', count: 4 }, { date: '2025-04-15', count: 1 },
    { date: '2025-04-22', count: 4 }, { date: '2025-05-01', count: 5 }, { date: '2025-05-08', count: 3 },
    { date: '2025-05-15', count: 7 }, { date: '2025-05-22', count: 4 }, { date: '2025-06-01', count: 6 },
    { date: '2025-06-08', count: 8 }, { date: '2025-06-15', count: 5 }, { date: '2025-06-22', count: 3 },
  ]
  const topDepartments = departments.map(d => ({ name: d.name, count: students.filter(s => s.department === d.name).length * 3 })).sort((a, b) => b.count - a.count).slice(0, 5)
  const recentVerified = registrations.filter(r => r.verifiedAt).sort((a, b) => new Date(b.verifiedAt!).getTime() - new Date(a.verifiedAt!).getTime()).slice(0, 5)
  const pendingVerifications = registrations.filter(r => r.status === 'pending_verification').slice(0, 5)
  const selfVerificationRequests = verificationRequests.filter(v => v.status === 'pending').slice(0, 5)

  return ok({ totalCompetitions, totalRegistrations, verifiedRegistrations, verificationRate, registrationsOverTime, topDepartments, recentVerified, pendingVerifications, selfVerificationRequests })
})

register('GET', '/admin/registrations/stats', async () => {
  const totalRegistered = registrations.length
  const totalVerified = registrations.filter(r => r.status === 'verified' || r.status === 'completed').length
  const totalPending = registrations.filter(r => r.status === 'pending_verification').length
  const totalRejected = registrations.filter(r => r.status === 'rejected').length
  const totalCompleted = registrations.filter(r => r.status === 'completed').length
  const verificationRate = totalRegistered > 0 ? Math.round((totalVerified / totalRegistered) * 100) : 0
  const registrationGrowth = 15.5
  const verifiedGrowth = 12.3
  const verificationRateChange = 2.1

  return ok({ totalRegistered, totalVerified, totalCompleted, totalRejected, totalPending, verificationRate, registrationGrowth, verifiedGrowth, verificationRateChange })
})

register('GET', '/admin/students', async (req) => {
  const qs = new URL(req.url).searchParams
  const filtered = filterStudents(students, qs)
  const page = parseInt(qs.get('page') || '1')
  const limit = parseInt(qs.get('limit') || '10')
  return ok(paginated(filtered, page, limit))
})

register('POST', '/admin/students', async (req) => {
  const body = await req.json()
  const { name, email, year, section } = body
  if (!name || !email) {
    return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'name and email required' } }, { status: 400 })
  }
  const newStudent = {
    id: 'stu-' + (students.length + 1),
    name,
    email,
    department: 'CSE',
    year: year || '1st Year',
    section: section || 'A',
    registeredCompetitions: 0,
    verifiedCompetitions: 0,
    createdAt: new Date().toISOString(),
  }
  await pushStudent(newStudent)
  return ok(newStudent)
})

register('GET', '/admin/advisors', async (req) => {
  const qs = new URL(req.url).searchParams
  const filtered = filterAdvisors(advisors, qs)
  const page = parseInt(qs.get('page') || '1')
  const limit = parseInt(qs.get('limit') || '10')
  return ok(paginated(filtered, page, limit))
})

register('POST', '/admin/advisors', async (req) => {
  const body = await req.json()
  const { name, email, assignedSections } = body
  if (!name || !email) {
    return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'name and email required' } }, { status: 400 })
  }
  const newAdvisor = {
    id: 'adv-' + (advisors.length + 1),
    name,
    email,
    department: 'CSE',
    assignedSections: assignedSections || [],
    pendingVerifications: 0,
    createdAt: new Date().toISOString(),
  }
  await pushAdvisor(newAdvisor)
  return ok(newAdvisor)
})

register('GET', '/admin/departments', async () => ok(departments))

register('GET', '/admin/winners', async (req) => {
  const qs = new URL(req.url).searchParams
  let filtered = [...winners]
  const s = qs.get('search')?.toLowerCase()
  if (s) filtered = filtered.filter(w => w.studentName.toLowerCase().includes(s) || w.competition.toLowerCase().includes(s))
  const page = parseInt(qs.get('page') || '1')
  const limit = parseInt(qs.get('limit') || '10')
  return ok(paginated(filtered, page, limit))
})

register('POST', '/admin/winners', async (req) => {
  const body = await req.json()
  const { studentName, email, competition, competitionId, department, position, prize } = body
  if (!studentName || !email || !competition) {
    return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'studentName, email, and competition are required' } }, { status: 400 })
  }
  const newWinner = {
    id: 'win-' + (winners.length + 1),
    studentName,
    email,
    competition,
    competitionId: competitionId || null,
    department: department || 'CSE',
    position: position || '',
    prize: prize || '',
    date: new Date().toISOString().split('T')[0],
    verificationDate: new Date().toISOString(),
    registrationId: null,
  }
  await pushWinner(newWinner)
  await pushNotification({
    id: 'notif-' + (notifications.length + 1),
    userId: 'user-1',
    type: 'winner_announced' as const,
    title: 'Winner Announced',
    message: `${studentName} from ${department} has won ${position} in ${competition}!`,
    data: null,
    isRead: false,
    createdAt: new Date().toISOString(),
  })
  return ok(newWinner)
})

register('GET', '/admin/analytics/stats', async () => {
  const totalCompetitions = competitions.length
  const totalParticipants = registrations.length
  const winRate = registrations.length > 0 ? Math.round((winners.length / registrations.length) * 100) : 0
  const verifiedCount = registrations.filter(r => r.status === 'verified' || r.status === 'completed').length
  const verificationRate = registrations.length > 0 ? Math.round((verifiedCount / registrations.length) * 100) : 0
  const competitionTrends = [
    { date: 'Jan', count: 2 }, { date: 'Feb', count: 3 }, { date: 'Mar', count: 1 },
    { date: 'Apr', count: 5 }, { date: 'May', count: 4 }, { date: 'Jun', count: 6 },
  ]
  const departmentPerformance = departments.slice(0, 6).map(d => ({
    name: d.name,
    count: registrations.filter(r => r.competition.eligibility.departments.includes(d.name)).length * 2 || Math.floor(Math.random() * 20) + 5,
  }))
  const verificationRateOverTime = [
    { date: 'Jan', rate: 75 }, { date: 'Feb', rate: 78 }, { date: 'Mar', rate: 72 },
    { date: 'Apr', rate: 80 }, { date: 'May', rate: 85 }, { date: 'Jun', rate: 82 },
  ]
  return ok({ totalCompetitions, totalParticipants, winRate, verificationRate, competitionTrends, departmentPerformance, verificationRateOverTime })
})

// ─── GMAIL OAUTH ---
register('GET', '/auth/gmail', async (req) => {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID || '')
  url.searchParams.set('redirect_uri', process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/gmail/callback')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'https://www.googleapis.com/auth/gmail.readonly openid email')
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')
  return NextResponse.redirect(url.toString())
})

register('GET', '/auth/gmail/callback', async (req) => {
  const qs = new URL(req.url).searchParams
  const code = qs.get('code')
  if (!code) return NextResponse.redirect(new URL('/email-verification?error=no_code', req.url))

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/gmail/callback',
      grant_type: 'authorization_code',
    }).toString(),
  })

  if (!tokenResponse.ok) return NextResponse.redirect(new URL('/login?error=auth_failed', req.url))

  const { access_token, refresh_token, expires_in } = await tokenResponse.json()
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  if (!userResponse.ok) return NextResponse.redirect(new URL('/login?error=user_info_failed', req.url))

  const user = await userResponse.json()
  const token = 'mock-jwt-' + user.email + '-' + Date.now()
  return ok({ user, token, refreshToken: refresh_token })
})

register('GET', '/auth/gmail/callback', async (req) => {
  const qs = new URL(req.url).searchParams
  const code = qs.get('code')
  if (!code) return NextResponse.redirect(new URL('/email-verification?error=no_code', req.url))

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/gmail/callback',
      grant_type: 'authorization_code',
    }).toString(),
  })

  if (!tokenResponse.ok) return NextResponse.redirect(new URL('/login?error=auth_failed', req.url))

  const { access_token, refresh_token, expires_in } = await tokenResponse.json()
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  if (!userResponse.ok) return NextResponse.redirect(new URL('/login?error=user_info_failed', req.url))

  const user = await userResponse.json()
  const token = 'mock-jwt-' + user.email + '-' + Date.now()
  return ok({ user, token, refreshToken: refresh_token })
})

register('POST', '/verification-requests', async (req) => {
  const body = await req.json()
  const { registrationId, studentEmail } = body
  if (!registrationId || !studentEmail) return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'registrationId and studentEmail required' } }, { status: 400 })
  const student = students.find(s => s.email.toLowerCase() === studentEmail.toLowerCase())
  if (!student) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Student not found' } }, { status: 404 })
  const reg = registrations.find(r => r.id === registrationId)
  if (!reg) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Registration not found' } }, { status: 404 })
  const existingVr = verificationRequests.find(v => v.registrationId === registrationId && v.studentId === student.id)
  if (existingVr) return ok({ ...existingVr, alreadyRequested: true })
  const newVr = {
    id: 'vr-' + (verificationRequests.length + 1),
    registrationId,
    studentId: student.id,
    studentName: student.name,
    department: student.department,
    competitionTitle: reg.competition?.title || 'Unknown',
    advisorNotified: false,
    emailProof: null,
    status: 'pending' as const,
    requestedAt: new Date().toISOString(),
  }
  await pushVerificationRequest(newVr as any)
  await pushNotification({
    id: 'notif-' + (notifications.length + 1),
    userId: student.id,
    type: 'verification_update' as const,
    title: 'Verification Requested',
    message: `${student.name} has requested verification for ${reg.competition?.title || 'a competition'}.`,
    data: null,
    isRead: false,
    createdAt: new Date().toISOString(),
  })
  return ok({ ...newVr, alreadyRequested: false })
})

register('GET', '/notifications', async (req) => {
  const qs = new URL(req.url).searchParams
  const userId = qs.get('userId')
  if (!userId) return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'userId required' } }, { status: 400 })
  const userNotifications = notifications.filter(n => n.userId === userId)
  return ok(userNotifications)
})

register('PUT', '/notifications/:id/read', async (req, seg) => {
  const id = seg[1]
  const item = notifications.find(n => n.id === id)
  if (!item) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } }, { status: 404 })
  item.isRead = true
  const idx = notifications.indexOf(item)
  notifications[idx] = item
  await syncNotifications()
  return ok(item)
})

register('GET', '/audit-logs', async (req) => {
  const qs = new URL(req.url).searchParams
  const page = parseInt(qs.get('page') || '1')
  const limit = parseInt(qs.get('limit') || '10')
  return ok(paginated(auditLogs, page, limit))
})

register('GET', '/audit-logs/:id', async (req, seg) => {
  const id = seg[1]
  const log = auditLogs.find(l => l.id === id)
  if (!log) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Audit log not found' } }, { status: 404 })
  return ok(log)
})

// ─── IMPORT ENDPOINT ---
register('POST', '/admin/import', async (req) => {
  try {
    const body = await req.json()
    const { type, items } = body
    
    if (!type || !items) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Missing type or items' } },
        { status: 400 }
      )
    }
    
    const processedItems = items.map((item: Record<string, unknown>) => {
      const base = { ...item }
      if (type === 'advisors' && item.assignedSections && typeof item.assignedSections === 'string') {
        base.assignedSections = item.assignedSections.split(',').map((s: string) => s.trim()).filter(Boolean)
      }
      if (type === 'students' && item.createdAt && typeof item.createdAt === 'string') {
        base.createdAt = new Date(item.createdAt).toISOString()
      }
      if (type === 'competitions' && item.eligibility && typeof item.eligibility === 'string') {
        base.eligibility = JSON.parse(item.eligibility)
      }
      if (type === 'competitions' && item.tags && typeof item.tags === 'string') {
        base.tags = JSON.parse(item.tags)
      }
      return base
    })
    
    // Import to local data stores
    for (const item of processedItems) {
      switch (type) {
        case 'advisors':
          await pushAdvisor(item)
          break
        case 'students':
          await pushStudent(item)
          break
        case 'competitions':
          await pushCompetition(item)
          break
        case 'winners':
          await pushWinner(item)
          break
        case 'registrations':
          await pushRegistration(item)
          break
      }
    }
    
    const remainingItems = items.length > 100 ? items.slice(0, 100) : items
    return ok({
      success: true,
      message: `Successfully imported ${items.length} records for ${type}`,
      count: items.length,
      preview: remainingItems.slice(0, 5),
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'IMPORT_ERROR', message: 'Failed to import data' } },
      { status: 500 }
    )
  }
})

// ─── END OF IMPORT ENDPOINT ---

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handle(request, params.path)
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handle(request, params.path)
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handle(request, params.path)
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handle(request, params.path)
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handle(request, params.path)
}