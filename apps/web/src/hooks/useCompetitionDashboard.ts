'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase-client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export interface CompetitionDashboardItem {
  id: string
  serialNo: number
  competitionName: string
  competitionStatus: string
  eligibleYear: string
  regDeadline: string | null
  r1Date: string | null
  r2Date: string | null
  remainingDaysForReg: number
  rDaysForR1: number
  rDaysForR2: number
  regTeam: number
  totalPrizeAmount: string
  category: string
  organizer: string
  createdAt: string
  updatedAt: string
}

export interface CompetitionDashboardFilters {
  search?: string
  category?: string
  status?: string
}

async function fetchDashboardFromSupabase(filters?: CompetitionDashboardFilters) {
  if (!supabase) return []

  let query = supabase
    .from('competition_dashboard')
    .select('*')
    .order('serial_no', { ascending: true })

  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('competition_status', filters.status)
  }
  if (filters?.search) {
    query = query.or(
      `competition_name.ilike.%${filters.search}%,organizer.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return (data || []).map((row: any) => ({
    id: row.id,
    serialNo: row.serial_no,
    competitionName: row.competition_name,
    competitionStatus: row.competition_status,
    eligibleYear: row.eligible_year,
    regDeadline: row.reg_deadline,
    r1Date: row.r1_date,
    r2Date: row.r2_date,
    remainingDaysForReg: row.remaining_days_for_reg,
    rDaysForR1: row.r_days_for_r1,
    rDaysForR2: row.r_days_for_r2,
    regTeam: row.reg_team,
    totalPrizeAmount: row.total_prize_amount,
    category: row.category,
    organizer: row.organizer,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })) as CompetitionDashboardItem[]
}

export function useCompetitionDashboard(filters?: CompetitionDashboardFilters) {
  const queryClient = useQueryClient()
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)

  const query = useQuery({
    queryKey: ['competition-dashboard', filters],
    queryFn: () => fetchDashboardFromSupabase(filters),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel('competition-dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'competition_dashboard',
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          queryClient.invalidateQueries({ queryKey: ['competition-dashboard'] })
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return {
    ...query,
    isRealtimeConnected,
  }
}

export function useCompetitionDashboardItem(id: string) {
  return useQuery({
    queryKey: ['competition-dashboard', id],
    queryFn: async () => {
      if (!supabase) return null
      const { data, error } = await supabase
        .from('competition_dashboard')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw new Error(error.message)
      if (!data) return null
      return {
        id: data.id,
        serialNo: data.serial_no,
        competitionName: data.competition_name,
        competitionStatus: data.competition_status,
        eligibleYear: data.eligible_year,
        regDeadline: data.reg_deadline,
        r1Date: data.r1_date,
        r2Date: data.r2_date,
        remainingDaysForReg: data.remaining_days_for_reg,
        rDaysForR1: data.r_days_for_r1,
        rDaysForR2: data.r_days_for_r2,
        regTeam: data.reg_team,
        totalPrizeAmount: data.total_prize_amount,
        category: data.category,
        organizer: data.organizer,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as CompetitionDashboardItem
    },
    enabled: !!id,
  })
}
