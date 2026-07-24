import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export function isSupabaseConfigured(): boolean {
  return supabase !== null
}

// ─── Students ──────────────────────────────────────────────────────
export async function fetchStudentsFromSupabase() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Supabase fetch students error:', error.message)
    return []
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    department: row.department || 'CSE',
    year: row.year || '1st Year',
    section: row.section || 'A',
    registeredCompetitions: row.registered_competitions || 0,
    verifiedCompetitions: row.verified_competitions || 0,
    createdAt: row.created_at || new Date().toISOString(),
  }))
}

export async function upsertStudents(rows: Array<Record<string, unknown>>) {
  if (!supabase) return { success: false, reason: 'missing-config' }

  const mapped = rows.map(r => ({
    id: r.id,
    name: r.name,
    email: r.email,
    department: r.department || 'CSE',
    year: r.year || '1st Year',
    section: r.section || 'A',
    roll_number: r.rollNumber || r.roll_number || null,
    phone: r.phone || null,
    registered_competitions: r.registeredCompetitions || r.registered_competitions || 0,
    verified_competitions: r.verifiedCompetitions || r.verified_competitions || 0,
  }))

  const { error } = await supabase.from('students').upsert(mapped, { onConflict: 'id' })
  if (error) return { success: false, reason: error.message }
  return { success: true }
}

export async function insertStudent(student: Record<string, unknown>) {
  if (!supabase) return { success: false, reason: 'missing-config' }

  const row = {
    id: student.id,
    name: student.name,
    email: student.email,
    department: student.department || 'CSE',
    year: student.year || '1st Year',
    section: student.section || 'A',
    roll_number: student.rollNumber || null,
    phone: student.phone || null,
    registered_competitions: 0,
    verified_competitions: 0,
  }

  const { error } = await supabase.from('students').upsert(row, { onConflict: 'id' })
  if (error) return { success: false, reason: error.message }
  return { success: true }
}

// ─── Advisors ──────────────────────────────────────────────────────
export async function fetchAdvisorsFromSupabase() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('advisors')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Supabase fetch advisors error:', error.message)
    return []
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    department: row.department || 'CSE',
    assignedSections: row.assigned_sections || [],
    pendingVerifications: row.pending_verifications || 0,
    phone: row.phone || null,
    officeLocation: row.office_location || null,
    experience: row.experience || 0,
    publications: row.publications || 0,
    createdAt: row.created_at || new Date().toISOString(),
  }))
}

export async function upsertAdvisor(advisor: Record<string, unknown>) {
  if (!supabase) return { success: false, reason: 'missing-config' }

  const row = {
    id: advisor.id,
    name: advisor.name,
    email: advisor.email,
    department: advisor.department || 'CSE',
    assigned_sections: advisor.assignedSections || advisor.assigned_sections || [],
    pending_verifications: advisor.pendingVerifications || advisor.pending_verifications || 0,
    phone: advisor.phone || null,
    office_location: advisor.officeLocation || advisor.office_location || null,
    experience: advisor.experience || 0,
    publications: advisor.publications || 0,
  }

  const { error } = await supabase.from('advisors').upsert(row, { onConflict: 'id' })
  if (error) return { success: false, reason: error.message }
  return { success: true }
}

// ─── Competitions ──────────────────────────────────────────────────
export async function fetchCompetitionsFromSupabase() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('competitions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase fetch competitions error:', error.message)
    return []
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description || '',
    shortDescription: row.short_description || '',
    category: row.category,
    scope: row.scope,
    mode: row.mode,
    organizer: row.organizer,
    organizerLogo: row.organizer_logo,
    bannerUrl: row.banner_url,
    websiteUrl: row.website_url || '',
    registrationUrl: row.registration_url || '',
    teamSizeMin: row.team_size_min || 1,
    teamSizeMax: row.team_size_max || 1,
    prizePool: row.prize_pool || '',
    registrationDeadline: row.registration_deadline,
    startDate: row.start_date,
    endDate: row.end_date,
    eligibility: row.eligibility || {},
    tags: row.tags || [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  }))
}

