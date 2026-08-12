import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { apiClient } from '../client'
import { getSupabaseClient, isSupabaseEnabled } from '../supabase-manager'
import type {
  Registration,
  RegistrationListResponse,
  RegistrationCreate,
  RegistrationStats,
  RegistrationStatus,
  DashboardStats,
  AdminRegistrationStats,
  StudentDashboardStats,
  LeaderboardEntry,
  DepartmentLeaderboardEntry,
  CompetitionDashboardData,
  HistoryEntry,
  AdvisorDashboardStats,
} from '@comp-dash/types'

const DASHBOARD_TABLE = 'competition_dashboard'

export function useRegistrations(params?: {
  status?: RegistrationStatus
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['registrations', params],
    queryFn: () =>
      apiClient.get<RegistrationListResponse>('/registrations', params as Record<string, unknown>),
    staleTime: 2 * 60 * 1000,
  })
}

export function useRegistration(id: string) {
  return useQuery({
    queryKey: ['registrations', id],
    queryFn: () => apiClient.get<Registration>(`/registrations/${id}`),
    enabled: !!id,
  })
}

export function useRegistrationStats() {
  return useQuery({
    queryKey: ['registrations', 'stats'],
    queryFn: () => apiClient.get<RegistrationStats>('/registrations/stats'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useRegisterForCompetition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: RegistrationCreate) => {
      const result = await apiClient.post<Registration, RegistrationCreate>('/registrations', data)

      if (isSupabaseEnabled()) {
        const sb = getSupabaseClient()
        if (sb) {
          const { error } = await sb.from('student_competitions').upsert({
            student_id: data.userId || '',
            student_email: data.userEmail || '',
            student_name: data.userName || '',
            competition_id: data.competitionId || '',
            competition_name: data.competitionTitle || '',
            verification_status: 'pending',
            verification_method: 'manual',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          if (error) console.error('Supabase student_competitions insert error:', error.message)
        }
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      queryClient.invalidateQueries({ queryKey: ['registrations', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['competitions'], refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['supabase-competitions'], refetchType: 'all' })
    },
  })
}

export function useVerifyRegistration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: 'approve' | 'reject'; reason?: string }) =>
      apiClient.patch<Registration>(`/registrations/${id}/verify`, { action, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      queryClient.invalidateQueries({ queryKey: ['registrations', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useStudentDashboardStats() {
  return useQuery({
    queryKey: ['student', 'dashboard', 'stats'],
    queryFn: () => apiClient.get<StudentDashboardStats>('/student/dashboard/stats'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useDashboardStats(dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['dashboard', 'stats', dateRange],
    queryFn: () =>
      apiClient.get<DashboardStats>('/admin/dashboard/stats', dateRange as Record<string, unknown>),
    staleTime: 5 * 60 * 1000,
  })
}

export function useAdminRegistrationStats() {
  return useQuery({
    queryKey: ['admin', 'registrations', 'stats'],
    queryFn: () => apiClient.get<AdminRegistrationStats>('/admin/registrations/stats'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useStudentHistory() {
  return useQuery({
    queryKey: ['student', 'history'],
    queryFn: () => apiClient.get<HistoryEntry[]>('/student/history'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useLeaderboardOverall() {
  return useQuery({
    queryKey: ['leaderboard', 'overall'],
    queryFn: () => apiClient.get<LeaderboardEntry[]>('/leaderboard/overall'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useLeaderboardDepartment(params?: { department?: string }) {
  return useQuery({
    queryKey: ['leaderboard', 'department', params],
    queryFn: () =>
      apiClient.get<LeaderboardEntry[]>('/leaderboard/department', params as Record<string, unknown>),
    staleTime: 5 * 60 * 1000,
  })
}

export function useLeaderboardDepartments() {
  return useQuery({
    queryKey: ['leaderboard', 'departments'],
    queryFn: () => apiClient.get<DepartmentLeaderboardEntry[]>('/leaderboard/departments'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCompetitionDashboard(id: string) {
  return useQuery({
    queryKey: ['competition', id, 'dashboard'],
    queryFn: () => apiClient.get<CompetitionDashboardData>(`/competitions/${id}/dashboard`),
    enabled: !!id,
  })
}

export function useAdvisorCompetitionStats(competitionId?: string) {
  return useQuery({
    queryKey: ['advisor', 'competition', competitionId, 'stats'],
    queryFn: async () => {
      if (!competitionId) return null
      const response = await apiClient.get<any>(`/advisor/competitions/${competitionId}/stats`)
      return {
        totalStudents: response.totalStudents || 0,
        appliedStudents: response.appliedStudents || 0,
        unregisteredStudents: response.unregisteredStudents || 0,
        registrationsByDepartment: response.registrationsByDepartment || [],
        studentsWithDetails: response.studentsWithDetails || [],
      }
    },
    enabled: !!competitionId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAdvisorDashboardStats() {
  return useQuery({
    queryKey: ['advisor', 'dashboard', 'stats'],
    queryFn: () => apiClient.get<AdvisorDashboardStats>('/advisor/dashboard/stats'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useHodDashboardStats() {
  return useQuery({
    queryKey: ['hod', 'dashboard', 'stats'],
    queryFn: () => apiClient.get<StudentDashboardStats>('/hod/dashboard/stats'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCoeDashboardStats() {
  return useQuery({
    queryKey: ['coe', 'dashboard', 'stats'],
    queryFn: () => apiClient.get<StudentDashboardStats>('/coe/dashboard/stats'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useRoleAccess() {
  return useQuery({
    queryKey: ['coe', 'role-access'],
    queryFn: () => apiClient.get<Record<string, unknown>>('/coe/role-access'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useSendReminder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/advisor/remind/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
    },
  })
}

export function useCreateCompetition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const result = await apiClient.post('/competitions', data)

      if (isSupabaseEnabled()) {
        const sb = getSupabaseClient()
        if (sb) {
          const { error } = await sb.from(DASHBOARD_TABLE).insert({
            id: crypto.randomUUID(),
            competition_name: (data.title as string) || '',
            category: (data.category as string) || 'competition',
            organizer: (data.organizer as string) || '',
            total_prize_amount: (data.prizePool as string) || '',
            website_url: (data.registrationUrl as string) || (data.websiteUrl as string) || '',
            registration_link: (data.registrationLink as string) || '',
            description: (data.description as string) || '',
            short_description: (data.shortDescription as string) || '',
            scope: (data.scope as string) || 'national',
            mode: (data.mode as string) || 'online',
            organizer_email: (data.organizerEmail as string) || '',
            team_size_min: (data.teamSizeMin as number) ?? 1,
            team_size_max: (data.teamSizeMax as number) ?? 1,
            tags: data.tags ? JSON.stringify(data.tags) : '[]',
            reg_deadline: (data.registrationDeadline as string) || null,
            r1_date: (data.startDate as string) || null,
            r2_date: (data.endDate as string) || null,
            eligible_year: ((data.eligibility as Record<string, unknown>)?.yearOfStudy as string[])?.[0] || '',
            competition_status: 'On Going',
            serial_no: Math.floor(Date.now() / 1000),
          })
          if (error) throw new Error(error.message)
        }
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'], refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['supabase-competitions'], refetchType: 'all' })
    },
  })
}

export function useUpdateCompetition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const result = await apiClient.put(`/competitions/${id}`, data)

      if (isSupabaseEnabled()) {
        const sb = getSupabaseClient()
        if (sb) {
          const updates: Record<string, unknown> = {}
          if (data.title !== undefined) updates.competition_name = data.title as string
          if (data.description !== undefined) updates.description = data.description as string
          if (data.shortDescription !== undefined) updates.short_description = data.shortDescription as string
          if (data.category !== undefined) updates.category = data.category as string
          if (data.scope !== undefined) updates.scope = data.scope as string
          if (data.mode !== undefined) updates.mode = data.mode as string
          if (data.organizer !== undefined) updates.organizer = data.organizer as string
          if (data.organizerEmail !== undefined) updates.organizer_email = data.organizerEmail as string
          if (data.prizePool !== undefined) updates.total_prize_amount = data.prizePool as string
          if (data.teamSizeMin !== undefined) updates.team_size_min = data.teamSizeMin as number
          if (data.teamSizeMax !== undefined) updates.team_size_max = data.teamSizeMax as number
          if (data.registrationUrl !== undefined) updates.website_url = data.registrationUrl as string
          else if (data.websiteUrl !== undefined) updates.website_url = data.websiteUrl as string
          if (data.registrationLink !== undefined) updates.registration_link = data.registrationLink as string
          if (data.tags !== undefined) updates.tags = JSON.stringify(data.tags)
          if (data.registrationDeadline !== undefined) updates.reg_deadline = (data.registrationDeadline as string) || null
          if (data.startDate !== undefined) updates.r1_date = (data.startDate as string) || null
          if (data.endDate !== undefined) updates.r2_date = (data.endDate as string) || null
          if (data.eligibility !== undefined) {
            updates.eligible_year = ((data.eligibility as Record<string, unknown>)?.yearOfStudy as string[])?.[0] || ''
          }
          updates.updated_at = new Date().toISOString()
          const { error } = await sb.from(DASHBOARD_TABLE).update(updates).eq('id', id)
          if (error) throw new Error(error.message)
        }
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'], refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['supabase-competitions'], refetchType: 'all' })
    },
  })
}

export function useDeleteCompetition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/competitions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'], refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['supabase-competitions'], refetchType: 'all' })
    },
  })
}

export function useCompetitionDashboardRealtime(id: string) {
  const queryClient = useQueryClient()
  const useSupabase = isSupabaseEnabled()

  useEffect(() => {
    if (!useSupabase || !id) return

    const sb = getSupabaseClient()
    if (!sb) return

    const channel = sb
      .channel(`competition-dashboard-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: DASHBOARD_TABLE,
          filter: `id=eq.${id}`,
        },
        (payload: any) => {
          queryClient.invalidateQueries({ queryKey: ['competition', id, 'dashboard'] })
          queryClient.invalidateQueries({ queryKey: ['supabase-competitions'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_competitions',
          filter: `competition_id=eq.${id}`,
        },
        (payload: any) => {
          queryClient.invalidateQueries({ queryKey: ['competition', id, 'dashboard'] })
        }
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [id, useSupabase, queryClient])
}