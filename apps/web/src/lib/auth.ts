export type UserRole = 'student' | 'advisor' | 'hod' | 'super_admin'

export interface StoredUser {
  email: string
  password: string
  role: UserRole
  name: string
  department: string
}

const USERS_KEY = 'comp_dash_users'
const CURRENT_USER_KEY = 'comp_dash_current_user'

export function getStoredUsers(): StoredUser[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
  } catch {
    return []
  }
}

export function registerUser(email: string, password: string, role: UserRole = 'student'): boolean {
  const users = getStoredUsers()
  if (users.find((u) => u.email === email)) return false
  users.push({ email, password, role, name: email.split('@')[0], department: '' })
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  return true
}

export function authenticateUser(email: string, password: string): boolean {
  const users = getStoredUsers()
  const user = users.find((u) => u.email === email && u.password === password)
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ email }))
    return true
  }
  return false
}

export function getCurrentUser(): { email: string; role: UserRole; name: string; department: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null')
    if (!raw) return null
    const users = getStoredUsers()
    const match = users.find((u) => u.email === raw.email)
    if (!match) return null
    return { email: raw.email, role: match.role, name: match.name, department: match.department }
  } catch {
    return null
  }
}

export function logoutUser(): void {
  localStorage.removeItem(CURRENT_USER_KEY)
  localStorage.removeItem('auth_token')
}

export function isAuthenticated(): boolean {
  return !!getCurrentUser()
}