export async function upsertCompetition(comp: Record<string, unknown>) {
  if (!supabase) return { success: false, reason: 'missing-config' }

  const row = {
    id: comp.id,
    title: comp.title,
    description: comp.description || '',
    short_description: comp.shortDescription || comp.short_description || '',
    category: comp.category,
    scope: comp.scope,
    mode: comp.mode,
    organizer: comp.organizer,
    organizer_logo: comp.organizerLogo || null,
    banner_url: comp.bannerUrl || null,
    website_url: comp.websiteUrl || '',
    registration_url: comp.registrationUrl || '',
    team_size_min: comp.teamSizeMin || comp.team_size_min || 1,
    team_size_max: comp.teamSizeMax || comp.team_size_max || 1,
    prize_pool: comp.prizePool || comp.prize_pool || '',
    registration_deadline: comp.registrationDeadline || null,
    start_date: comp.startDate || comp.start_date || null,
    end_date: comp.endDate || comp.end_date || null,
    eligibility: comp.eligibility || {},
    tags: comp.tags || [],
  }

  const { error } = await supabase.from('competitions').upsert(row, { onConflict: 'id' })
  if (error) return { success: false, reason: error.message }
  return { success: true }
}

// ─── Registrations ─────────────────────────────────────────────────
export async function fetchRegistrationsFromSupabase() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase fetch registrations error:', error.message)
    return []
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    competitionId: row.competition_id,
    userId: row.user_id,
    userName: row.user_name,
    department: row.department || 'CSE',
    status: row.status || 'pending_verification',
    registeredAt: row.registered_at,
    verifiedAt: row.verified_at,
    verificationMethod: row.verification_method,
    extractedConfirmationId: row.extracted_confirmation_id,
    extractedEmail: row.extracted_email,
    rejectionReason: row.rejection_reason,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function upsertRegistration(reg: Record<string, unknown>) {
  if (!supabase) return { success: false, reason: 'missing-config' }

  const row = {
    id: reg.id,
    competition_id: reg.competitionId,
    user_id: reg.userId,
    user_name: reg.userName,
    department: reg.department || 'CSE',
    status: reg.status || 'pending_verification',
    registered_at: reg.registeredAt || new Date().toISOString(),
    verified_at: reg.verifiedAt || null,
    verification_method: reg.verificationMethod || null,
    extracted_confirmation_id: reg.extractedConfirmationId || null,
    extracted_email: reg.extractedEmail || null,
    rejection_reason: reg.rejectionReason || null,
    notes: reg.notes || null,
  }

  const { error } = await supabase.from('registrations').upsert(row, { onConflict: 'id' })
  if (error) return { success: false, reason: error.message }
  return { success: true }
}

// ─── Winners ───────────────────────────────────────────────────────
export async function fetchWinnersFromSupabase() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('winners')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase fetch winners error:', error.message)
    return []
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    studentName: row.student_name,
    email: row.email,
    competition: row.competition,
    competitionId: row.competition_id,
    department: row.department || 'CSE',
    position: row.position || '',
    prize: row.prize || '',
    date: row.date,
    verificationDate: row.verification_date,
    registrationId: row.registration_id,
  }))
}

export async function upsertWinner(winner: Record<string, unknown>) {
  if (!supabase) return { success: false, reason: 'missing-config' }

  const row = {
    id: winner.id,
    student_name: winner.studentName,
    email: winner.email,
    competition: winner.competition,
    competition_id: winner.competitionId || null,
    department: winner.department || 'CSE',
    position: winner.position || '',
    prize: winner.prize || '',
    date: winner.date || null,
    verification_date: winner.verificationDate || null,
    registration_id: winner.registrationId || null,
  }

  const { error } = await supabase.from('winners').upsert(row, { onConflict: 'id' })
  if (error) return { success: false, reason: error.message }
  return { success: true }
}

