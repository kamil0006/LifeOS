import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { expensesApi, scheduledExpensesApi } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import { invalidateFinanceQueries } from '../lib/invalidateFinanceQueries'
import type { ExpenseRow, ScheduledExpenseRow } from '../lib/financeTypes'

/** Optimistic updates + invalidate on settle for finance lists (Expenses page). */
export function useOptimisticExpenseMutations() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const expensesKey = queryKeys.expenses(userId)
  const scheduledKey = queryKeys.scheduledExpenses(userId)

  const addExpense = useMutation({
    mutationFn: (vars: { name: string; amount: number; category: string; date: string }) =>
      expensesApi.create(vars),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: expensesKey })
      const previous = queryClient.getQueryData<ExpenseRow[]>(expensesKey)
      const optimistic: ExpenseRow = {
        ...vars,
        id: `optimistic-${Date.now()}`,
        date: vars.date,
      }
      queryClient.setQueryData<ExpenseRow[]>(expensesKey, (old) => [...(old ?? []), optimistic])
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) queryClient.setQueryData(expensesKey, ctx.previous)
    },
    onSettled: () => {
      void invalidateFinanceQueries(queryClient, userId)
    },
  })

  const deleteExpense = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: expensesKey })
      const previous = queryClient.getQueryData<ExpenseRow[]>(expensesKey)
      queryClient.setQueryData<ExpenseRow[]>(expensesKey, (old) =>
        (old ?? []).filter((e) => e.id !== id)
      )
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous !== undefined) queryClient.setQueryData(expensesKey, ctx.previous)
    },
    onSettled: () => {
      void invalidateFinanceQueries(queryClient, userId)
    },
  })

  const addScheduled = useMutation({
    mutationFn: (vars: { name: string; amount: number; category: string; dayOfMonth: number }) =>
      scheduledExpensesApi.create(vars),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: scheduledKey })
      const previous = queryClient.getQueryData<ScheduledExpenseRow[]>(scheduledKey)
      const optimistic: ScheduledExpenseRow = {
        ...vars,
        id: `optimistic-${Date.now()}`,
        active: true,
      }
      queryClient.setQueryData<ScheduledExpenseRow[]>(scheduledKey, (old) => [
        ...(old ?? []),
        optimistic,
      ])
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) queryClient.setQueryData(scheduledKey, ctx.previous)
    },
    onSettled: () => {
      void invalidateFinanceQueries(queryClient, userId)
    },
  })

  const deleteScheduled = useMutation({
    mutationFn: (id: string) => scheduledExpensesApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: scheduledKey })
      const previous = queryClient.getQueryData<ScheduledExpenseRow[]>(scheduledKey)
      queryClient.setQueryData<ScheduledExpenseRow[]>(scheduledKey, (old) =>
        (old ?? []).filter((s) => s.id !== id)
      )
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous !== undefined) queryClient.setQueryData(scheduledKey, ctx.previous)
    },
    onSettled: () => {
      void invalidateFinanceQueries(queryClient, userId)
    },
  })

  return { addExpense, deleteExpense, addScheduled, deleteScheduled }
}
