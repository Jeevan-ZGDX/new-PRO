import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import type { CompetitionSectionsResponse } from '@comp-dash/types'

export function useCompetitionSections(id: string) {
  return useQuery<CompetitionSectionsResponse>({
    queryKey: ['competitions', 'sections', id],
    queryFn: async () => {
      if (!id) throw new Error('Missing competition id')
      const res = await apiClient.get<CompetitionSectionsResponse>(`/competitions/${id}/sections`)
      return res
    },
    enabled: !!id,
  })
}
