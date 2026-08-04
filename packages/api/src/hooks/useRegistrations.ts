import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../client'
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
} from '@comp-dash/types'

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
    mutationFn: (data: RegistrationCreate) =>
      apiClient.post<Registration, RegistrationCreate>('/registrations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      queryClient.invalidateQueries({ queryKey: ['registrations', 'stats'] })
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

export function useAdvisorDashboardStats() {
  return useQuery({
    queryKey: ['advisor', 'dashboard', 'stats'],
    queryFn: () => apiClient.get<StudentDashboardStats>('/advisor/dashboard/stats'),
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
    mutationFn: (data: Record<string, unknown>) => apiClient.post('/competitions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] })
    },
  })
}

export function useUpdateCompetition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.put(`/competitions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] })
    },
  })
}

export function useDeleteCompetition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/competitions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] })
    },
  })
}
