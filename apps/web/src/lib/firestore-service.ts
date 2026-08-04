const roleAccessData: Record<string, any> = {
  'hod@cit.in': { email: 'hod@cit.in', role: 'hod', department: 'CSE', granted: true },
  'advisor@cit.in': { email: 'advisor@cit.in', role: 'advisor', department: 'CSE', granted: true },
  'student@cit.in': { email: 'student@cit.in', role: 'student', department: 'CSE', granted: true },
  'admin@cit.in': { email: 'admin@cit.in', role: 'super_admin', department: 'Administration', granted: true },
}

export async function checkUserAccess(email: string): Promise<any> {
  return roleAccessData[email] || { email, role: 'student', department: 'CSE', granted: false }
}

export async function getAllRoleAccessData(): Promise<any[]> {
  return Object.values(roleAccessData)
}

export async function setUserAccess(email: string, data: any): Promise<void> {
  roleAccessData[email] = { ...roleAccessData[email], ...data }
}
