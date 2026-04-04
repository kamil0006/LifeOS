import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { fetchExpensesList, fetchIncomeList, fetchScheduledExpensesList } from '../lib/financeQueryFns'
import { queryKeys } from '../lib/queryKeys'
import { useAuthenticatedQueryEnabled } from './useAuthenticatedQueryEnabled'

export type { ExpenseRow, IncomeRow, ScheduledExpenseRow } from '../lib/financeTypes'

export function useFinanceListsQuery() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const enabled = useAuthenticatedQueryEnabled()

  const expensesQuery = useQuery({
    queryKey: queryKeys.expenses(userId),
    queryFn: fetchExpensesList,
    enabled: enabled && !!userId,
  })

  const incomeQuery = useQuery({
    queryKey: queryKeys.income(userId),
    queryFn: fetchIncomeList,
    enabled: enabled && !!userId,
  })

  const scheduledQuery = useQuery({
    queryKey: queryKeys.scheduledExpenses(userId),
    queryFn: fetchScheduledExpensesList,
    enabled: enabled && !!userId,
  })

  const isLoading = expensesQuery.isPending || incomeQuery.isPending || scheduledQuery.isPending

  return {
    expenses: expensesQuery.data ?? [],
    income: incomeQuery.data ?? [],
    scheduledExpenses: scheduledQuery.data ?? [],
    isLoading,
    isError: expensesQuery.isError || incomeQuery.isError || scheduledQuery.isError,
    refetch: () =>
      Promise.all([expensesQuery.refetch(), incomeQuery.refetch(), scheduledQuery.refetch()]),
  }
}
