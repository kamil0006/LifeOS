import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useDemoData } from '../context/DemoDataContext'
import { expensesApi, incomeApi } from '../lib/api'
import { invalidateFinanceQueries } from '../lib/invalidateFinanceQueries'
import { EXPENSE_CATEGORY_NONE } from '../lib/expenseCategoryConstants'
import type { PaymentMethod } from '../lib/paymentMethod'

export type TransactionFormData = {
  name: string
  amount: number
  category?: string
  date: string
  paymentMethod: PaymentMethod
}
export type TransactionUpdateData = TransactionFormData & { recurring?: boolean }

/**
 * Wspólna logika zapisu przychodu/wydatku (Transakcje + skróty globalne).
 */
export function useFinanceTransactionSubmit() {
  const { user, isLoggedIn, sessionReady, isDemoMode } = useAuth()
  const queryClient = useQueryClient()
  const demoData = useDemoData()
  const userId = user?.id ?? ''
  const useApi = sessionReady && isLoggedIn && !isDemoMode

  const submit = useCallback(
    async (formType: 'income' | 'expense', data: TransactionFormData) => {
      const date = data.date ?? new Date().toISOString().split('T')[0]
      if (formType === 'income') {
        const category = data.category ?? EXPENSE_CATEGORY_NONE
        if (!useApi) {
          if (demoData) {
            demoData.addIncome({
              source: data.name,
              amount: data.amount,
              date,
              recurring: false,
              category,
              paymentMethod: data.paymentMethod,
            })
          } else {
            console.warn('DemoDataProvider brak – przychód nie został zapisany')
          }
        } else {
          await incomeApi.create({
            source: data.name,
            amount: data.amount,
            date,
            category,
            paymentMethod: data.paymentMethod,
          })
          await invalidateFinanceQueries(queryClient, userId)
        }
      } else {
        if (!useApi) {
          if (demoData) {
            demoData.addExpense({
              name: data.name,
              amount: data.amount,
              category: data.category ?? EXPENSE_CATEGORY_NONE,
              date,
              paymentMethod: data.paymentMethod,
            })
          } else {
            console.warn('DemoDataProvider brak – wydatek nie został zapisany')
          }
        } else {
          await expensesApi.create({
            name: data.name,
            amount: data.amount,
            category: data.category ?? EXPENSE_CATEGORY_NONE,
            date,
            paymentMethod: data.paymentMethod,
          })
          await invalidateFinanceQueries(queryClient, userId)
        }
      }
    },
    [useApi, demoData, queryClient, userId],
  )

  const submitUpdate = useCallback(
    async (formType: 'income' | 'expense', id: string, data: TransactionUpdateData) => {
      const date = data.date ?? new Date().toISOString().split('T')[0]
      if (formType === 'income') {
        if (!useApi) {
          demoData?.updateIncome(id, {
            source: data.name,
            amount: data.amount,
            date,
            recurring: data.recurring ?? false,
            category: data.category ?? EXPENSE_CATEGORY_NONE,
            paymentMethod: data.paymentMethod,
          })
        } else {
          await incomeApi.update(id, {
            source: data.name,
            amount: data.amount,
            date,
            recurring: data.recurring,
            category: data.category ?? EXPENSE_CATEGORY_NONE,
            paymentMethod: data.paymentMethod,
          })
          await invalidateFinanceQueries(queryClient, userId)
        }
      } else if (!useApi) {
        demoData?.updateExpense(id, {
          name: data.name,
          amount: data.amount,
          category: data.category ?? EXPENSE_CATEGORY_NONE,
          date,
          paymentMethod: data.paymentMethod,
        })
      } else {
        await expensesApi.update(id, {
          name: data.name,
          amount: data.amount,
          category: data.category ?? EXPENSE_CATEGORY_NONE,
          date,
          paymentMethod: data.paymentMethod,
        })
        await invalidateFinanceQueries(queryClient, userId)
      }
    },
    [useApi, demoData, queryClient, userId]
  )

  return { submit, submitUpdate }
}
