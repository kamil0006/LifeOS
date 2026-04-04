import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from './queryKeys'

export function invalidateFinanceQueries(queryClient: QueryClient, userId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.expenses(userId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.income(userId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.scheduledExpenses(userId) }),
  ])
}
