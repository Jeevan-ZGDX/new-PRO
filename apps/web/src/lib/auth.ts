export const OFFICIAL_COLLEGE_DOMAIN = 'citchennai.net'

export function isAllowedEmail(email: string): boolean {
  const clean = email.trim().toLowerCase()
  if (clean.endsWith(`@${OFFICIAL_COLLEGE_DOMAIN.toLowerCase()}`)) return true
  return false
}

export type UserRole = 'student' | 'advisor' | 'hod' | 'super_admin'

export interface StoredUser {
  email: string
  password: string
  role: UserRole
  name: string
  department: string
}

export const DEFAULT_USERS: StoredUser[] = [
  { email: 'admin@citchennai.net', password: 'admin123', role: 'super_admin', name: 'Super Admin', department: 'Administration' },
  { email: 'hod@citchennai.net', password: 'hod123', role: 'hod', name: 'Dr. HOD Kumar', department: 'CSE' },
  { email: 'advisor@citchennai.net', password: 'advisor123', role: 'advisor', name: 'Dr. Priya Sharma', department: 'CSE' },
  { email: 'student@citchennai.net', password: 'student123', role: 'student', name: 'Jeevan R', department: 'CSE' },
]

const USERS_KEY = 'comp_dash_users'
const CURRENT_USER_KEY = 'comp_dash_current_user'

export function getStoredUsers(): StoredUser[] {
  if (typeof window === 'undefined') return DEFAULT_USERS
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS))
      return DEFAULT_USERS
    }
    const users: StoredUser[] = JSON.parse(raw)
    if (!Array.isArray(users) || users.length === 0) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS))
      return DEFAULT_USERS
    }
    // Ensure default test credentials are included
    const existingEmails = new Set(users.map((u) => u.email.toLowerCase()))
    let updated = false
    for (const defUser of DEFAULT_USERS) {
      if (!existingEmails.has(defUser.email.toLowerCase())) {
        users.push(defUser)
        updated = true
      }
    }
    if (updated) {
      localStorage.setItem(USERS_KEY, JSON.stringify(users))
    }
    return users
  } catch {
    return DEFAULT_USERS
  }
}

export function registerUser(email: string, password: string, role: UserRole = 'student'): boolean {
  const users = getStoredUsers()
  const cleanEmail = email.trim().toLowerCase()
  if (users.find((u) => u.email.toLowerCase() === cleanEmail)) return false
  users.push({ email: cleanEmail, password, role, name: cleanEmail.split('@')[0], department: '' })
  if (typeof window !== 'undefined') {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }
  return true
}

export function authenticateUser(email: string, password: string): boolean {
  const users = getStoredUsers()
  const cleanEmail = email.trim().toLowerCase()
  const user = users.find((u) => u.email.toLowerCase() === cleanEmail && u.password === password)
  if (user) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ email: user.email }))
    }
    return true
  }
  return false
}

export function getCurrentUser(): { email: string; role: UserRole; name: string; department: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null')
    if (!raw || !raw.email) return null
    const users = getStoredUsers()
    const cleanEmail = String(raw.email).trim().toLowerCase()
    const match = users.find((u) => u.email.toLowerCase() === cleanEmail)
    if (!match) return null
    return { email: match.email, role: match.role, name: match.name, department: match.department }
  } catch {
    return null
  }
}

export function logoutUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CURRENT_USER_KEY)
    localStorage.removeItem('auth_token')
  }
}

export function isAuthenticated(): boolean {
  return !!getCurrentUser()
}

