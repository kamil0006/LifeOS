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

  /** Soft polling: świeże dane gdy karta otwarta dłużej (inna karta / telefon nie wymaga SSE na start). */
  const listOptions = {
    enabled: enabled && !!userId,
    refetchInterval: 45_000 as number | false,
    refetchIntervalInBackground: false,
  }

  const expensesQuery = useQuery({
    queryKey: queryKeys.expenses(userId),
    queryFn: fetchExpensesList,
    ...listOptions,
  })

  const incomeQuery = useQuery({
    queryKey: queryKeys.income(userId),
    queryFn: fetchIncomeList,
    ...listOptions,
  })

  const scheduledQuery = useQuery({
    queryKey: queryKeys.scheduledExpenses(userId),
    queryFn: fetchScheduledExpensesList,
    ...listOptions,
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
