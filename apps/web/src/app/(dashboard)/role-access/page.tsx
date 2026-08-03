'use client'

import { useState, useEffect } from 'react'
import { Card } from '@comp-dash/design-system'
import { useRoleAccess } from '@comp-dash/api'
import { Shield, Users, UserCog, GraduationCap, Mail, Building2 } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'

type RoleGroup = 'student' | 'advisor' | 'hod'

interface RoleUser {
  id: string
  name: string
  email: string
  department: string
  role: RoleGroup
  active: boolean
}

export default function RoleAccessPage() {
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null)
  const [activeRole, setActiveRole] = useState<RoleGroup | 'all'>('all')
  const { data, isLoading, refetch } = useRoleAccess()

  useEffect(() => {
    setCurrentUser(getCurrentUser())
  }, [])

  const isAdmin = currentUser?.role === 'super_admin'

  const roleTabs: { key: RoleGroup | 'all'; label: string; icon: typeof Users }[] = [
    { key: 'all', label: 'All', icon: Users },
    { key: 'student', label: 'Students', icon: GraduationCap },
    { key: 'advisor', label: 'Advisors', icon: UserCog },
    ...(!isAdmin ? [{ key: 'hod' as const, label: 'HODs', icon: Shield }] : []),
  ]

  const allUsers: RoleUser[] = data ? [...((data as Record<string, unknown>)?.students as RoleUser[] || []), ...((data as Record<string, unknown>)?.advisors as RoleUser[] || [])] : []

  const filtered = activeRole === 'all' ? allUsers : allUsers.filter((u) => u.role === activeRole)

  const grouped = filtered.reduce<Record<RoleGroup, RoleUser[]>>(
    (acc, user) => {
      if (!acc[user.role]) acc[user.role] = []
      acc[user.role].push(user)
      return acc
    },
    { student: [], advisor: [], hod: [] }
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F0F6FC]">Role Access</h1>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="flex border-b border-gray-100">
          {roleTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveRole(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeRole === tab.key
                    ? 'text-accent border-b-2 border-accent bg-accent/5'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="p-6 space-y-8">
          {activeRole === 'all' ? (
            <>
              {(['student', 'advisor', ...(isAdmin ? [] : ['hod'])] as const).map((role) => {
                const roleUsers = grouped[role]
                if (roleUsers.length === 0) return null
                return (
                  <div key={role}>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      {role === 'student' ? <GraduationCap className="w-4 h-4" /> : role === 'advisor' ? <UserCog className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      {role === 'student' ? 'Students' : role === 'advisor' ? 'Advisors' : 'HODs'}
                      <span className="text-xs font-normal text-gray-400">({roleUsers.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {roleUsers.map((user) => (
                        <UserCard key={user.id} user={user} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">No users found</div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function UserCard({ user }: { user: RoleUser }) {
  return (
    <div className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
          {user.role === 'student' ? (
            <GraduationCap className="w-5 h-5 text-accent" />
          ) : user.role === 'advisor' ? (
            <UserCog className="w-5 h-5 text-accent" />
          ) : (
            <Shield className="w-5 h-5 text-accent" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
          <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500 truncate">
            <Mail className="w-3 h-3 shrink-0" />
            {user.email}
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <Building2 className="w-3 h-3 shrink-0" />
            {user.department}
          </div>
        </div>
      </div>
    </div>
  )
}
