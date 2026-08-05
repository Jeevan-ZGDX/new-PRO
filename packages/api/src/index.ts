export { apiClient } from './client'
export { setSupabaseClient, getSupabaseClient, isSupabaseEnabled } from './supabase-manager'
export { useLogin, useProfile, useUpdateProfile, useUpdateNotificationPreferences, useUpdateLanguage, useLogout } from './hooks/useAuth'
export { useCompetitions, useCompetition, useUpcomingDeadlines, useTrendingCompetitions, useSearchCompetitions } from './hooks/useCompetitions'
export { useLeaderboardOverall, useLeaderboardDepartment, useLeaderboardDepartments } from './hooks/useLeaderboard'
export {
  useRegistrations,
  useRegistration,
  useRegistrationStats,
  useRegisterForCompetition,
  useVerifyRegistration,
  useDashboardStats,
  useAdminRegistrationStats,
  useStudentDashboardStats,
  useStudentHistory,
  useCompetitionDashboard,
  useAdvisorDashboardStats,
  useHodDashboardStats,
  useCoeDashboardStats,
  useRoleAccess,
  useSendReminder,
  useCreateCompetition,
  useUpdateCompetition,
  useDeleteCompetition,
  useAdvisorCompetitionStats,
} from './hooks/useRegistrations'
export { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useUnreadNotificationCount } from './hooks/useNotifications'
export { useBookmarks, useToggleBookmark, useIsBookmarked } from './hooks/useBookmarks'
export {
  useAdminStudents,
  useAdminAdvisors,
  useAdminDepartments,
  useAdminWinners,
  useAdminAnalytics,
  useAdminAuditLogs,
} from './hooks/useAdmin'
