import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../client'
import { getSupabaseClient, isSupabaseEnabled } from '../supabase-manager'
import type {
  Competition,
  CompetitionDetail,
  CompetitionListResponse,
  CompetitionFilters,
} from '@comp-dash/types'

const DASHBOARD_TABLE = 'competition_dashboard'

function isCompetitionActive(comp: Competition): boolean {
  if (!comp.registrationDeadline) return true
  return new Date(comp.registrationDeadline) > new Date()
}

async function fetchFromSupabase<T>(table: string, filters?: Record<string, unknown>): Promise<T> {
  const sb = getSupabaseClient()
  if (!sb) throw new Error('Supabase client not configured')

  let query = sb.from(DASHBOARD_TABLE).select('*', { count: 'exact' })

  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }
  if (filters?.search) {
    const s = String(filters.search)
    query = query.or(`competition_name.ilike.%${s}%,organizer.ilike.%${s}%`)
  }

  query = query.order('serial_no', { ascending: true })

  if (filters?.limit) {
    query = query.limit(Number(filters.limit))
  }
  if (filters?.page) {
    const page = Number(filters.page)
    const limit = Number(filters.limit) || 10
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)
  }

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  let mapped = (data || []).map(mapDashboardRow)
  mapped.sort((a: Competition, b: Competition) => {
    const aOpen = isCompetitionActive(a)
    const bOpen = isCompetitionActive(b)
    if (aOpen && !bOpen) return -1
    if (!aOpen && bOpen) return 1
    return (a as any).serial_no - (b as any).serial_no
  })

  return {
    data: mapped,
    total: count || data?.length || 0,
    page: Number(filters?.page) || 1,
    limit: Number(filters?.limit) || 10,
    totalPages: Math.ceil((count || data?.length || 0) / (Number(filters?.limit) || 10)),
  } as T
}

function mapDashboardRow(row: any): Competition {
  return {
    id: row.id,
    title: row.competition_name || '',
    description: row.description || '',
    shortDescription: row.short_description || '',
    category: (row.category || 'other').toLowerCase(),
    scope: row.scope || 'national',
    mode: row.mode || 'online',
    organizer: row.organizer || '',
    organizerEmail: row.organizer_email || '',
    organizerLogo: null,
    bannerUrl: null,
    websiteUrl: row.website_url || '',
    registrationUrl: row.website_url || '',
    registrationLink: row.registration_link || '',
    teamSizeMin: row.team_size_min ?? 1,
    teamSizeMax: row.team_size_max ?? 1,
    prizePool: row.total_prize_amount || '',
    registrationDeadline: row.reg_deadline || '',
    startDate: row.r1_date || '',
    endDate: row.r2_date || '',
    eligibility: { departments: [], yearOfStudy: [row.eligible_year || ''], description: '' },
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  }
}

export function useCompetitions(filters?: CompetitionFilters) {
  const useSupabase = isSupabaseEnabled()

  return useQuery({
    queryKey: useSupabase ? ['supabase-competitions', filters] : ['competitions', filters],
    queryFn: () => {
      if (useSupabase) {
        return fetchFromSupabase<CompetitionListResponse>('competitions', filters as Record<string, unknown>)
      }
      return apiClient.get<CompetitionListResponse>('/competitions', filters as Record<string, unknown>)
    },
    staleTime: 30 * 1000,
  })
}

export function useCompetition(id: string) {
  const useSupabase = isSupabaseEnabled()

  return useQuery({
    queryKey: useSupabase ? ['supabase-competitions', id] : ['competitions', id],
    queryFn: async () => {
      if (useSupabase) {
        const sb = getSupabaseClient()
        if (!sb) throw new Error('Supabase client not configured')
        const { data, error } = await sb.from(DASHBOARD_TABLE).select('*').eq('id', id).single()
        if (error) throw new Error(error.message)
        const base = mapDashboardRow(data)
        return {
          ...base,
          instructions: '',
          contactEmail: '',
          isBookmarked: false,
          bookmarkCount: 0,
          registrationCount: 0,
        } as CompetitionDetail
      }
      return apiClient.get<CompetitionDetail>(`/competitions/${id}`)
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

export function useUpcomingDeadlines() {
  const useSupabase = isSupabaseEnabled()

  return useQuery({
    queryKey: useSupabase ? ['supabase-competitions', 'upcoming'] : ['competitions', 'upcoming'],
    queryFn: async () => {
      if (useSupabase) {
        const sb = getSupabaseClient()
        if (!sb) return []
        const now = new Date().toISOString().split('T')[0]
        const { data } = await sb
          .from(DASHBOARD_TABLE)
          .select('*')
          .gte('reg_deadline', now)
          .order('reg_deadline', { ascending: true })
          .limit(5)
        return (data || []).map(mapDashboardRow)
      }
      return apiClient.get<Competition[]>('/competitions/upcoming')
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useTrendingCompetitions() {
  const useSupabase = isSupabaseEnabled()

  return useQuery({
    queryKey: useSupabase ? ['supabase-competitions', 'trending'] : ['competitions', 'trending'],
    queryFn: async () => {
      if (useSupabase) {
        const sb = getSupabaseClient()
        if (!sb) return []
        const { data } = await sb
          .from(DASHBOARD_TABLE)
          .select('*')
          .order('remaining_days_for_reg', { ascending: true })
          .limit(4)
        return (data || []).map(mapDashboardRow)
      }
      return apiClient.get<Competition[]>('/competitions/trending')
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useSearchCompetitions(query: string) {
  const useSupabase = isSupabaseEnabled()

  return useQuery({
    queryKey: useSupabase ? ['supabase-competitions', 'search', query] : ['competitions', 'search', query],
    queryFn: async () => {
      if (useSupabase) {
        const sb = getSupabaseClient()
        if (!sb || query.length < 2) return []
        const { data } = await sb
          .from(DASHBOARD_TABLE)
          .select('*')
          .or(`competition_name.ilike.%${query}%,organizer.ilike.%${query}%`)
          .limit(20)
        return (data || []).map(mapDashboardRow)
      }
      return apiClient.get<Competition[]>('/competitions/search', { q: query })
    },
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
  })
}
