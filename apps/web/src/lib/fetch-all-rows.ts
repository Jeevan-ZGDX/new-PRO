/**
 * PostgREST caps an unbounded select at 1,000 rows (Supabase's default
 * `max-rows`). The students table alone holds 2,200+ rows, so any query that
 * feeds a count silently under-reports without explicit paging.
 */
const PAGE_SIZE = 1000

export interface FetchAllResult<T = any> {
  rows: T[]
  error: string | null
}

/**
 * Drains a Supabase query builder page by page.
 *
 * Pass a query with filters/selects already applied but no `.range()`:
 *   fetchAllRows(db.from('students').select('id').eq('year', '3rd Year'))
 */
export async function fetchAllRows<T = any>(
  query: any,
  pageSize = PAGE_SIZE
): Promise<FetchAllResult<T>> {
  const rows: T[] = []
  let offset = 0

  for (;;) {
    // Supabase builders are single-use once awaited; range() returns a new
    // builder from the same base each iteration, which is safe to await.
    const { data, error } = await query.range(offset, offset + pageSize - 1)
    if (error) return { rows, error: error.message }

    const batch = (data ?? []) as T[]
    rows.push(...batch)

    if (batch.length < pageSize) break
    offset += pageSize
  }

  return { rows, error: null }
}