// ─── Notifications ─────────────────────────────────────────────────
export async function fetchNotificationsFromSupabase(userId?: string) {
  if (!supabase) return []

  let query = supabase.from('notifications').select('*').order('created_at', { ascending: false })
  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query

  if (error) {
    console.error('Supabase fetch notifications error:', error.message)
    return []
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    data: row.data,
    isRead: row.is_read,
    createdAt: row.created_at,
  }))
}

export async function upsertNotification(notif: Record<string, unknown>) {
  if (!supabase) return { success: false, reason: 'missing-config' }

  const row = {
    id: notif.id,
    user_id: notif.userId,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    data: notif.data || null,
    is_read: notif.isRead || false,
  }

  const { error } = await supabase.from('notifications').upsert(row, { onConflict: 'id' })
  if (error) return { success: false, reason: error.message }
  return { success: true }
}

// ─── Audit Logs ────────────────────────────────────────────────────
export async function fetchAuditLogsFromSupabase() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })

  if (error) {
    console.error('Supabase fetch audit_logs error:', error.message)
    return []
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    timestamp: row.timestamp,
    user: row.user,
    action: row.action,
    resource: row.resource,
    details: row.details || '',
  }))
}

export async function insertAuditLog(log: Record<string, unknown>) {
  if (!supabase) return { success: false, reason: 'missing-config' }

  const { error } = await supabase.from('audit_logs').upsert({
    id: log.id,
    timestamp: log.timestamp || new Date().toISOString(),
    user: log.user,
    action: log.action,
    resource: log.resource,
    details: log.details || '',
  }, { onConflict: 'id' })

  if (error) return { success: false, reason: error.message }
  return { success: true }
}

// ─── Verification Requests ─────────────────────────────────────────
export async function fetchVerificationRequestsFromSupabase() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('verification_requests')
    .select('*')
    .order('requested_at', { ascending: false })

  if (error) {
    console.error('Supabase fetch verification_requests error:', error.message)
    return []
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    registrationId: row.registration_id,
    studentId: row.student_id,
    studentName: row.student_name,
    department: row.department || 'CSE',
    competitionTitle: row.competition_title || '',
    advisorNotified: row.advisor_notified || false,
    emailProof: row.email_proof,
    status: row.status || 'pending',
    requestedAt: row.requested_at,
    reviewedAt: row.reviewed_at,
  }))
}

export async function upsertVerificationRequest(vr: Record<string, unknown>) {
  if (!supabase) return { success: false, reason: 'missing-config' }

  const row = {
    id: vr.id,
    registration_id: vr.registrationId,
    student_id: vr.studentId,
    student_name: vr.studentName,
    department: vr.department || 'CSE',
    competition_title: vr.competitionTitle || '',
    advisor_notified: vr.advisorNotified || false,
    email_proof: vr.emailProof || null,
    status: vr.status || 'pending',
    requested_at: vr.requestedAt || new Date().toISOString(),
    reviewed_at: vr.reviewedAt || null,
  }

  const { error } = await supabase.from('verification_requests').upsert(row, { onConflict: 'id' })
  if (error) return { success: false, reason: error.message }
  return { success: true }
}

// ─── Role Access ───────────────────────────────────────────────────
export async function fetchRoleAccessFromSupabase() {
  if (!supabase) return []

  const { data, error } = await supabase.from('role_access').select('*')

  if (error) {
    console.error('Supabase fetch role_access error:', error.message)
    return []
  }

  return (data || []).map((row: any) => ({
    email: row.email,
    role: row.role,
    department: row.department || 'CSE',
    granted: row.granted || false,
  }))
}

export async function upsertRoleAccess(access: Record<string, unknown>) {
  if (!supabase) return { success: false, reason: 'missing-config' }

  const { error } = await supabase.from('role_access').upsert({
    email: access.email,
    role: access.role,
    department: access.department || 'CSE',
    granted: access.granted || false,
  }, { onConflict: 'email' })

  if (error) return { success: false, reason: error.message }
  return { success: true }
}
