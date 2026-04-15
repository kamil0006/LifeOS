import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useDemoData } from '../context/DemoDataContext'
import { expensesApi, incomeApi } from '../lib/api'
import { invalidateFinanceQueries } from '../lib/invalidateFinanceQueries'

export type TransactionFormData = { name: string; amount: number; category?: string; date: string }

/**
 * Wspólna logika zapisu przychodu/wydatku (Transakcje + skróty globalne).
 */
export function useFinanceTransactionSubmit() {
  const { isDemoMode, user } = useAuth()
  const queryClient = useQueryClient()
  const demoData = useDemoData()
  const userId = user?.id ?? ''

  const submit = useCallback(
    async (formType: 'income' | 'expense', data: TransactionFormData) => {
      const date = data.date ?? new Date().toISOString().split('T')[0]
      if (formType === 'income') {
        if (isDemoMode) {
          if (demoData) {
            demoData.addIncome({ source: data.name, amount: data.amount, date, recurring: false })
          } else {
            console.warn('DemoDataProvider brak – przychód nie został zapisany')
          }
        } else {
          await incomeApi.create({ source: data.name, amount: data.amount, date })
          await invalidateFinanceQueries(queryClient, userId)
        }
      } else {
        if (isDemoMode) {
          if (demoData) {
            demoData.addExpense({
              name: data.name,
              amount: data.amount,
              category: data.category ?? 'Inne',
              date,
            })
          } else {
            console.warn('DemoDataProvider brak – wydatek nie został zapisany')
          }
        } else {
          await expensesApi.create({
            name: data.name,
            amount: data.amount,
            category: data.category ?? 'Inne',
            date,
          })
          await invalidateFinanceQueries(queryClient, userId)
        }
      }
    },
    [isDemoMode, demoData, queryClient, userId],
  )

  return { submit }
}
