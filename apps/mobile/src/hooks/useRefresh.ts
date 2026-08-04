import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useRefresh() {
  const [refreshing, setRefreshing] = useState(false)
  const queryClient = useQueryClient()

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries()
    setRefreshing(false)
  }, [queryClient])

  return { refreshing, onRefresh }
}
