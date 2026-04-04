import { expensesApi, incomeApi, scheduledExpensesApi } from './api'
import type { ExpenseRow, IncomeRow, ScheduledExpenseRow } from './financeTypes'

export async function fetchExpensesList(): Promise<ExpenseRow[]> {
  const rows = await expensesApi.getAll()
  return rows.map((e) => ({ ...e, date: e.date.split('T')[0] }))
}

export async function fetchIncomeList(): Promise<IncomeRow[]> {
  const rows = await incomeApi.getAll()
  return rows.map((i) => ({ ...i, date: i.date.split('T')[0] }))
}

export async function fetchScheduledExpensesList(): Promise<ScheduledExpenseRow[]> {
  return scheduledExpensesApi.getAll()
}
